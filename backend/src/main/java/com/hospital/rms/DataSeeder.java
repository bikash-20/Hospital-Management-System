package com.hospital.rms;

import com.hospital.rms.entity.*;
import com.hospital.rms.enums.*;
import com.hospital.rms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final PatientRepository patientRepo;
    private final BedRepository bedRepo;
    private final AppointmentRepository appointmentRepo;
    private final PrescriptionRepository prescriptionRepo;
    private final BillingRepository billingRepo;
    private final UserRepository userRepo;

    @Override
    public void run(String... args) {
        if (patientRepo.count() > 0) {
            log.info("Database already has data — skipping seed");
            return;
        }

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        // ── Doctors (already seeded as users) ────────────────
        User drRahim = userRepo.findByUsername("dr.rahim").orElseThrow();
        User drSara  = userRepo.findByUsername("dr.sara").orElseThrow();

        // ── Patients ─────────────────────────────────────────
        List<Patient> patients = List.of(
            createPatient("SYL-2026-0001", "Mohammad Rahim Uddin", "01712345678",
                LocalDate.of(1985, 3, 15), "MALE", "1234567890123", "22 Zindabazar, Sylhet"),
            createPatient("SYL-2026-0002", "Sabrina Akter", "01812345678",
                LocalDate.of(1992, 7, 22), "FEMALE", "2345678901234", "15 Mirabazar, Sylhet"),
            createPatient("SYL-2026-0003", "Abdul Karim", "01912345678",
                LocalDate.of(1978, 11, 8), "MALE", "3456789012345", "8 Ambarkhana, Sylhet"),
            createPatient("SYL-2026-0004", "Rashida Khatun", "01612345678",
                LocalDate.of(1995, 5, 30), "FEMALE", "4567890123456", "31 Kumarghata, Sylhet"),
            createPatient("SYL-2026-0005", "Jamal Hossain", "01512345678",
                LocalDate.of(1970, 1, 20), "MALE", "5678901234567", "5 Subid Bazar, Sylhet"),
            createPatient("SYL-2026-0006", "Nasima Begum", "01312345678",
                LocalDate.of(1988, 9, 12), "FEMALE", "6781234567890", "42 Shibganj, Sylhet")
        );
        patientRepo.saveAll(patients);
        log.info("Seeded {} patients", patients.size());

        // ── Beds ─────────────────────────────────────────────
        List<Bed> beds = List.of(
            // General Ward A
            createBed("G-01", "General Ward A", BedStatus.AVAILABLE),
            createBed("G-02", "General Ward A", BedStatus.OCCUPIED, patients.get(0)),
            createBed("G-03", "General Ward A", BedStatus.AVAILABLE),
            createBed("G-04", "General Ward A", BedStatus.UNDER_CLEANING),
            createBed("G-05", "General Ward A", BedStatus.OCCUPIED, patients.get(2)),
            createBed("G-06", "General Ward A", BedStatus.AVAILABLE),
            createBed("G-07", "General Ward A", BedStatus.AVAILABLE),
            createBed("G-08", "General Ward A", BedStatus.OCCUPIED, patients.get(4)),
            // Semi-Private Ward
            createBed("S-01", "Semi-Private Ward", BedStatus.OCCUPIED, patients.get(1)),
            createBed("S-02", "Semi-Private Ward", BedStatus.AVAILABLE),
            createBed("S-03", "Semi-Private Ward", BedStatus.AVAILABLE),
            createBed("S-04", "Semi-Private Ward", BedStatus.UNDER_CLEANING),
            // Private Cabin
            createBed("P-01", "Private Cabin", BedStatus.OCCUPIED, patients.get(3)),
            createBed("P-02", "Private Cabin", BedStatus.AVAILABLE),
            createBed("P-03", "Private Cabin", BedStatus.AVAILABLE),
            // ICU
            createBed("ICU-01", "ICU", BedStatus.OCCUPIED, patients.get(5)),
            createBed("ICU-02", "ICU", BedStatus.OCCUPIED),
            createBed("ICU-03", "ICU", BedStatus.AVAILABLE),
            createBed("ICU-04", "ICU", BedStatus.UNDER_CLEANING),
            // Emergency
            createBed("EM-01", "Emergency", BedStatus.AVAILABLE),
            createBed("EM-02", "Emergency", BedStatus.OCCUPIED),
            createBed("EM-03", "Emergency", BedStatus.AVAILABLE)
        );
        bedRepo.saveAll(beds);
        log.info("Seeded {} beds", beds.size());

        // ── Appointments (all for today) ─────────────────────
        Appointment apt1 = createAppointment(patients.get(0), drRahim,
            today.atTime(9, 0), 1, AppointmentStatus.IN_CONSULTATION);
        Appointment apt2 = createAppointment(patients.get(1), drRahim,
            today.atTime(9, 30), 2, AppointmentStatus.WAITING);
        Appointment apt3 = createAppointment(patients.get(2), drSara,
            today.atTime(10, 0), 1, AppointmentStatus.COMPLETED);
        Appointment apt4 = createAppointment(patients.get(3), drRahim,
            today.atTime(10, 0), 3, AppointmentStatus.WAITING);
        Appointment apt5 = createAppointment(patients.get(4), drRahim,
            today.atTime(10, 30), 4, AppointmentStatus.WAITING);
        Appointment apt6 = createAppointment(patients.get(5), drSara,
            today.atTime(11, 0), 2, AppointmentStatus.CANCELLED);
        appointmentRepo.saveAll(List.of(apt1, apt2, apt3, apt4, apt5, apt6));
        log.info("Seeded 6 appointments for today");

        // ── Prescriptions (for completed + in-consultation appointments) ──
        Prescription rx1 = Prescription.builder()
            .appointment(apt3)
            .patient(patients.get(2))
            .doctor(drSara)
            .diagnosis("Acute Viral Bronchitis")
            .chiefComplaints("[\"Persistent cough for 5 days\",\"Low-grade fever\",\"Chest congestion\"]")
            .medicines("[{\"name\":\"Amoxicillin 500mg\",\"dosage\":\"500mg\",\"duration\":\"7 days\",\"frequency\":\"Three times daily\"},{\"name\":\"Salbutamol Inhaler\",\"dosage\":\"2 puffs\",\"duration\":\"14 days\",\"frequency\":\"As needed\"},{\"name\":\"Paracetamol 500mg\",\"dosage\":\"500mg\",\"duration\":\"5 days\",\"frequency\":\"When fever > 100F\"}]")
            .labOrders("[{\"testName\":\"CBC\",\"priority\":\"ROUTINE\",\"status\":\"COMPLETED\"},{\"testName\":\"Chest X-Ray\",\"priority\":\"URGENT\",\"status\":\"PENDING\"}]")
            .build();
        Prescription rx2 = Prescription.builder()
            .appointment(apt1)
            .patient(patients.get(0))
            .doctor(drRahim)
            .diagnosis("Essential Hypertension - Stage 1")
            .chiefComplaints("[\"Headache for 2 weeks\",\"Occasional dizziness\",\"High BP readings at home\"]")
            .medicines("[{\"name\":\"Amlodipine 5mg\",\"dosage\":\"5mg\",\"duration\":\"30 days\",\"frequency\":\"Once daily (morning)\"},{\"name\":\"Losartan 50mg\",\"dosage\":\"50mg\",\"duration\":\"30 days\",\"frequency\":\"Once daily (evening)\"}]")
            .labOrders("[{\"testName\":\"Lipid Profile\",\"priority\":\"ROUTINE\",\"status\":\"PENDING\"},{\"testName\":\"Renal Function Test\",\"priority\":\"ROUTINE\",\"status\":\"PENDING\"},{\"testName\":\"ECG\",\"priority\":\"ROUTINE\",\"status\":\"PENDING\"}]")
            .build();
        prescriptionRepo.saveAll(List.of(rx1, rx2));
        log.info("Seeded 2 prescriptions");

        // ── Billing ──────────────────────────────────────────
        Billing bill1 = Billing.builder()
            .patient(patients.get(2))
            .invoiceNumber("INV-2026-0001")
            .totalAmount(new BigDecimal("2500.00"))
            .discount(BigDecimal.ZERO)
            .paidAmount(BigDecimal.ZERO)
            .status(PaymentStatus.UNPAID)
            .lineItems("[{\"description\":\"Consultation Fee - Dr. Sara Khan\",\"quantity\":1,\"unitPrice\":800,\"total\":800},{\"description\":\"CBC Test\",\"quantity\":1,\"unitPrice\":500,\"total\":500},{\"description\":\"Chest X-Ray\",\"quantity\":1,\"unitPrice\":1200,\"total\":1200}]")
            .build();
        Billing bill2 = Billing.builder()
            .patient(patients.get(0))
            .invoiceNumber("INV-2026-0002")
            .totalAmount(new BigDecimal("3500.00"))
            .discount(new BigDecimal("500.00"))
            .paidAmount(new BigDecimal("3000.00"))
            .status(PaymentStatus.PAID)
            .lineItems("[{\"description\":\"Consultation Fee - Dr. Rahim Ahmed\",\"quantity\":1,\"unitPrice\":1200,\"total\":1200},{\"description\":\"Lipid Profile Test\",\"quantity\":1,\"unitPrice\":800,\"total\":800},{\"description\":\"Renal Function Test\",\"quantity\":1,\"unitPrice\":700,\"total\":700},{\"description\":\"ECG\",\"quantity\":1,\"unitPrice\":800,\"total\":800}]")
            .build();
        Billing bill3 = Billing.builder()
            .patient(patients.get(4))
            .invoiceNumber("INV-2026-0003")
            .totalAmount(new BigDecimal("1500.00"))
            .discount(BigDecimal.ZERO)
            .paidAmount(new BigDecimal("500.00"))
            .status(PaymentStatus.PARTIAL)
            .lineItems("[{\"description\":\"Consultation Fee - Dr. Rahim Ahmed\",\"quantity\":1,\"unitPrice\":1000,\"total\":1000},{\"description\":\"X-Ray Left Knee\",\"quantity\":1,\"unitPrice\":500,\"total\":500}]")
            .build();
        billingRepo.saveAll(List.of(bill1, bill2, bill3));
        log.info("Seeded 3 billing records");

        log.info("✅ Demo data seeded successfully!");
    }

    private Patient createPatient(String uhid, String name, String mobile,
                                   LocalDate dob, String gender, String nid, String address) {
        return Patient.builder()
            .uhid(uhid).fullName(name).mobileNumber(mobile)
            .dob(dob).gender(gender).nid(nid).address(address)
            .build();
    }

    private Bed createBed(String number, String ward, BedStatus status) {
        return Bed.builder().bedNumber(number).wardName(ward).status(status).build();
    }

    private Bed createBed(String number, String ward, BedStatus status, Patient patient) {
        return Bed.builder().bedNumber(number).wardName(ward).status(status).patient(patient).build();
    }

    private Appointment createAppointment(Patient patient, User doctor,
                                           LocalDateTime date, int token, AppointmentStatus status) {
        return Appointment.builder()
            .patient(patient).doctor(doctor)
            .appointmentDate(date).tokenNumber(token).status(status)
            .build();
    }
}
