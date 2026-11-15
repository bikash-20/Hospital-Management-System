package com.hospital.rms.controller;

import com.hospital.rms.dto.BedBookingRequest;
import com.hospital.rms.dto.BedBookingResponse;
import com.hospital.rms.dto.PublicAppointmentRequest;
import com.hospital.rms.dto.PublicAppointmentResponse;
import com.hospital.rms.dto.SeatAvailabilityResponse;
import com.hospital.rms.service.PublicHospitalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicHospitalController {

    private final PublicHospitalService publicHospitalService;

    @GetMapping("/availability")
    public ResponseEntity<SeatAvailabilityResponse> getSeatAvailability() {
        return ResponseEntity.ok(publicHospitalService.getSeatAvailability());
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<SeatAvailabilityResponse.DoctorInfo>> getDoctors() {
        return ResponseEntity.ok(publicHospitalService.getActiveDoctors());
    }

    @PostMapping("/bookings")
    public ResponseEntity<BedBookingResponse> createBooking(@Valid @RequestBody BedBookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(publicHospitalService.createBooking(request));
    }

    @PostMapping("/appointments")
    public ResponseEntity<PublicAppointmentResponse> createAppointment(@Valid @RequestBody PublicAppointmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(publicHospitalService.createAppointment(request));
    }

    @GetMapping("/bookings/{reference}")
    public ResponseEntity<BedBookingResponse> getBooking(@PathVariable String reference) {
        return ResponseEntity.ok(publicHospitalService.getBookingByReference(reference));
    }

    @GetMapping("/admin/bookings")
    public ResponseEntity<List<BedBookingResponse>> getAllBookings() {
        return ResponseEntity.ok(publicHospitalService.getAllBookings());
    }
}
