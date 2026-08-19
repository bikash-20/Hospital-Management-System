package com.hospital.rms.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor
public class PrescriptionRequest {
    @NotNull
    private UUID appointmentId;

    private String diagnosis;

    private String chiefComplaints; // JSON string

    private String medicines; // JSON string: [{name, dosage, duration}]

    private String labOrders; // JSON string: [{testName, notes}]
}
