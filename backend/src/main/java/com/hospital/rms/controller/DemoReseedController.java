package com.hospital.rms.controller;

import com.hospital.rms.entity.*;
import com.hospital.rms.enums.*;
import com.hospital.rms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Re-seeds date-sensitive demo data (appointments, prescriptions, billing) using
 * <b>today's</b> date. Useful when the original DataSeeder ran on a previous day
 * and the dashboard's "today" filters (Patients Today, Appointments, Revenue
 * Today) all return 0 because the seed dates are stale.
 *
 * <p>Available on all profiles, but gated by {@code app.demo-reset-token} (the
 * same token used by DemoAccountResetController). Without the matching
 * X-Demo-Reset-Token header the endpoint returns 404. This keeps the endpoint
 * accessible on the public demo deployment (where the owner needs to refresh
 * the seed daily) without leaving it open on a real production deployment
 * where the env var isn't set.
 */
@RestController
@RequestMapping("/api/setup")
@RequiredArgsConstructor
@Slf4j
public class DemoReseedController {

    @Value("${app.demo-reset-token:}")
    private String configuredResetToken;

    private final UserRepository userRepo;
    private final PatientRepository patientRepo;
    private final AppointmentRepository appointmentRepo;
    private final PrescriptionRepository prescriptionRepo;
    private final BillingRepository billingRepo;
    private final BedRepository bedRepo;

    @PostMapping("/reseed-today")
    @Transactional
    public ResponseEntity<Map<String, Object>> reseedToday(
            @RequestHeader(value = "X-Demo-Reset-Token", required = false) String resetToken) {
        if (configuredResetToken.isBlank() || !configuredResetToken.equals(resetToken)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        User drRahim = userRepo.findByUsername("dr.rahim").orElseThrow();
        User drSara  = userRepo.findByUsername("dr.sara").orElseThrow();

        List<Patient> patients = patientRepo.findAll();
        if (patients.size() < 6) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Need at least 6 patients to reseed demo data. Found " + patients.size() + "."
            ));
        }

        // ── Clear old date-bound data ──────────────────────────
        // Order matters: prescriptions → appointments → billing, due to FKs.
        prescriptionRepo.deleteAllInBatch();
        appointmentRepo.deleteAllInBatch();
        billingRepo.deleteAllInBatch();

        // Re-detach any bed→patient links so the seed can re-assign cleanly.
        bedRepo.findAll().forEach(b -> b.setPatient(null));
        bedRepo.saveAll(bedRepo.findAll());

        // ── Appointments (all for today) ──────────────────────
        Appointment apt1 = apt(patients.get(0), drRahim, today.atTime(9, 0),  1, AppointmentStatus.IN_CONSULTATION);
        Appointment apt2 = apt(patients.get(1), drRahim, today.atTime(9, 30), 2, AppointmentStatus.WAITING);
        Appointment apt3 = apt(patients.get(2), drSara,  today.atTime(10, 0), 1, AppointmentStatus.COMPLETED);
        Appointment apt4 = apt(patients.get(3), drRahim, today.atTime(10, 0), 3, AppointmentStatus.WAITING);
        Appointment apt5 = apt(patients.get(4), drRahim, today.atTime(10, 30),4, AppointmentStatus.WAITING);
        Appointment apt6 = apt(patients.get(5), drSara,  today.atTime(11, 0), 2, AppointmentStatus.CANCELLED);
        appointmentRepo.saveAll(List.of(apt1, apt2, apt3, apt4, apt5, apt6));

        // ── Prescriptions ────────────────────────────────────
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

        // ── Billing (today) ──────────────────────────────────
        Billing bill1 = Billing.builder()
            .patient(patients.get(2))
            .invoiceNumber("INV-" + today.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")) + "-0001")
            .totalAmount(new BigDecimal("2500.00"))
            .discount(BigDecimal.ZERO)
            .paidAmount(BigDecimal.ZERO)
            .status(PaymentStatus.UNPAID)
            .lineItems("[{\"description\":\"Consultation Fee - Dr. Sara Khan\",\"quantity\":1,\"unitPrice\":800,\"total\":800},{\"description\":\"CBC Test\",\"quantity\":1,\"unitPrice\":500,\"total\":500},{\"description\":\"Chest X-Ray\",\"quantity\":1,\"unitPrice\":1200,\"total\":1200}]")
            .build();
        Billing bill2 = Billing.builder()
            .patient(patients.get(0))
            .invoiceNumber("INV-" + today.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")) + "-0002")
            .totalAmount(new BigDecimal("3500.00"))
            .discount(new BigDecimal("500.00"))
            .paidAmount(new BigDecimal("3000.00"))
            .status(PaymentStatus.PAID)
            .lineItems("[{\"description\":\"Consultation Fee - Dr. Rahim Ahmed\",\"quantity\":1,\"unitPrice\":1200,\"total\":1200},{\"description\":\"Lipid Profile Test\",\"quantity\":1,\"unitPrice\":800,\"total\":800},{\"description\":\"Renal Function Test\",\"quantity\":1,\"unitPrice\":700,\"total\":700},{\"description\":\"ECG\",\"quantity\":1,\"unitPrice\":800,\"total\":800}]")
            .build();
        Billing bill3 = Billing.builder()
            .patient(patients.get(4))
            .invoiceNumber("INV-" + today.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")) + "-0003")
            .totalAmount(new BigDecimal("1500.00"))
            .discount(BigDecimal.ZERO)
            .paidAmount(new BigDecimal("500.00"))
            .status(PaymentStatus.PARTIAL)
            .lineItems("[{\"description\":\"Consultation Fee - Dr. Rahim Ahmed\",\"quantity\":1,\"unitPrice\":1000,\"total\":1000},{\"description\":\"X-Ray Left Knee\",\"quantity\":1,\"unitPrice\":500,\"total\":500}]")
            .build();
        billingRepo.saveAll(List.of(bill1, bill2, bill3));

        // Re-link bed→patient assignments (same as DataSeeder's original mapping).
        linkBedToPatient("G-02", "General Ward A", patients.get(0));
        linkBedToPatient("G-05", "General Ward A", patients.get(2));
        linkBedToPatient("G-08", "General Ward A", patients.get(4));
        linkBedToPatient("S-01", "Semi-Private Ward", patients.get(1));
        linkBedToPatient("P-01", "Private Cabin", patients.get(3));
        linkBedToPatient("ICU-01", "ICU", patients.get(5));

        log.info("Reseeded {} appointments, {} prescriptions, {} billings for {}",
            6, 2, 3, today);

        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "date", today.toString(),
            "appointments", 6,
            "prescriptions", 2,
            "billings", 3
        ));
    }

    private Appointment apt(Patient p, User d, LocalDateTime when, int token, AppointmentStatus status) {
        return Appointment.builder()
            .patient(p).doctor(d)
            .appointmentDate(when).tokenNumber(token).status(status)
            .build();
    }

    private void linkBedToPatient(String bedNumber, String ward, Patient patient) {
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