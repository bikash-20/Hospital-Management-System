package com.hospital.rms.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor
public class BillingRequest {
    @NotNull
    private UUID patientId;

    private BigDecimal discount;

    private String lineItems; // JSON string

    // For payment processing
    private BigDecimal paidAmount;
}
