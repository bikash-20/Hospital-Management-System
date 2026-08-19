package com.hospital.rms.controller;

import com.hospital.rms.dto.UserResponse;
import com.hospital.rms.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Public-ish doctor listing (authenticated, but not admin-only).
 * Used by the queue display, appointments, etc.
 */
@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final UserManagementService userManagementService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getDoctors() {
        return ResponseEntity.ok(userManagementService.getUsersByRole("DOCTOR"));
    }
}
