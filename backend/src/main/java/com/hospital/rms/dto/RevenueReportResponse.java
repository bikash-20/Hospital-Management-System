package com.hospital.rms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RevenueReportResponse {
    private BigDecimal totalRevenue;
    private BigDecimal totalCollected;
    private BigDecimal totalPending;
    private BigDecimal totalDiscount;
    private long totalInvoices;
    private long paidInvoices;
    private long unpaidInvoices;
    private long partialInvoices;
    private List<DailyRevenue> dailyBreakdown;
    private Map<String, BigDecimal> revenueByStatus;

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DailyRevenue {
        private String date;
        private BigDecimal revenue;
        private long invoiceCount;
    }
}
