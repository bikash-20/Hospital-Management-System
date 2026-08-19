package com.hospital.rms.repository;

import com.hospital.rms.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByEntityNameAndEntityIdOrderByTimestampDesc(String entityName, String entityId);
    List<AuditLog> findTop50ByOrderByTimestampDesc();
    List<AuditLog> findTopNByOrderByTimestampDesc(int limit);
    List<AuditLog> findByEntityNameOrderByTimestampDesc(String entityName);
}
