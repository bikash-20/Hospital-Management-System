package com.hospital.rms.repository;

import com.hospital.rms.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;

public interface PatientRepository extends JpaRepository<Patient, UUID> {
    Optional<Patient> findByUhid(String uhid);
    boolean existsByUhid(String uhid);

    Optional<Patient> findByMobileNumberAndDob(String mobileNumber, java.time.LocalDate dob);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(p.uhid FROM 10) AS integer)), 0) FROM Patient p WHERE p.uhid LIKE :prefix%")
    int findMaxSequenceNumber(String prefix);

    java.util.List<Patient> findByFullNameContainingIgnoreCase(String name);

    java.util.List<Patient> findByMobileNumber(String mobileNumber);

    Page<Patient> findByFullNameContainingIgnoreCase(String name, Pageable pageable);

    long countByCreatedDateBetween(LocalDateTime start, LocalDateTime end);
}
