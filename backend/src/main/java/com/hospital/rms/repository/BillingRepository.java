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

    /**
     * Daily revenue aggregation. Hibernate's FUNCTION('DATE', x) syntax expands
     * to raw SQL DATE(x) which H2 fails on with "Function DATE not found"
     * (90022-240) because Hibernate strips the cast when the dialect hands the
     * function off to the driver. Instead we project to LocalDate with
     * CAST(... AS LocalDate) in JPQL — Hibernate renders this as the
     * dialect-appropriate date truncation on both H2 and PostgreSQL.
     */
    @Query("SELECT CAST(b.createdDate AS LocalDate) as day, COALESCE(SUM(b.paidAmount), 0) as revenue, COUNT(b) as count FROM Billing b WHERE b.createdDate BETWEEN :start AND :end GROUP BY CAST(b.createdDate AS LocalDate) ORDER BY day")
    List<Object[]> getDailyRevenueBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT b.status, COALESCE(SUM(b.paidAmount), 0) FROM Billing b GROUP BY b.status")
    List<Object[]> getRevenueByStatus();
}
