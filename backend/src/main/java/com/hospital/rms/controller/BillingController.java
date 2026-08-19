package com.hospital.rms.controller;

import com.hospital.rms.dto.BillingRequest;
import com.hospital.rms.dto.BillingResponse;
import com.hospital.rms.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @PostMapping
    public ResponseEntity<BillingResponse> createInvoice(@Valid @RequestBody BillingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(billingService.createInvoice(request));
    }

    @PostMapping("/{id}/payment")
    public ResponseEntity<BillingResponse> processPayment(
            @PathVariable UUID id,
            @RequestBody Map<String, BigDecimal> body) {
        return ResponseEntity.ok(billingService.processPayment(id, body.get("amount")));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<BillingResponse>> getByPatient(@PathVariable UUID patientId) {
        return ResponseEntity.ok(billingService.getByPatient(patientId));
    }

    @GetMapping("/unpaid")
    public ResponseEntity<List<BillingResponse>> getUnpaid() {
        return ResponseEntity.ok(billingService.getUnpaid());
    }

    @GetMapping
    public ResponseEntity<List<BillingResponse>> getAll() {
        return ResponseEntity.ok(billingService.getAll());
    }
}
