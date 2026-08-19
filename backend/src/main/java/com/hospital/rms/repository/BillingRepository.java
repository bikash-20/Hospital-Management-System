package com.hospital.rms.repository;

import com.hospital.rms.entity.Billing;
import com.hospital.rms.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BillingRepository extends JpaRepository<Billing, UUID> {
    Optional<Billing> findByInvoiceNumber(String invoiceNumber);
    List<Billing> findByPatientIdOrderByCreatedDateDesc(UUID patientId);
    List<Billing> findByStatus(PaymentStatus status);
    boolean existsByInvoiceNumber(String invoiceNumber);
}
