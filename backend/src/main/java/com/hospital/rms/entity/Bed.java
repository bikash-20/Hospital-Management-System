package com.hospital.rms.entity;

import com.hospital.rms.enums.BedStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "beds", indexes = {
    @Index(name = "idx_bed_status", columnList = "status"),
    @Index(name = "idx_bed_ward", columnList = "wardName")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Bed {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 20)
    private String bedNumber;

    @Column(nullable = false, length = 50)
    private String wardName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BedStatus status = BedStatus.AVAILABLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @CreationTimestamp
    private LocalDateTime createdDate;

    @UpdateTimestamp
    private LocalDateTime lastModifiedDate;
}
