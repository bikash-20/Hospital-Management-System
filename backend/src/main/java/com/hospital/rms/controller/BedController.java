package com.hospital.rms.controller;

import com.hospital.rms.dto.BedResponse;
import com.hospital.rms.dto.CreateBedRequest;
import com.hospital.rms.enums.BedStatus;
import com.hospital.rms.service.BedService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/beds")
@RequiredArgsConstructor
public class BedController {

    private final BedService bedService;

    /**
     * Add a new bed. Restricted to ADMIN and RECEPTIONIST — doctors, lab techs
     * and cashiers should not be modifying hospital layout.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    public ResponseEntity<BedResponse> create(@Valid @RequestBody CreateBedRequest request) {
        BedResponse created = bedService.create(request);
        return ResponseEntity
            .created(URI.create("/api/beds/" + created.getId()))
            .body(created);
    }

    /**
     * Remove a bed. Same role restriction as create.
     * Returns 204 No Content on success, 409 Conflict if the bed is OCCUPIED.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        bedService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BedResponse> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        BedStatus status = BedStatus.valueOf(body.get("status"));
        UUID patientId = body.containsKey("patientId") ? UUID.fromString(body.get("patientId")) : null;
        return ResponseEntity.ok(bedService.updateStatus(id, status, patientId));
    }

    @GetMapping
    public ResponseEntity<List<BedResponse>> getAll() {
        return ResponseEntity.ok(bedService.getAll());
    }

    @GetMapping("/ward/{wardName}")
    public ResponseEntity<List<BedResponse>> getByWard(@PathVariable String wardName) {
        return ResponseEntity.ok(bedService.getByWard(wardName));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<BedResponse>> getByStatus(@PathVariable BedStatus status) {
        return ResponseEntity.ok(bedService.getByStatus(status));
    }

    /** Distinct ward names — used by the "Add Bed" form dropdown. */
    @GetMapping("/wards")
    public ResponseEntity<List<String>> getWards() {
        return ResponseEntity.ok(bedService.getDistinctWardNames());
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        return ResponseEntity.ok(bedService.getSummary());
    }
}