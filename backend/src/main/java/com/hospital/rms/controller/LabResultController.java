package com.hospital.rms.controller;

import com.hospital.rms.dto.LabResultRequest;
import com.hospital.rms.dto.LabResultResponse;
import com.hospital.rms.service.LabResultService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/lab-results")
@RequiredArgsConstructor
public class LabResultController {

    private final LabResultService labResultService;

    @PostMapping
    public ResponseEntity<LabResultResponse> createLabResult(
            @Valid @RequestBody LabResultRequest request,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(labResultService.createLabResult(request, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LabResultResponse> updateLabResult(
            @PathVariable UUID id,
            @Valid @RequestBody LabResultRequest request) {
        return ResponseEntity.ok(labResultService.updateLabResult(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<LabResultResponse> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(labResultService.updateStatus(id, status));
    }

    @GetMapping
    public ResponseEntity<List<LabResultResponse>> getAll(
            @RequestParam(required = false) String status) {
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(labResultService.getByStatus(status));
        }
        return ResponseEntity.ok(labResultService.getAll());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<LabResultResponse>> getByPatient(@PathVariable UUID patientId) {
        return ResponseEntity.ok(labResultService.getByPatient(patientId));
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<List<LabResultResponse>> getByAppointment(
            @PathVariable UUID appointmentId) {
        return ResponseEntity.ok(labResultService.getByAppointment(appointmentId));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(Map.of(
            "pending", labResultService.countByStatus("PENDING"),
            "inProgress", labResultService.countByStatus("IN_PROGRESS"),
            "completed", labResultService.countByStatus("COMPLETED")
        ));
    }
}
