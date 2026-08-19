package com.hospital.rms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PrescriptionResponse {
    private UUID id;
    private UUID appointmentId;
    private PatientResponse patient;
    private String doctorName;
    private String diagnosis;
    private String chiefComplaints;
    private String medicines;
    private String labOrders;
    private LocalDateTime createdDate;
}
