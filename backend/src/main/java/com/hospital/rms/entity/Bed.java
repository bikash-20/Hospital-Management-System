package com.hospital.rms.entity;

import com.hospital.rms.enums.BedStatus;
import com.hospital.rms.enums.BedType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "beds", indexes = {
    @Index(name = "idx_bed_status", columnList = "status"),
    @Index(name = "idx_bed_ward", columnList = "wardName"),
    @Index(name = "idx_bed_type", columnList = "bedType")
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
    @Column(length = 50)
    @Builder.Default
    private BedType bedType = BedType.GENERAL;

    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal dailyRate = BigDecimal.valueOf(800.00);

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
