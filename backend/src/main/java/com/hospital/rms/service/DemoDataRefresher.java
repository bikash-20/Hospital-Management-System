package com.hospital.rms.service;

import com.hospital.rms.entity.*;
import com.hospital.rms.enums.*;
import com.hospital.rms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Keeps the demo dashboard meaningful on hosted demos by auto-refreshing
 * date-bound demo data (appointments, prescriptions, billing) on every
 * application startup.
 *
 * <p><b>Trigger</b>: if the database already has patients (i.e. the original
 * DataSeeder ran) AND there are zero appointments dated today, re-create the
 * date-bound records. Idempotent — once today's appointments exist, this is a
 * no-op. Safe to call repeatedly.
 *
 * <p><b>Disabled by default.</b> Opt in by setting {@code app.auto-reseed-demo=true}
 * (or the env var {@code AUTO_RESEED_DEMO=true}). A real production deployment
 * should never enable this — it overwrites seeded appointments. Demo
 * deployments on Render should enable it.
 *
 * <p>Runs after both user seeding (Order 1) and the initial DataSeeder (Order 2).
 */
@Component
@Order(3)
@RequiredArgsConstructor
@Slf4j
public class DemoDataRefresher implements ApplicationRunner {

    private final UserRepository userRepo;
    private final PatientRepository patientRepo;
    private final AppointmentRepository appointmentRepo;
    private final PrescriptionRepository prescriptionRepo;
    private final BillingRepository billingRepo;
    private final BedRepository bedRepo;

    @Value("${app.auto-reseed-demo:false}")
    private boolean autoReseedDemo;

