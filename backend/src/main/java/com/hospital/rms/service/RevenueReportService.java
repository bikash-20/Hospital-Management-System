package com.hospital.rms.service;

import com.hospital.rms.dto.RevenueReportResponse;
import com.hospital.rms.enums.PaymentStatus;
import com.hospital.rms.repository.BillingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RevenueReportService {

    private final BillingRepository billingRepository;

    @Transactional(readOnly = true)
    public RevenueReportResponse getOverallReport() {
        BigDecimal totalRevenue = billingRepository.sumAllTotalAmount();
        BigDecimal totalCollected = billingRepository.sumAllPaidAmount();
        BigDecimal totalDiscount = billingRepository.sumAllDiscounts();
        BigDecimal totalPending = totalRevenue.subtract(totalCollected).max(BigDecimal.ZERO);

        long totalInvoices = billingRepository.count();
        long paidInvoices = billingRepository.countByStatus(PaymentStatus.PAID);
        long unpaidInvoices = billingRepository.countByStatus(PaymentStatus.UNPAID);
        long partialInvoices = billingRepository.countByStatus(PaymentStatus.PARTIAL);

        Map<String, BigDecimal> revenueByStatus = billingRepository.getRevenueByStatus().stream()
            .collect(Collectors.toMap(
                row -> ((PaymentStatus) row[0]).name(),
                row -> (BigDecimal) row[1],
                (a, b) -> b,
                LinkedHashMap::new
            ));

        return RevenueReportResponse.builder()
            .totalRevenue(totalRevenue)
            .totalCollected(totalCollected)
            .totalPending(totalPending)
            .totalDiscount(totalDiscount)
            .totalInvoices(totalInvoices)
            .paidInvoices(paidInvoices)
            .unpaidInvoices(unpaidInvoices)
            .partialInvoices(partialInvoices)
            .revenueByStatus(revenueByStatus)
            .dailyBreakdown(List.of())
            .build();
    }

    @Transactional(readOnly = true)
    public RevenueReportResponse getReportByDateRange(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        BigDecimal totalRevenue = billingRepository.sumTotalAmountBetween(start, end);
        BigDecimal totalCollected = billingRepository.sumPaidAmountBetween(start, end);
        BigDecimal totalPending = totalRevenue.subtract(totalCollected).max(BigDecimal.ZERO);

        List<Object[]> dailyData = billingRepository.getDailyRevenueBetween(start, end);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        List<RevenueReportResponse.DailyRevenue> dailyBreakdown = dailyData.stream()
            .map(row -> RevenueReportResponse.DailyRevenue.builder()
                .date(row[0].toString())
                .revenue((BigDecimal) row[1])
                .invoiceCount((Long) row[2])
                .build())
            .toList();

        Map<String, BigDecimal> revenueByStatus = billingRepository.getRevenueByStatus().stream()
            .collect(Collectors.toMap(
                row -> ((PaymentStatus) row[0]).name(),
                row -> (BigDecimal) row[1],
                (a, b) -> b,
                LinkedHashMap::new
            ));

        return RevenueReportResponse.builder()
            .totalRevenue(totalRevenue)
            .totalCollected(totalCollected)
            .totalPending(totalPending)
            .totalDiscount(BigDecimal.ZERO)
            .totalInvoices(dailyData.stream().mapToLong(row -> (Long) row[2]).sum())
            .paidInvoices(0)
            .unpaidInvoices(0)
            .partialInvoices(0)
            .dailyBreakdown(dailyBreakdown)
            .revenueByStatus(revenueByStatus)
            .build();
    }

    @Transactional(readOnly = true)
    public RevenueReportResponse getTodayReport() {
        LocalDate today = LocalDate.now();
        return getReportByDateRange(today, today);
    }

    @Transactional(readOnly = true)
    public RevenueReportResponse getThisWeekReport() {
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.minusDays(today.getDayOfWeek().getValue() - 1);
        return getReportByDateRange(startOfWeek, today);
    }

    @Transactional(readOnly = true)
    public RevenueReportResponse getThisMonthReport() {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        return getReportByDateRange(startOfMonth, today);
    }
}
