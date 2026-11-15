package com.hospital.rms.dto;

import com.hospital.rms.enums.AppointmentStatus;
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
public class PublicAppointmentResponse {
    private UUID id;
    private int tokenNumber;
    private LocalDateTime appointmentDate;
    private AppointmentStatus status;
    private UUID doctorId;
    private String doctorName;
    private UUID patientId;
    private String patientUhid;
    private String patientName;
    private String patientPhone;
    private int patientAge;
    private String patientGender;
    private String symptoms;
    private LocalDateTime createdDate;
    private String qrData;
}
