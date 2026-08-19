package com.hospital.rms.controller;

import com.hospital.rms.dto.DoctorScheduleRequest;
import com.hospital.rms.dto.DoctorScheduleResponse;
import com.hospital.rms.service.DoctorScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class DoctorScheduleController {

    private final DoctorScheduleService scheduleService;

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<DoctorScheduleResponse>> getScheduleForDoctor(
            @PathVariable UUID doctorId) {
        return ResponseEntity.ok(scheduleService.getScheduleForDoctor(doctorId));
    }

    @GetMapping("/available/{dayOfWeek}")
    public ResponseEntity<List<DoctorScheduleResponse>> getAvailableDoctors(
            @PathVariable DayOfWeek dayOfWeek) {
        return ResponseEntity.ok(scheduleService.getAvailableDoctorsForDay(dayOfWeek));
    }

    @PostMapping("/doctor/{doctorId}")
    public ResponseEntity<List<DoctorScheduleResponse>> setSchedule(
            @PathVariable UUID doctorId,
            @Valid @RequestBody List<DoctorScheduleRequest> requests) {
        return ResponseEntity.ok(scheduleService.setSchedule(doctorId, requests));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable UUID id) {
        scheduleService.deleteSchedule(id);
        return ResponseEntity.noContent().build();
    }
}
