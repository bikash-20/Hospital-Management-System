package com.hospital.rms.entity;

import com.hospital.rms.enums.BedType;
import com.hospital.rms.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bed_bookings", indexes = {
    @Index(name = "idx_booking_reference", columnList = "bookingReference", unique = true),
    @Index(name = "idx_booking_phone", columnList = "guestPhone"),
    @Index(name = "idx_booking_status", columnList = "status"),
    @Index(name = "idx_booking_bed_type", columnList = "bedType")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BedBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String bookingReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @Column(nullable = false, length = 200)
    private String guestName;

    @Column(nullable = false, length = 20)
    private String guestPhone;

    @Column(length = 30)
    private String guestNid;

    @Column(nullable = false, length = 10)
    private String guestGender;

    @Column(nullable = false)
    private int guestAge;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private BedType bedType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private BookingStatus status = BookingStatus.CONFIRMED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_bed_id")
    private Bed assignedBed;

    @Column(nullable = false, length = 50)
    private String paymentMethod; // BKASH, NAGAD, UPAY, CASH

    @Column(nullable = false, length = 100)
    private String paymentTrxId;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal paymentAmount = BigDecimal.ZERO;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String paymentStatus = "PAID";

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    private LocalDateTime createdDate;

    @UpdateTimestamp
    private LocalDateTime lastModifiedDate;
}
