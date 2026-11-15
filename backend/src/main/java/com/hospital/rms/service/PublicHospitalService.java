package com.hospital.rms.service;

import com.hospital.rms.dto.BedBookingRequest;
import com.hospital.rms.dto.BedBookingResponse;
import com.hospital.rms.dto.SeatAvailabilityResponse;
import com.hospital.rms.entity.Bed;
import com.hospital.rms.entity.BedBooking;
import com.hospital.rms.entity.Patient;
import com.hospital.rms.entity.User;
import com.hospital.rms.enums.BedStatus;
import com.hospital.rms.enums.BedType;
import com.hospital.rms.enums.BookingStatus;
import com.hospital.rms.enums.Role;
import com.hospital.rms.repository.BedBookingRepository;
import com.hospital.rms.repository.BedRepository;
import com.hospital.rms.repository.PatientRepository;
import com.hospital.rms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
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
        // Find existing patient by phone or link
        Optional<Patient> existingPatient = patientRepository.findByMobileNumber(request.getGuestPhone()).stream().findFirst();
        Patient patient = existingPatient.orElse(null);

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
            if (patient != null) {
                assignedBed.setPatient(patient);
            }
            bedRepository.save(assignedBed);
            status = BookingStatus.CONFIRMED;
            log.info("Auto-confirmed booking {} for bed {} ({})", bookingRef, assignedBed.getBedNumber(), request.getBedType());
        } else {
            log.warn("No immediate available bed for type {}. Booking marked PENDING.", request.getBedType());
        }

        BigDecimal rate = assignedBed != null ? assignedBed.getDailyRate() : getDefaultRate(request.getBedType());
        BigDecimal paymentAmt = request.getPaymentAmount() != null && request.getPaymentAmount().compareTo(BigDecimal.ZERO) > 0
            ? request.getPaymentAmount() : rate;

        BedBooking booking = BedBooking.builder()
            .bookingReference(bookingRef)
            .patient(patient)
            .guestName(request.getGuestName())
            .guestPhone(request.getGuestPhone())
            .guestNid(request.getGuestNid())
            .guestGender(request.getGuestGender())
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
        return toResponse(saved);
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
