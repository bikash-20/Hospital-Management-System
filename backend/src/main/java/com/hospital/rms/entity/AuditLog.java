package com.hospital.rms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String entityName;

    @Column(nullable = false, length = 50)
    private String operation; // CREATE, UPDATE, DELETE

    @Column(nullable = false)
    private String entityId;

    @Column(columnDefinition = "TEXT")
    private String oldValues;

    @Column(columnDefinition = "TEXT")
    private String newValues;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false, length = 200)
    private String userName;

    @CreationTimestamp
    private LocalDateTime timestamp;
}
