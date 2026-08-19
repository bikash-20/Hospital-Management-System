package com.hospital.rms.controller;

import com.hospital.rms.dto.BedResponse;
import com.hospital.rms.enums.BedStatus;
import com.hospital.rms.service.BedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/beds")
@RequiredArgsConstructor
public class BedController {

    private final BedService bedService;

    @PatchMapping("/{id}/status")
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

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        return ResponseEntity.ok(bedService.getSummary());
    }
}
