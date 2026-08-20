package com.hospital.rms.repository;

import com.hospital.rms.entity.LabResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LabResultRepository extends JpaRepository<LabResult, UUID> {
    List<LabResult> findByPatientIdOrderByCreatedDateDesc(UUID patientId);
    List<LabResult> findByAppointmentIdOrderByCreatedDateDesc(UUID appointmentId);
    List<LabResult> findByStatusOrderByCreatedDateDesc(String status);
    List<LabResult> findByOrderedByIdOrderByCreatedDateDesc(UUID doctorId);
    long countByStatus(String status);
    long countByOrderedById(UUID doctorId);
}
