package com.hospital.rms.service;

import com.hospital.rms.dto.DoctorScheduleRequest;
import com.hospital.rms.dto.DoctorScheduleResponse;
import com.hospital.rms.entity.DoctorSchedule;
import com.hospital.rms.entity.User;
import com.hospital.rms.repository.DoctorScheduleRepository;
import com.hospital.rms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DoctorScheduleService {

    private final DoctorScheduleRepository scheduleRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<DoctorScheduleResponse> getScheduleForDoctor(UUID doctorId) {
        return scheduleRepository.findByDoctorIdOrderByDayOfWeekAscStartTimeAsc(doctorId).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<DoctorScheduleResponse> getAvailableDoctorsForDay(java.time.DayOfWeek dayOfWeek) {
        // Find all doctors who have active schedules on this day
        return userRepository.findByRole(com.hospital.rms.enums.Role.DOCTOR).stream()
            .<DoctorScheduleResponse>flatMap(doctor -> 
                scheduleRepository.findByDoctorIdAndDayOfWeekOrderByStartTime(doctor.getId(), dayOfWeek).stream()
                    .filter(DoctorSchedule::isActive)
                    .map(this::toResponse)
            )
            .toList();
    }

    @Transactional
    public List<DoctorScheduleResponse> setSchedule(UUID doctorId, List<DoctorScheduleRequest> requests) {
        User doctor = userRepository.findById(doctorId)
            .orElseThrow(() -> new IllegalArgumentException("Doctor not found: " + doctorId));

        // Delete existing schedules for this doctor
        scheduleRepository.findByDoctorIdOrderByDayOfWeekAscStartTimeAsc(doctorId)
            .forEach(schedule -> scheduleRepository.delete(schedule));

        // Create new schedules
        List<DoctorSchedule> schedules = requests.stream()
            .map(req -> DoctorSchedule.builder()
                .doctor(doctor)
                .dayOfWeek(req.getDayOfWeek())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .active(req.isActive())
                .build()
            )
            .toList();

        return scheduleRepository.saveAll(schedules).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public void deleteSchedule(UUID scheduleId) {
        scheduleRepository.deleteById(scheduleId);
    }

    private DoctorScheduleResponse toResponse(DoctorSchedule schedule) {
        return DoctorScheduleResponse.builder()
            .id(schedule.getId())
            .doctorId(schedule.getDoctor().getId())
            .doctorName(schedule.getDoctor().getFullName())
            .dayOfWeek(schedule.getDayOfWeek())
            .startTime(schedule.getStartTime())
            .endTime(schedule.getEndTime())
            .active(schedule.isActive())
            .build();
    }
}
