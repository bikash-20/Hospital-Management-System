package com.hospital.rms.controller;

import com.hospital.rms.dto.AppointmentRequest;
import com.hospital.rms.dto.AppointmentResponse;
import com.hospital.rms.enums.AppointmentStatus;
import com.hospital.rms.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public ResponseEntity<AppointmentResponse> create(@Valid @RequestBody AppointmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.create(request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AppointmentResponse> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        AppointmentStatus status = AppointmentStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(appointmentService.updateStatus(id, status));
    }

    @GetMapping("/queue/{doctorId}")
    public ResponseEntity<List<AppointmentResponse>> getQueue(@PathVariable UUID doctorId) {
        return ResponseEntity.ok(appointmentService.getQueueForDoctor(doctorId));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<AppointmentResponse>> getByPatient(@PathVariable UUID patientId) {
        return ResponseEntity.ok(appointmentService.getByPatient(patientId));
    }

    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(appointmentService.getAll(page, size));
    }
}
