package com.hospital.rms.repository;

import com.hospital.rms.entity.Prescription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PrescriptionRepository extends JpaRepository<Prescription, UUID> {
    List<Prescription> findByPatientIdOrderByCreatedDateDesc(UUID patientId);
    List<Prescription> findByDoctorIdOrderByCreatedDateDesc(UUID doctorId);
    Prescription findByAppointmentId(UUID appointmentId);
    Page<Prescription> findAll(Pageable pageable);
    long countByDoctorId(UUID doctorId);
}
