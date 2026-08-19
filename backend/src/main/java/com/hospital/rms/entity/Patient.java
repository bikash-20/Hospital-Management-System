package com.hospital.rms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "patients", indexes = {
    @Index(name = "idx_patient_uhid", columnList = "uhid", unique = true),
    @Index(name = "idx_patient_mobile", columnList = "mobileNumber"),
    @Index(name = "idx_patient_name", columnList = "fullName")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 20)
    private String uhid;

    @Column(nullable = false, length = 200)
    private String fullName;

    @Column(nullable = false, length = 15)
    private String mobileNumber;

    @Column(nullable = false)
    private LocalDate dob;

    @Column(nullable = false, length = 10)
    private String gender;

    @Column(length = 30)
    private String nid;

    @Column(length = 500)
    private String address;

    @CreationTimestamp
    private LocalDateTime createdDate;

    @UpdateTimestamp
    private LocalDateTime lastModifiedDate;
}
