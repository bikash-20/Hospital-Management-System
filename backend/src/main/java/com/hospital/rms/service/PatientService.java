package com.hospital.rms.service;

import com.hospital.rms.dto.PatientRequest;
import com.hospital.rms.dto.PatientResponse;
import com.hospital.rms.entity.Patient;
import com.hospital.rms.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;

    @Transactional
    public PatientResponse register(PatientRequest request) {
        // Duplicate detection: check matching mobile + DOB
        patientRepository.findByMobileNumberAndDob(request.getMobileNumber(), request.getDob())
            .ifPresent(existing -> {
                throw new IllegalArgumentException(
                    "Duplicate patient found: " + existing.getFullName() +
                    " (UHID: " + existing.getUhid() + ") with same mobile and DOB"
                );
            });

        String uhid = generateUhid();

        Patient patient = Patient.builder()
            .uhid(uhid)
            .fullName(request.getFullName())
            .mobileNumber(request.getMobileNumber())
            .dob(request.getDob())
            .gender(request.getGender())
            .nid(request.getNid())
            .address(request.getAddress())
            .build();

        Patient saved = patientRepository.save(patient);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PatientResponse getById(UUID id) {
        Patient patient = patientRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Patient not found: " + id));
        return toResponse(patient);
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> search(String query) {
        return patientRepository.findByFullNameContainingIgnoreCase(query).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> getAll() {
        return patientRepository.findAll().stream()
            .map(this::toResponse)
            .toList();
    }

    private String generateUhid() {
        String prefix = "SYL-" + Year.now().getValue() + "-";
        int seq = patientRepository.findMaxSequenceNumber(prefix) + 1;
        return prefix + String.format("%05d", seq);
    }

    private PatientResponse toResponse(Patient p) {
        return PatientResponse.builder()
            .id(p.getId())
            .uhid(p.getUhid())
            .fullName(p.getFullName())
            .mobileNumber(p.getMobileNumber())
            .dob(p.getDob())
            .gender(p.getGender())
            .nid(p.getNid())
            .address(p.getAddress())
            .createdDate(p.getCreatedDate())
            .build();
    }
}
