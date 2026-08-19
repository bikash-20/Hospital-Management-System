package com.hospital.rms.dto;

import com.hospital.rms.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BillingResponse {
    private UUID id;
    private PatientResponse patient;
    private String invoiceNumber;
    private BigDecimal totalAmount;
    private BigDecimal discount;
    private BigDecimal paidAmount;
    private PaymentStatus status;
    private String lineItems;
    private LocalDateTime createdDate;
}
