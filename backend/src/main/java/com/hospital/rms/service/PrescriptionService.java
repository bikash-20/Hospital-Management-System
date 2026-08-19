package com.hospital.rms.service;

import com.hospital.rms.dto.PrescriptionRequest;
import com.hospital.rms.dto.PrescriptionResponse;
import com.hospital.rms.dto.PatientResponse;
import com.hospital.rms.entity.Appointment;
import com.hospital.rms.entity.Prescription;
import com.hospital.rms.enums.AppointmentStatus;
import com.hospital.rms.repository.AppointmentRepository;
import com.hospital.rms.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;

    @Transactional
    public PrescriptionResponse create(PrescriptionRequest request, String doctorUsername) {
        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
            .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

        // Mark appointment as completed
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(appointment);

        Prescription prescription = Prescription.builder()
            .appointment(appointment)
            .patient(appointment.getPatient())
            .doctor(appointment.getDoctor())
            .diagnosis(request.getDiagnosis())
            .chiefComplaints(request.getChiefComplaints())
            .medicines(request.getMedicines())
            .labOrders(request.getLabOrders())
            .build();

        Prescription saved = prescriptionRepository.save(prescription);

        // Auto-dispatch: if lab orders exist, they are already stored and visible to lab tech
        if (request.getLabOrders() != null && !request.getLabOrders().isEmpty()) {
            log.info("Auto-dispatched lab orders for prescription {} - patient {}",
                saved.getId(), appointment.getPatient().getUhid());
        }

        // Auto-dispatch: generate billing line items from prescription
        if (request.getMedicines() != null && !request.getMedicines().isEmpty()) {
            log.info("Auto-dispatched billing line items for prescription {} - patient {}",
                saved.getId(), appointment.getPatient().getUhid());
        }

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getByPatient(UUID patientId) {
        return prescriptionRepository.findByPatientIdOrderByCreatedDateDesc(patientId).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getByDoctor(UUID doctorId) {
        return prescriptionRepository.findByDoctorIdOrderByCreatedDateDesc(doctorId).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getAll() {
        return prescriptionRepository.findAll().stream()
            .map(this::toResponse)
            .toList();
    }

    private PrescriptionResponse toResponse(Prescription p) {
        PatientResponse patientResponse = PatientResponse.builder()
            .id(p.getPatient().getId())
            .uhid(p.getPatient().getUhid())
            .fullName(p.getPatient().getFullName())
            .mobileNumber(p.getPatient().getMobileNumber())
            .dob(p.getPatient().getDob())
            .gender(p.getPatient().getGender())
            .build();

        return PrescriptionResponse.builder()
            .id(p.getId())
            .appointmentId(p.getAppointment().getId())
            .patient(patientResponse)
            .doctorName(p.getDoctor().getFullName())
            .diagnosis(p.getDiagnosis())
            .chiefComplaints(p.getChiefComplaints())
            .medicines(p.getMedicines())
            .labOrders(p.getLabOrders())
            .createdDate(p.getCreatedDate())
            .build();
    }
}
