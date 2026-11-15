package com.hospital.rms.repository;

import com.hospital.rms.entity.BedBooking;
import com.hospital.rms.enums.BedType;
import com.hospital.rms.enums.BookingStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BedBookingRepository extends JpaRepository<BedBooking, UUID> {
    Optional<BedBooking> findByBookingReference(String bookingReference);
    List<BedBooking> findByGuestPhoneOrderByCreatedDateDesc(String guestPhone);
    List<BedBooking> findByStatusOrderByCreatedDateDesc(BookingStatus status, Pageable pageable);
    long countByStatus(BookingStatus status);
    long countByBedType(BedType bedType);
}
