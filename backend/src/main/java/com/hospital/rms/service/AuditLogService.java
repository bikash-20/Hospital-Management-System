package com.hospital.rms.service;

import com.hospital.rms.dto.AuditLogResponse;
import com.hospital.rms.entity.AuditLog;
import com.hospital.rms.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getRecent(int limit) {
        return auditLogRepository.findTopNByOrderByTimestampDesc(limit).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getByEntity(String entityName) {
        return auditLogRepository.findByEntityNameOrderByTimestampDesc(entityName).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getByEntityAndId(String entityName, String entityId) {
        return auditLogRepository.findByEntityNameAndEntityIdOrderByTimestampDesc(entityName, entityId).stream()
            .map(this::toResponse)
            .toList();
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return AuditLogResponse.builder()
            .id(log.getId())
            .entityName(log.getEntityName())
            .operation(log.getOperation())
            .entityId(log.getEntityId())
            .oldValues(log.getOldValues())
            .newValues(log.getNewValues())
            .userId(log.getUserId())
            .userName(log.getUserName())
            .timestamp(log.getTimestamp())
            .build();
    }
}
