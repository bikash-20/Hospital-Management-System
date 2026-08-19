package com.hospital.rms.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class DashboardStatsResponse {
    long patientsToday;
    long appointmentsToday;
    long bedsAvailable;
    long bedsTotal;
    BigDecimal revenue;
    long pendingBills;
}