package com.hospital.rms.repository;

import com.hospital.rms.entity.Appointment;
import com.hospital.rms.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    List<Appointment> findByDoctorIdAndAppointmentDateBetween(
        UUID doctorId, LocalDateTime start, LocalDateTime end);

    List<Appointment> findByDoctorIdAndAppointmentDateBetweenAndStatusIn(
        UUID doctorId, LocalDateTime start, LocalDateTime end, List<AppointmentStatus> statuses);

    @Query("SELECT COALESCE(MAX(a.tokenNumber), 0) FROM Appointment a WHERE a.doctor.id = :doctorId AND a.appointmentDate >= :dayStart AND a.appointmentDate < :dayEnd")
    int findMaxTokenForDoctorOnDay(UUID doctorId, LocalDateTime dayStart, LocalDateTime dayEnd);

    List<Appointment> findByPatientIdOrderByAppointmentDateDesc(UUID patientId);

    List<Appointment> findByStatus(AppointmentStatus status);

    List<Appointment> findByDoctorIdAndStatus(UUID doctorId, AppointmentStatus status);
}
