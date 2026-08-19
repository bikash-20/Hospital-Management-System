package com.hospital.rms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "lab_results", indexes = {
    @Index(name = "idx_lab_patient", columnList = "patient_id"),
    @Index(name = "idx_lab_appointment", columnList = "appointment_id"),
    @Index(name = "idx_lab_status", columnList = "status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LabResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ordered_by_id", nullable = false)
    private User orderedBy;

    @Column(nullable = false, length = 200)
    private String testName;

    @Column(length = 50)
    private String priority; // ROUTINE, URGENT

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "PENDING"; // PENDING, IN_PROGRESS, COMPLETED

    @Column(columnDefinition = "TEXT")
    private String resultValue;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime completedAt;

    @CreationTimestamp
    private LocalDateTime createdDate;

    @UpdateTimestamp
    private LocalDateTime lastModifiedDate;
}
