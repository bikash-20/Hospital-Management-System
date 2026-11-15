package com.hospital.rms.service;

import com.hospital.rms.dto.BedBookingRequest;
import com.hospital.rms.dto.BedBookingResponse;
import com.hospital.rms.dto.PublicAppointmentRequest;
import com.hospital.rms.dto.PublicAppointmentResponse;
import com.hospital.rms.dto.SeatAvailabilityResponse;
import com.hospital.rms.entity.Appointment;
import com.hospital.rms.entity.AuditLog;
import com.hospital.rms.entity.Bed;
import com.hospital.rms.entity.BedBooking;
import com.hospital.rms.entity.Billing;
import com.hospital.rms.entity.Patient;
import com.hospital.rms.entity.User;
import com.hospital.rms.enums.AppointmentStatus;
import com.hospital.rms.enums.BedStatus;
import com.hospital.rms.enums.BedType;
import com.hospital.rms.enums.BookingStatus;
import com.hospital.rms.enums.PaymentStatus;
import com.hospital.rms.enums.Role;
import com.hospital.rms.repository.AppointmentRepository;
import com.hospital.rms.repository.AuditLogRepository;
import com.hospital.rms.repository.BedBookingRepository;
import com.hospital.rms.repository.BedRepository;
import com.hospital.rms.repository.BillingRepository;
import com.hospital.rms.repository.PatientRepository;
import com.hospital.rms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PublicHospitalService {

    private final BedRepository bedRepository;
    private final BedBookingRepository bedBookingRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final SequenceService sequenceService;
    private final BillingRepository billingRepository;
    private final AuditLogRepository auditLogRepository;
    private final AppointmentRepository appointmentRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public SeatAvailabilityResponse getSeatAvailability() {
        long totalBeds = bedRepository.count();
        long totalAvailable = bedRepository.countByStatus(BedStatus.AVAILABLE);

        SeatAvailabilityResponse.BedTypeStat icu = buildStat(BedType.ICU, BigDecimal.valueOf(5000.00));
        SeatAvailabilityResponse.BedTypeStat emergency = buildStat(BedType.EMERGENCY, BigDecimal.valueOf(2500.00));
        SeatAvailabilityResponse.BedTypeStat general = buildStat(BedType.GENERAL, BigDecimal.valueOf(800.00));
        SeatAvailabilityResponse.BedTypeStat cabin = buildStat(BedType.CABIN, BigDecimal.valueOf(3500.00));

        List<User> doctors = userRepository.findByRole(Role.DOCTOR);
        List<SeatAvailabilityResponse.DoctorInfo> doctorInfos = doctors.stream()
            .map(d -> SeatAvailabilityResponse.DoctorInfo.builder()
                .id(d.getId().toString())
                .name(d.getFullName())
                .email(d.getEmail())
                .specialization("General Medicine & Clinical Specialist")
                .available(d.isEnabled())
                .build())
            .toList();

        return SeatAvailabilityResponse.builder()
            .icu(icu)
            .emergency(emergency)
            .general(general)
            .cabin(cabin)
            .totalBeds(totalBeds)
            .totalAvailable(totalAvailable)
            .activeDoctors(doctorInfos)
            .build();
    }

    private SeatAvailabilityResponse.BedTypeStat buildStat(BedType type, BigDecimal defaultRate) {
        long total = bedRepository.countByBedType(type);
        long available = bedRepository.countByBedTypeAndStatus(type, BedStatus.AVAILABLE);
        long occupied = total - available;
        return SeatAvailabilityResponse.BedTypeStat.builder()
            .type(type.name())
            .available(available)
            .total(total)
            .occupied(Math.max(0, occupied))
            .dailyRate(defaultRate)
            .build();
    }

    @Transactional
    public BedBookingResponse createBooking(BedBookingRequest request) {
        String cleanPhone = request.getGuestPhone() != null
            ? request.getGuestPhone().replaceAll("[\\s-]+", "")
            : "";

        // Find existing patient by mobile or auto-register new Patient in the hospital system
        Optional<Patient> existingPatient = patientRepository.findByMobileNumber(cleanPhone).stream().findFirst();
        Patient patient;
        if (existingPatient.isPresent()) {
            patient = existingPatient.get();
        } else {
            String uhid = generateUhid();
            int age = request.getGuestAge() > 0 ? request.getGuestAge() : 35;
            LocalDate estimatedDob = LocalDate.now().minusYears(age);
            patient = Patient.builder()
                .uhid(uhid)
                .fullName(request.getGuestName() != null && !request.getGuestName().isBlank() ? request.getGuestName().trim() : "Emergency Patient")
                .mobileNumber(cleanPhone)
                .dob(estimatedDob)
                .gender(request.getGuestGender() != null ? request.getGuestGender().toUpperCase() : "MALE")
                .nid(request.getGuestNid() != null && !request.getGuestNid().isBlank() ? request.getGuestNid().trim() : null)
                .address("Online Emergency Admission")
                .build();
            patient = patientRepository.save(patient);
            log.info("Auto-registered new patient {} ({}) from public seat reservation", patient.getFullName(), uhid);
        }

        // Generate booking reference e.g. CBA-20261115-XXXX
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long seq = sequenceService.next("booking:" + datePrefix, 100);
        String bookingRef = "CBA-" + datePrefix + "-" + String.format("%04d", seq);

        // Check if an available bed exists for the requested bed type
        Optional<Bed> availableBedOpt = bedRepository.findFirstByBedTypeAndStatus(request.getBedType(), BedStatus.AVAILABLE);

        Bed assignedBed = null;
        BookingStatus status = BookingStatus.PENDING;

        if (availableBedOpt.isPresent()) {
            assignedBed = availableBedOpt.get();
            assignedBed.setStatus(BedStatus.OCCUPIED);
            assignedBed.setPatient(patient); // Automatically link patient to the assigned bed
            bedRepository.save(assignedBed);
            status = BookingStatus.CONFIRMED;
            log.info("Auto-confirmed booking {} for bed {} ({}) to patient {}", bookingRef, assignedBed.getBedNumber(), request.getBedType(), patient.getUhid());
        } else {
            log.warn("No immediate available bed for type {}. Booking marked PENDING.", request.getBedType());
        }

        BigDecimal rate = assignedBed != null ? assignedBed.getDailyRate() : getDefaultRate(request.getBedType());
        BigDecimal paymentAmt = request.getPaymentAmount() != null && request.getPaymentAmount().compareTo(BigDecimal.ZERO) > 0
            ? request.getPaymentAmount() : rate;

        BedBooking booking = BedBooking.builder()
            .bookingReference(bookingRef)
            .patient(patient)
            .guestName(patient.getFullName())
            .guestPhone(cleanPhone)
            .guestNid(patient.getNid())
            .guestGender(patient.getGender())
            .guestAge(request.getGuestAge())
            .bedType(request.getBedType())
            .status(status)
            .assignedBed(assignedBed)
            .paymentMethod(request.getPaymentMethod().toUpperCase())
            .paymentTrxId(request.getPaymentTrxId())
            .paymentAmount(paymentAmt)
            .paymentStatus("PAID")
            .symptoms(request.getSymptoms())
            .notes(request.getNotes())
            .build();

        BedBooking saved = bedBookingRepository.save(booking);

        // Auto-generate hospital Billing Invoice so Cashier & Admin see it immediately in Billing
        try {
            long billSeq = sequenceService.next("billing:" + datePrefix, 1);
            String invoiceNumber = "INV-" + datePrefix + "-" + String.format("%04d", billSeq);
            String lineItemsJson = String.format(
                "[{\"description\":\"Admission Deposit - %s Bed (%s)\",\"amount\":%.2f,\"quantity\":1}]",
                request.getBedType().name(), bookingRef, paymentAmt.doubleValue()
            );

            Billing invoice = Billing.builder()
                .patient(patient)
                .invoiceNumber(invoiceNumber)
                .totalAmount(paymentAmt)
                .paidAmount(paymentAmt)
                .discount(BigDecimal.ZERO)
                .status(PaymentStatus.PAID)
                .lineItems(lineItemsJson)
                .build();
            billingRepository.save(invoice);
            log.info("Auto-generated deposit invoice {} for patient {}", invoiceNumber, patient.getUhid());
        } catch (Exception ex) {
            log.warn("Could not generate billing invoice for booking {}: {}", bookingRef, ex.getMessage());
        }

        // Record AuditLog for hospital activity tracking
        try {
            AuditLog audit = AuditLog.builder()
                .entityName("BedBooking")
                .operation("CREATE")
                .entityId(saved.getId().toString())
                .oldValues(null)
                .newValues(String.format("Emergency Reservation: %s (%s) assigned to Bed %s [%s]",
                    patient.getFullName(), request.getBedType(),
                    assignedBed != null ? assignedBed.getBedNumber() : "WAITING",
                    bookingRef))
                .userId("PUBLIC_GUEST")
                .userName("CareBridge Online Admission")
                .build();
            auditLogRepository.save(audit);
        } catch (Exception ex) {
            log.warn("Could not write audit log for booking {}: {}", bookingRef, ex.getMessage());
        }

        return toResponse(saved);
    }

    private String generateUhid() {
        String prefix = "SYL-" + Year.now().getValue() + "-";
        int maxExisting = patientRepository.findMaxSequenceNumber(prefix);
        long seq = sequenceService.next("patient:" + Year.now().getValue(), maxExisting);
        return prefix + String.format("%05d", seq);
    }

    @Transactional(readOnly = true)
    public BedBookingResponse getBookingByReference(String reference) {
        BedBooking booking = bedBookingRepository.findByBookingReference(reference)
            .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + reference));
        return toResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BedBookingResponse> getAllBookings() {
        return bedBookingRepository.findAll().stream()
            .map(this::toResponse)
            .toList();
    }

    private BigDecimal getDefaultRate(BedType type) {
        return switch (type) {
            case ICU -> BigDecimal.valueOf(5000.00);
            case EMERGENCY -> BigDecimal.valueOf(2500.00);
            case CABIN -> BigDecimal.valueOf(3500.00);
            default -> BigDecimal.valueOf(800.00);
        };
    }

    @Transactional
    public PublicAppointmentResponse createAppointment(PublicAppointmentRequest request) {
        String cleanPhone = request.getPatientPhone() != null
            ? request.getPatientPhone().replaceAll("[\\s-]+", "")
            : "";

        // Check if patient exists by phone or auto-register new patient in hospital system
        Optional<Patient> existingPatient = patientRepository.findByMobileNumber(cleanPhone).stream().findFirst();
        Patient patient;
        if (existingPatient.isPresent()) {
            patient = existingPatient.get();
        } else {
            String uhid = generateUhid();
            int age = request.getPatientAge() > 0 ? request.getPatientAge() : 30;
            LocalDate estimatedDob = LocalDate.now().minusYears(age);
            patient = Patient.builder()
                .uhid(uhid)
                .fullName(request.getPatientName() != null && !request.getPatientName().isBlank() ? request.getPatientName().trim() : "OPD Patient")
                .mobileNumber(cleanPhone)
                .dob(estimatedDob)
                .gender(request.getPatientGender() != null ? request.getPatientGender().toUpperCase() : "MALE")
                .nid(request.getPatientNid() != null && !request.getPatientNid().isBlank() ? request.getPatientNid().trim() : null)
                .address("Online Doctor Appointment")
                .build();
            patient = patientRepository.save(patient);
            log.info("Auto-registered new patient {} ({}) from public appointment portal", patient.getFullName(), uhid);
        }

        // Verify selected doctor
        User doctor = userRepository.findById(request.getDoctorId())
            .orElseThrow(() -> new IllegalArgumentException("Doctor not found: " + request.getDoctorId()));

        // Token allocation: next sequential token for this doctor on the appointment date
        LocalDate day = request.getAppointmentDate().toLocalDate();
        LocalDateTime dayStart = day.atStartOfDay();
        LocalDateTime dayEnd = day.atTime(LocalTime.MAX);

        int maxToken = appointmentRepository.findMaxTokenForDoctorOnDay(doctor.getId(), dayStart, dayEnd);
        String sequenceKey = "appointment:" + doctor.getId() + ":" + day;
        long nextToken = sequenceService.next(sequenceKey, maxToken);

        Appointment appointment = Appointment.builder()
            .patient(patient)
            .doctor(doctor)
            .appointmentDate(request.getAppointmentDate())
            .tokenNumber(Math.toIntExact(nextToken))
            .status(AppointmentStatus.WAITING)
            .build();

        Appointment saved = appointmentRepository.save(appointment);

        // Broadcast real-time queue update to doctor dashboard via WebSocket
        try {
            messagingTemplate.convertAndSend("/topic/queue/" + doctor.getId(),
                appointmentRepository.findByDoctorIdAndAppointmentDateBetween(doctor.getId(), dayStart, dayEnd));
        } catch (Exception ex) {
            log.warn("Could not broadcast appointment WebSocket update: {}", ex.getMessage());
        }

        // AuditLog
        try {
            AuditLog audit = AuditLog.builder()
                .entityName("Appointment")
                .operation("CREATE")
                .entityId(saved.getId().toString())
                .oldValues(null)
                .newValues(String.format("Public Appointment: %s booked with Dr. %s (Token #%d)",
                    patient.getFullName(), doctor.getFullName(), saved.getTokenNumber()))
                .userId("PUBLIC_GUEST")
                .userName("CareBridge Public Portal")
                .build();
            auditLogRepository.save(audit);
        } catch (Exception ex) {
            log.warn("Could not write audit log for appointment: {}", ex.getMessage());
        }

        return PublicAppointmentResponse.builder()
            .id(saved.getId())
            .tokenNumber(saved.getTokenNumber())
            .appointmentDate(saved.getAppointmentDate())
            .status(saved.getStatus())
            .doctorId(doctor.getId())
            .doctorName(doctor.getFullName())
            .patientId(patient.getId())
            .patientUhid(patient.getUhid())
            .patientName(patient.getFullName())
            .patientPhone(cleanPhone)
            .patientAge(request.getPatientAge())
            .patientGender(patient.getGender())
            .symptoms(request.getSymptoms())
            .createdDate(saved.getCreatedDate())
            .qrData("CAREBRIDGE-APPT:" + saved.getId() + ":" + doctor.getId() + ":" + saved.getTokenNumber())
            .build();
    }

    @Transactional(readOnly = true)
    public List<SeatAvailabilityResponse.DoctorInfo> getActiveDoctors() {
        return userRepository.findByRole(Role.DOCTOR).stream()
            .map(d -> SeatAvailabilityResponse.DoctorInfo.builder()
                .id(d.getId().toString())
                .name(d.getFullName())
                .email(d.getEmail())
                .specialization("General Medicine & Clinical Specialist")
                .available(d.isEnabled())
                .build())
            .toList();
    }

    private BedBookingResponse toResponse(BedBooking b) {
        String bedNum = b.getAssignedBed() != null ? b.getAssignedBed().getBedNumber() : "TBD (Triage Waiting)";
        String wardName = b.getAssignedBed() != null ? b.getAssignedBed().getWardName() : "Emergency Admission Holding";
        BigDecimal rate = b.getAssignedBed() != null ? b.getAssignedBed().getDailyRate() : getDefaultRate(b.getBedType());

        return BedBookingResponse.builder()
            .id(b.getId())
            .bookingReference(b.getBookingReference())
            .uhid(b.getPatient() != null ? b.getPatient().getUhid() : "GUEST-" + b.getGuestPhone().substring(Math.max(0, b.getGuestPhone().length() - 4)))
            .guestName(b.getGuestName())
            .guestPhone(b.getGuestPhone())
            .guestNid(b.getGuestNid())
            .guestGender(b.getGuestGender())
            .guestAge(b.getGuestAge())
            .bedType(b.getBedType())
            .status(b.getStatus())
            .assignedBedId(b.getAssignedBed() != null ? b.getAssignedBed().getId() : null)
            .assignedBedNumber(bedNum)
            .assignedWard(wardName)
            .dailyRate(rate)
            .paymentMethod(b.getPaymentMethod())
            .paymentTrxId(b.getPaymentTrxId())
            .paymentAmount(b.getPaymentAmount())
            .paymentStatus(b.getPaymentStatus())
            .symptoms(b.getSymptoms())
            .notes(b.getNotes())
            .createdDate(b.getCreatedDate())
            .qrData("CAREBRIDGE-AI:" + b.getBookingReference() + ":" + b.getBedType() + ":" + b.getPaymentTrxId())
            .build();
    }
}
