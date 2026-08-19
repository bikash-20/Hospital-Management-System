package com.hospital.rms.service;

import com.hospital.rms.dto.DashboardStatsResponse;
import com.hospital.rms.enums.BedStatus;
import com.hospital.rms.enums.PaymentStatus;
import com.hospital.rms.repository.AppointmentRepository;
import com.hospital.rms.repository.BedRepository;
import com.hospital.rms.repository.BillingRepository;
import com.hospital.rms.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final BedRepository bedRepository;
    private final BillingRepository billingRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        LocalDate today = LocalDate.now();
        long patientsToday = patientRepository.countByCreatedDateBetween(today.atStartOfDay(), today.plusDays(1).atStartOfDay());
        long appointmentsToday = appointmentRepository.countByAppointmentDateBetween(today.atStartOfDay(), today.plusDays(1).atStartOfDay());
        long bedsAvailable = bedRepository.countByStatus(BedStatus.AVAILABLE);
        long bedsTotal = bedRepository.count();
        BigDecimal revenue = billingRepository.sumPaidAmountBetween(today.atStartOfDay(), today.plusDays(1).atStartOfDay());
        long pendingBills = billingRepository.countByStatus(PaymentStatus.UNPAID) + billingRepository.countByStatus(PaymentStatus.PARTIAL);

        return DashboardStatsResponse.builder()
            .patientsToday(patientsToday)
            .appointmentsToday(appointmentsToday)
            .bedsAvailable(bedsAvailable)
            .bedsTotal(bedsTotal)
            .revenue(revenue != null ? revenue : BigDecimal.ZERO)
            .pendingBills(pendingBills)
            .build();
    }
}