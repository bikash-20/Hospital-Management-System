package com.hospital.rms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DoctorScheduleResponse {
    private UUID id;
    private UUID doctorId;
    private String doctorName;
    private DayOfWeek dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private boolean active;
}
