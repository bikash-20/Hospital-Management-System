package com.hospital.rms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatAvailabilityResponse {
    private BedTypeStat icu;
    private BedTypeStat emergency;
    private BedTypeStat general;
    private BedTypeStat cabin;
    private long totalBeds;
    private long totalAvailable;
    private List<DoctorInfo> activeDoctors;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BedTypeStat {
        private String type;
        private long available;
        private long total;
        private long occupied;
        private BigDecimal dailyRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DoctorInfo {
        private String id;
        private String name;
        private String email;
        private String specialization;
        private boolean available;
    }
}
