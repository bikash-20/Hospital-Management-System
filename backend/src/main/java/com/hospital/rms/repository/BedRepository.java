package com.hospital.rms.repository;

import com.hospital.rms.entity.Bed;
import com.hospital.rms.enums.BedStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface BedRepository extends JpaRepository<Bed, UUID> {
    List<Bed> findByWardName(String wardName);
    List<Bed> findByStatus(BedStatus status);
    long countByStatus(BedStatus status);
    long countByWardNameAndStatus(String wardName, BedStatus status);

    @Query("SELECT b.wardName, b.status, COUNT(b) FROM Bed b GROUP BY b.wardName, b.status ORDER BY b.wardName")
    List<Object[]> getBedSummaryByWard();
}
