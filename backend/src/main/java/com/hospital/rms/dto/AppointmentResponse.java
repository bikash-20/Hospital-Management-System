package com.hospital.rms.dto;

import com.hospital.rms.enums.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AppointmentResponse {
    private UUID id;
    private PatientResponse patient;
    private String doctorName;
    private UUID doctorId;
    private LocalDateTime appointmentDate;
    private Integer tokenNumber;
    private AppointmentStatus status;
    private LocalDateTime createdDate;
}