    /** All "today" decisions in this class use the hospital's local zone
     *  (Asia/Dhaka) so they agree with DashboardService. Without this, a
     *  Render restart at 23:30 UTC could see "yesterday" and skip the
     *  refresh, while the dashboard operator in Bangladesh sees "today"
     *  with no appointments. */
    private static final ZoneId HOSPITAL_ZONE = ZoneId.of("Asia/Dhaka");

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!autoReseedDemo) {
            return;
        }

        // Only meaningful after the original DataSeeder has run at least once.
        long patientCount = patientRepo.count();
        if (patientCount == 0) {
            log.debug("auto-reseed-demo: no patients yet, skipping (DataSeeder will handle it)");
            return;
        }

        LocalDate today = LocalDate.now(HOSPITAL_ZONE);
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = today.plusDays(1).atStartOfDay();
        long todaysAppointments = appointmentRepo.countByAppointmentDateBetween(dayStart, dayEnd);

        if (todaysAppointments > 0) {
            log.info("auto-reseed-demo: {} appointment(s) already exist for {} — no refresh needed",
                todaysAppointments, today);
            return;
        }

        log.info("auto-reseed-demo: no appointments for {} — refreshing demo data", today);

        List<Patient> patients = patientRepo.findAll();
        if (patients.size() < 6) {
            log.warn("auto-reseed-demo: need at least 6 patients to refresh demo data. Found {} — skipping.",
                patients.size());
            return;
        }

        User drRahim = userRepo.findByUsername("dr.rahim").orElse(null);
        User drSara  = userRepo.findByUsername("dr.sara").orElse(null);
        if (drRahim == null || drSara == null) {
            log.warn("auto-reseed-demo: doctor users not found — skipping");
            return;
        }

        // Order matters due to FKs: prescriptions → appointments → billing.
        prescriptionRepo.deleteAllInBatch();
        appointmentRepo.deleteAllInBatch();
        billingRepo.deleteAllInBatch();

        // Detach bed→patient links before re-assigning.
        List<Bed> allBeds = bedRepo.findAll();
        allBeds.forEach(b -> b.setPatient(null));
        bedRepo.saveAll(allBeds);

        Appointment apt1 = apt(patients.get(0), drRahim, today.atTime(9, 0),  1, AppointmentStatus.IN_CONSULTATION);
        Appointment apt2 = apt(patients.get(1), drRahim, today.atTime(9, 30), 2, AppointmentStatus.WAITING);
        Appointment apt3 = apt(patients.get(2), drSara,  today.atTime(10, 0), 1, AppointmentStatus.COMPLETED);
        Appointment apt4 = apt(patients.get(3), drRahim, today.atTime(10, 0), 3, AppointmentStatus.WAITING);
        Appointment apt5 = apt(patients.get(4), drRahim, today.atTime(10, 30),4, AppointmentStatus.WAITING);
        Appointment apt6 = apt(patients.get(5), drSara,  today.atTime(11, 0), 2, AppointmentStatus.CANCELLED);
        appointmentRepo.saveAll(List.of(apt1, apt2, apt3, apt4, apt5, apt6));

        Prescription rx1 = Prescription.builder()
            .appointment(apt3).patient(patients.get(2)).doctor(drSara)
            .diagnosis("Acute Viral Bronchitis")
            .chiefComplaints("[\"Persistent cough for 5 days\",\"Low-grade fever\",\"Chest congestion\"]")
            .medicines("[{\"name\":\"Amoxicillin 500mg\",\"dosage\":\"500mg\",\"duration\":\"7 days\",\"frequency\":\"Three times daily\"},{\"name\":\"Salbutamol Inhaler\",\"dosage\":\"2 puffs\",\"duration\":\"14 days\",\"frequency\":\"As needed\"},{\"name\":\"Paracetamol 500mg\",\"dosage\":\"500mg\",\"duration\":\"5 days\",\"frequency\":\"When fever > 100F\"}]")
            .labOrders("[{\"testName\":\"CBC\",\"priority\":\"ROUTINE\",\"status\":\"COMPLETED\"},{\"testName\":\"Chest X-Ray\",\"priority\":\"URGENT\",\"status\":\"PENDING\"}]")
            .build();
        Prescription rx2 = Prescription.builder()
            .appointment(apt1).patient(patients.get(0)).doctor(drRahim)
            .diagnosis("Essential Hypertension - Stage 1")
            .chiefComplaints("[\"Headache for 2 weeks\",\"Occasional dizziness\",\"High BP readings at home\"]")
            .medicines("[{\"name\":\"Amlodipine 5mg\",\"dosage\":\"5mg\",\"duration\":\"30 days\",\"frequency\":\"Once daily (morning)\"},{\"name\":\"Losartan 50mg\",\"dosage\":\"50mg\",\"duration\":\"30 days\",\"frequency\":\"Once daily (evening)\"}]")
            .labOrders("[{\"testName\":\"Lipid Profile\",\"priority\":\"ROUTINE\",\"status\":\"PENDING\"},{\"testName\":\"Renal Function Test\",\"priority\":\"ROUTINE\",\"status\":\"PENDING\"},{\"testName\":\"ECG\",\"priority\":\"ROUTINE\",\"status\":\"PENDING\"}]")
            .build();
        prescriptionRepo.saveAll(List.of(rx1, rx2));

        String dateStr = today.format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        Billing bill1 = Billing.builder()
            .patient(patients.get(2))
            .invoiceNumber("INV-" + dateStr + "-0001")
            .totalAmount(new BigDecimal("2500.00"))
            .discount(BigDecimal.ZERO)
            .paidAmount(BigDecimal.ZERO)
            .status(PaymentStatus.UNPAID)
            .lineItems("[{\"description\":\"Consultation Fee - Dr. Sara Khan\",\"quantity\":1,\"unitPrice\":800,\"total\":800},{\"description\":\"CBC Test\",\"quantity\":1,\"unitPrice\":500,\"total\":500},{\"description\":\"Chest X-Ray\",\"quantity\":1,\"unitPrice\":1200,\"total\":1200}]")
            .build();
        Billing bill2 = Billing.builder()
            .patient(patients.get(0))
            .invoiceNumber("INV-" + dateStr + "-0002")
            .totalAmount(new BigDecimal("3500.00"))
            .discount(new BigDecimal("500.00"))
            .paidAmount(new BigDecimal("3000.00"))
            .status(PaymentStatus.PAID)
            .lineItems("[{\"description\":\"Consultation Fee - Dr. Rahim Ahmed\",\"quantity\":1,\"unitPrice\":1200,\"total\":1200},{\"description\":\"Lipid Profile Test\",\"quantity\":1,\"unitPrice\":800,\"total\":800},{\"description\":\"Renal Function Test\",\"quantity\":1,\"unitPrice\":700,\"total\":700},{\"description\":\"ECG\",\"quantity\":1,\"unitPrice\":800,\"total\":800}]")
            .build();
        Billing bill3 = Billing.builder()
            .patient(patients.get(4))
            .invoiceNumber("INV-" + dateStr + "-0003")
            .totalAmount(new BigDecimal("1500.00"))
            .discount(BigDecimal.ZERO)
            .paidAmount(new BigDecimal("500.00"))
            .status(PaymentStatus.PARTIAL)
            .lineItems("[{\"description\":\"Consultation Fee - Dr. Rahim Ahmed\",\"quantity\":1,\"unitPrice\":1000,\"total\":1000},{\"description\":\"X-Ray Left Knee\",\"quantity\":1,\"unitPrice\":500,\"total\":500}]")
            .build();
        billingRepo.saveAll(List.of(bill1, bill2, bill3));

        // Re-link bed→patient assignments.
        linkBed("G-02", "General Ward A", patients.get(0));
        linkBed("G-05", "General Ward A", patients.get(2));
        linkBed("G-08", "General Ward A", patients.get(4));
        linkBed("S-01", "Semi-Private Ward", patients.get(1));
        linkBed("P-01", "Private Cabin", patients.get(3));
        linkBed("ICU-01", "ICU", patients.get(5));

        log.info("auto-reseed-demo: ✅ Refreshed 6 appointments, 2 prescriptions, 3 billings for {}",
            today);
    }

    private Appointment apt(Patient p, User d, LocalDateTime when, int token, AppointmentStatus status) {
        return Appointment.builder()
            .patient(p).doctor(d)
            .appointmentDate(when).tokenNumber(token).status(status)
            .build();
    }

    private void linkBed(String bedNumber, String ward, Patient patient) {
        bedRepo.findByWardName(ward).stream()
            .filter(b -> bedNumber.equals(b.getBedNumber()))
            .findFirst()
            .ifPresent(b -> {
                b.setPatient(patient);
                b.setStatus(BedStatus.OCCUPIED);
                bedRepo.save(b);
            });
    }
}