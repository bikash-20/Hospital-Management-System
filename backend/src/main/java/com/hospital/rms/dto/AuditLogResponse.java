package com.hospital.rms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLogResponse {
    private UUID id;
    private String entityName;
    private String operation;
    private String entityId;
    private String oldValues;
    private String newValues;
    private String userId;
    private String userName;
    private LocalDateTime timestamp;
}
