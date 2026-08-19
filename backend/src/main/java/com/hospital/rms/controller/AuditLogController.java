package com.hospital.rms.controller;

import com.hospital.rms.dto.AuditLogResponse;
import com.hospital.rms.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> getRecent(
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(auditLogService.getRecent(limit));
    }

    @GetMapping("/entity/{entityName}")
    public ResponseEntity<List<AuditLogResponse>> getByEntity(
            @PathVariable String entityName,
            @RequestParam(required = false) String entityId) {
        if (entityId != null) {
            return ResponseEntity.ok(auditLogService.getByEntityAndId(entityName, entityId));
        }
        return ResponseEntity.ok(auditLogService.getByEntity(entityName));
    }
}
