package com.hospital.rms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LabResultRequest {
    @NotNull(message = "Appointment ID is required")
    private UUID appointmentId;

    @NotNull(message = "Patient ID is required")
    private UUID patientId;

    @NotBlank(message = "Test name is required")
    private String testName;

    private String priority; // ROUTINE, URGENT

    private String resultValue;

    private String notes;
}
