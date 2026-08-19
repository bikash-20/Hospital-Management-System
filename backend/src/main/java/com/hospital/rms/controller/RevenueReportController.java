package com.hospital.rms.controller;

import com.hospital.rms.dto.RevenueReportResponse;
import com.hospital.rms.service.RevenueReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class RevenueReportController {

    private final RevenueReportService reportService;

    @GetMapping("/revenue")
    public ResponseEntity<RevenueReportResponse> getOverallReport() {
        return ResponseEntity.ok(reportService.getOverallReport());
    }

    @GetMapping("/revenue/today")
    public ResponseEntity<RevenueReportResponse> getTodayReport() {
        return ResponseEntity.ok(reportService.getTodayReport());
    }

    @GetMapping("/revenue/week")
    public ResponseEntity<RevenueReportResponse> getThisWeekReport() {
        return ResponseEntity.ok(reportService.getThisWeekReport());
    }

    @GetMapping("/revenue/month")
    public ResponseEntity<RevenueReportResponse> getThisMonthReport() {
        return ResponseEntity.ok(reportService.getThisMonthReport());
    }

    @GetMapping("/revenue/range")
    public ResponseEntity<RevenueReportResponse> getReportByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(reportService.getReportByDateRange(start, end));
    }
}
