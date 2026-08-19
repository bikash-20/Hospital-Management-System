package com.hospital.rms.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor
public class AppointmentRequest {
    @NotNull
    private UUID patientId;

    @NotNull
    private UUID doctorId;

    @NotNull
    private LocalDateTime appointmentDate;
}
