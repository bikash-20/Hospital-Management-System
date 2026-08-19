package com.hospital.rms.service;

import com.hospital.rms.dto.AppointmentRequest;
import com.hospital.rms.dto.AppointmentResponse;
import com.hospital.rms.dto.PatientResponse;
import com.hospital.rms.entity.Appointment;
import com.hospital.rms.entity.Patient;
import com.hospital.rms.entity.User;
import com.hospital.rms.enums.AppointmentStatus;
import com.hospital.rms.repository.AppointmentRepository;
import com.hospital.rms.repository.PatientRepository;
import com.hospital.rms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final SequenceService sequenceService;

    @Transactional
    public AppointmentResponse create(AppointmentRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
            .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        User doctor = userRepository.findById(request.getDoctorId())
            .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));

        // Token allocation: next token for this doctor on this day
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
        broadcastQueueUpdate(doctor.getId());
        return toResponse(saved);
    }

    @Transactional
    public AppointmentResponse updateStatus(UUID appointmentId, AppointmentStatus newStatus) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

        appointment.setStatus(newStatus);
        Appointment saved = appointmentRepository.save(appointment);
        broadcastQueueUpdate(saved.getDoctor().getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getQueueForDoctor(UUID doctorId) {
        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = today.atTime(LocalTime.MAX);

        return appointmentRepository.findByDoctorIdAndAppointmentDateBetween(doctorId, dayStart, dayEnd)
            .stream()
            .sorted((a, b) -> Integer.compare(
                a.getTokenNumber() != null ? a.getTokenNumber() : 0,
                b.getTokenNumber() != null ? b.getTokenNumber() : 0
            ))
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getByPatient(UUID patientId) {
        return appointmentRepository.findByPatientIdOrderByAppointmentDateDesc(patientId).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAll(int page, int size) {
        PageRequest pageRequest = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
            Sort.by(Sort.Direction.DESC, "appointmentDate"));
        return appointmentRepository.findAll(pageRequest).stream()
            .map(this::toResponse)
            .toList();
    }

    private void broadcastQueueUpdate(UUID doctorId) {
        List<AppointmentResponse> queue = getQueueForDoctor(doctorId);
        messagingTemplate.convertAndSend("/topic/queue/" + doctorId, queue);
    }

    private AppointmentResponse toResponse(Appointment a) {
        PatientResponse patientResponse = PatientResponse.builder()
            .id(a.getPatient().getId())
            .uhid(a.getPatient().getUhid())
            .fullName(a.getPatient().getFullName())
            .mobileNumber(a.getPatient().getMobileNumber())
            .dob(a.getPatient().getDob())
            .gender(a.getPatient().getGender())
            .build();

        return AppointmentResponse.builder()
            .id(a.getId())
            .patient(patientResponse)
            .doctorName(a.getDoctor().getFullName())
            .doctorId(a.getDoctor().getId())
            .appointmentDate(a.getAppointmentDate())
            .tokenNumber(a.getTokenNumber())
            .status(a.getStatus())
            .createdDate(a.getCreatedDate())
            .build();
    }
}
