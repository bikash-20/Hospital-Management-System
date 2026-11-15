package com.hospital.rms.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicAppointmentRequest {

    @NotBlank(message = "Patient name is required")
    private String patientName;

    @NotBlank(message = "Mobile number is required")
    private String patientPhone;

    @Min(value = 0, message = "Age must be valid")
    private int patientAge;

    @NotBlank(message = "Gender is required")
    private String patientGender;

    private String patientNid;

    @NotNull(message = "Doctor selection is required")
    private UUID doctorId;

    @NotNull(message = "Appointment date and time is required")
    private LocalDateTime appointmentDate;

    private String symptoms;
}
