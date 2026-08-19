package com.hospital.rms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PatientResponse {
    private UUID id;
    private String uhid;
    private String fullName;
    private String mobileNumber;
    private LocalDate dob;
    private String gender;
    private String nid;
    private String address;
    private LocalDateTime createdDate;
}
