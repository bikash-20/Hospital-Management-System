package com.hospital.rms.controller;

import com.hospital.rms.dto.PrescriptionRequest;
import com.hospital.rms.dto.PrescriptionResponse;
import com.hospital.rms.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @PostMapping
    public ResponseEntity<PrescriptionResponse> create(
            @Valid @RequestBody PrescriptionRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
            prescriptionService.create(request, authentication.getName())
        );
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<PrescriptionResponse>> getByPatient(@PathVariable UUID patientId) {
        return ResponseEntity.ok(prescriptionService.getByPatient(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<PrescriptionResponse>> getByDoctor(@PathVariable UUID doctorId) {
        return ResponseEntity.ok(prescriptionService.getByDoctor(doctorId));
    }

    @GetMapping
    public ResponseEntity<List<PrescriptionResponse>> getAll() {
        return ResponseEntity.ok(prescriptionService.getAll());
    }
}
