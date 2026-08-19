package com.hospital.rms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LabResultResponse {
    private UUID id;
    private UUID appointmentId;
    private PatientResponse patient;
    private String orderedByName;
    private String testName;
    private String priority;
    private String status;
    private String resultValue;
    private String notes;
    private LocalDateTime completedAt;
    private LocalDateTime createdDate;
}
