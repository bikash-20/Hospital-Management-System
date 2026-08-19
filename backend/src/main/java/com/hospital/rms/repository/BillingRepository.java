package com.hospital.rms.repository;

import com.hospital.rms.entity.Billing;
import com.hospital.rms.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface BillingRepository extends JpaRepository<Billing, UUID> {
    Page<Billing> findByStatus(PaymentStatus status, Pageable pageable);
    List<Billing> findByPatientIdOrderByCreatedDateDesc(UUID patientId);
    long countByStatus(PaymentStatus status);

    @Query("SELECT COALESCE(SUM(b.paidAmount), 0) FROM Billing b")
    BigDecimal sumAllPaidAmount();

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Billing b")
    BigDecimal sumAllTotalAmount();

    @Query("SELECT COALESCE(SUM(b.discount), 0) FROM Billing b")
    BigDecimal sumAllDiscounts();

    @Query("SELECT COALESCE(SUM(b.paidAmount), 0) FROM Billing b WHERE b.createdDate BETWEEN :start AND :end")
    BigDecimal sumPaidAmountBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Billing b WHERE b.createdDate BETWEEN :start AND :end")
    BigDecimal sumTotalAmountBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT FUNCTION('DATE', b.createdDate) as date, COALESCE(SUM(b.paidAmount), 0) as revenue, COUNT(b) as count FROM Billing b WHERE b.createdDate BETWEEN :start AND :end GROUP BY FUNCTION('DATE', b.createdDate) ORDER BY date")
    List<Object[]> getDailyRevenueBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT b.status, COALESCE(SUM(b.paidAmount), 0) FROM Billing b GROUP BY b.status")
    List<Object[]> getRevenueByStatus();
}
