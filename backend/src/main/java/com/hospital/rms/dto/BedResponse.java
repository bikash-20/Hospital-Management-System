package com.hospital.rms.dto;

import com.hospital.rms.enums.BedStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BedResponse {
    private UUID id;
    private String bedNumber;
    private String wardName;
    private BedStatus status;
    private String patientName;
    private UUID patientId;
}
