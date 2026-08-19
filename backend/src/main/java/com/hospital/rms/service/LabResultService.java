package com.hospital.rms.service;

import com.hospital.rms.dto.LabResultRequest;
import com.hospital.rms.dto.LabResultResponse;
import com.hospital.rms.dto.PatientResponse;
import com.hospital.rms.entity.Appointment;
import com.hospital.rms.entity.LabResult;
import com.hospital.rms.entity.Patient;
import com.hospital.rms.entity.User;
import com.hospital.rms.repository.AppointmentRepository;
import com.hospital.rms.repository.LabResultRepository;
import com.hospital.rms.repository.PatientRepository;
import com.hospital.rms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LabResultService {

    private final LabResultRepository labResultRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    @Transactional
    public LabResultResponse createLabResult(LabResultRequest request, UUID orderedById) {
        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
            .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
        Patient patient = patientRepository.findById(request.getPatientId())
            .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        User doctor = userRepository.findById(orderedById)
            .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));

        LabResult labResult = LabResult.builder()
            .appointment(appointment)
            .patient(patient)
            .orderedBy(doctor)
            .testName(request.getTestName())
            .priority(request.getPriority() != null ? request.getPriority() : "ROUTINE")
            .status("PENDING")
            .resultValue(request.getResultValue())
            .notes(request.getNotes())
            .build();

        LabResult saved = labResultRepository.save(labResult);
        return toResponse(saved);
    }

    @Transactional
    public LabResultResponse updateLabResult(UUID id, LabResultRequest request) {
        LabResult labResult = labResultRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Lab result not found: " + id));

        labResult.setTestName(request.getTestName());
        labResult.setPriority(request.getPriority());
        labResult.setResultValue(request.getResultValue());
        labResult.setNotes(request.getNotes());

        LabResult saved = labResultRepository.save(labResult);
        return toResponse(saved);
    }

    @Transactional
    public LabResultResponse updateStatus(UUID id, String status) {
        LabResult labResult = labResultRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Lab result not found: " + id));

        labResult.setStatus(status);
        if ("COMPLETED".equals(status)) {
            labResult.setCompletedAt(LocalDateTime.now());
        }

        LabResult saved = labResultRepository.save(labResult);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<LabResultResponse> getByPatient(UUID patientId) {
        return labResultRepository.findByPatientIdOrderByCreatedDateDesc(patientId).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<LabResultResponse> getByAppointment(UUID appointmentId) {
        return labResultRepository.findByAppointmentIdOrderByCreatedDateDesc(appointmentId).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<LabResultResponse> getByStatus(String status) {
        return labResultRepository.findByStatusOrderByCreatedDateDesc(status).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<LabResultResponse> getAll() {
        return labResultRepository.findAll().stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public long countByStatus(String status) {
        return labResultRepository.countByStatus(status);
    }

    private LabResultResponse toResponse(LabResult labResult) {
        PatientResponse patientResponse = PatientResponse.builder()
            .id(labResult.getPatient().getId())
            .uhid(labResult.getPatient().getUhid())
            .fullName(labResult.getPatient().getFullName())
            .mobileNumber(labResult.getPatient().getMobileNumber())
            .dob(labResult.getPatient().getDob())
            .gender(labResult.getPatient().getGender())
            .build();

        return LabResultResponse.builder()
            .id(labResult.getId())
            .appointmentId(labResult.getAppointment().getId())
            .patient(patientResponse)
            .orderedByName(labResult.getOrderedBy().getFullName())
            .testName(labResult.getTestName())
            .priority(labResult.getPriority())
            .status(labResult.getStatus())
            .resultValue(labResult.getResultValue())
            .notes(labResult.getNotes())
            .completedAt(labResult.getCompletedAt())
            .createdDate(labResult.getCreatedDate())
            .build();
    }
}
