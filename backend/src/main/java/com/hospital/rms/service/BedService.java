package com.hospital.rms.service;

import com.hospital.rms.dto.BedResponse;
import com.hospital.rms.entity.Bed;
import com.hospital.rms.enums.BedStatus;
import com.hospital.rms.repository.BedRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BedService {

    private final BedRepository bedRepository;

    @Transactional
    public BedResponse updateStatus(UUID bedId, BedStatus newStatus, UUID patientId) {
        Bed bed = bedRepository.findById(bedId)
            .orElseThrow(() -> new IllegalArgumentException("Bed not found: " + bedId));

        bed.setStatus(newStatus);
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
