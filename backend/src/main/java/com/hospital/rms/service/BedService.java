package com.hospital.rms.service;

import com.hospital.rms.dto.BedResponse;
import com.hospital.rms.dto.CreateBedRequest;
import com.hospital.rms.entity.Bed;
import com.hospital.rms.entity.Patient;
import com.hospital.rms.enums.BedStatus;
import com.hospital.rms.repository.BedRepository;
import com.hospital.rms.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BedService {

    private final BedRepository bedRepository;
    private final PatientRepository patientRepository;

    /**
     * Create a new bed. New beds always start in the AVAILABLE state
     * and are not pre-assigned to a patient.
     *
     * Throws IllegalArgumentException if a bed with the same (wardName, bedNumber)
     * already exists, or IllegalStateException if the DB-level unique index trips
     * (race condition between the existence check and the insert).
     */
    @Transactional
    public BedResponse create(CreateBedRequest request) {
        String wardName = request.getWardName().trim();
        String bedNumber = request.getBedNumber().trim();

        if (bedRepository.existsByWardNameAndBedNumber(wardName, bedNumber)) {
            throw new IllegalArgumentException(
                "Bed '" + bedNumber + "' already exists in ward '" + wardName + "'");
        }

        Bed bed = Bed.builder()
            .bedNumber(bedNumber)
            .wardName(wardName)
            .status(BedStatus.AVAILABLE)
            .build();

        try {
            Bed saved = bedRepository.save(bed);
            return toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            // Race-condition fallback: a concurrent request inserted the same bed
            // between our existsBy check and save().
            throw new IllegalStateException(
                "Bed '" + bedNumber + "' already exists in ward '" + wardName + "'");
        }
    }

    /**
     * Remove a bed from the system.
     *
     * An OCCUPIED bed cannot be deleted — the patient must be discharged first.
     * AVAILABLE and UNDER_CLEANING beds are removed directly.
     */
    @Transactional
    public void delete(UUID bedId) {
        Bed bed = bedRepository.findById(bedId)
            .orElseThrow(() -> new IllegalArgumentException("Bed not found: " + bedId));

        if (bed.getStatus() == BedStatus.OCCUPIED) {
            throw new IllegalStateException(
                "Cannot delete an occupied bed. Discharge the patient (or mark the bed as AVAILABLE) before removing it.");
        }

        bedRepository.delete(bed);
    }

    /**
     * Update a bed's status. {@code patientId} semantics:
     * <ul>
     *   <li><b>OCCUPIED</b>: {@code patientId} is required — the bed is being assigned to a patient.</li>
     *   <li><b>AVAILABLE / UNDER_CLEANING</b>: {@code patientId} is ignored — the patient is discharged
     *       and the bed's {@code patient} field is cleared.</li>
     * </ul>
     */
    @Transactional
    public BedResponse updateStatus(UUID bedId, BedStatus newStatus, UUID patientId) {
        Bed bed = bedRepository.findById(bedId)
            .orElseThrow(() -> new IllegalArgumentException("Bed not found: " + bedId));

        bed.setStatus(newStatus);

        if (newStatus == BedStatus.OCCUPIED) {
            if (patientId == null) {
                throw new IllegalArgumentException(
                    "patientId is required when marking a bed as OCCUPIED");
            }
            Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found: " + patientId));
            bed.setPatient(patient);
        } else {
            // AVAILABLE and UNDER_CLEANING both clear any patient assignment.
            bed.setPatient(null);
        }

        Bed saved = bedRepository.save(bed);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BedResponse> getAll() {
        return bedRepository.findAll().stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<BedResponse> getByWard(String wardName) {
        return bedRepository.findByWardName(wardName).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<BedResponse> getByStatus(BedStatus status) {
        return bedRepository.findByStatus(status).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<String> getDistinctWardNames() {
        return bedRepository.findDistinctWardNames();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSummary() {
        long available = bedRepository.countByStatus(BedStatus.AVAILABLE);
        long occupied = bedRepository.countByStatus(BedStatus.OCCUPIED);
        long cleaning = bedRepository.countByStatus(BedStatus.UNDER_CLEANING);

        return Map.of(
            "available", available,
            "occupied", occupied,
            "underCleaning", cleaning,
            "total", available + occupied + cleaning
        );
    }

    private BedResponse toResponse(Bed b) {
        return BedResponse.builder()
            .id(b.getId())
            .bedNumber(b.getBedNumber())
            .wardName(b.getWardName())
            .status(b.getStatus())
            .patientName(b.getPatient() != null ? b.getPatient().getFullName() : null)
            .patientId(b.getPatient() != null ? b.getPatient().getId() : null)
            .build();
    }
}