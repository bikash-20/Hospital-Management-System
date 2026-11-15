package com.hospital.rms.dto;

import com.hospital.rms.enums.BedType;
import com.hospital.rms.enums.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BedBookingResponse {
    private UUID id;
    private String bookingReference;
    private String uhid;
    private String guestName;
    private String guestPhone;
    private String guestNid;
    private String guestGender;
    private int guestAge;
    private BedType bedType;
    private BookingStatus status;
    private UUID assignedBedId;
    private String assignedBedNumber;
    private String assignedWard;
    private BigDecimal dailyRate;
    private String paymentMethod;
    private String paymentTrxId;
    private BigDecimal paymentAmount;
    private String paymentStatus;
    private String symptoms;
    private String notes;
    private LocalDateTime createdDate;
    private String qrData;
}
