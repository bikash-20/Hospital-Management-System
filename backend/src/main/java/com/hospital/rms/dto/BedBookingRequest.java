package com.hospital.rms.dto;

import com.hospital.rms.enums.BedType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BedBookingRequest {

    @NotBlank(message = "Patient full name is required")
    private String guestName;

    @NotBlank(message = "Mobile number is required")
    private String guestPhone;

    private String guestNid;

    @NotBlank(message = "Gender is required")
    private String guestGender;

    @Min(value = 0, message = "Age must be valid")
    private int guestAge;

    @NotNull(message = "Bed/Seat type is required")
    private BedType bedType;

    @NotBlank(message = "Payment method is required (BKASH, NAGAD, UPAY, CASH)")
    private String paymentMethod;

    @NotBlank(message = "Payment transaction ID is required")
    private String paymentTrxId;

    private BigDecimal paymentAmount;

    private String symptoms;
    private String notes;
}
