package com.hospital.rms.controller;

import com.hospital.rms.dto.PatientRequest;
import com.hospital.rms.dto.PatientResponse;
import com.hospital.rms.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @PostMapping
    public ResponseEntity<PatientResponse> register(@Valid @RequestBody PatientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(patientService.register(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatientResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(patientService.getById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<PatientResponse>> search(@RequestParam String q) {
        return ResponseEntity.ok(patientService.search(q));
    }

    @GetMapping
    public ResponseEntity<List<PatientResponse>> getAll() {
        return ResponseEntity.ok(patientService.getAll());
    }
}
