package com.hospital.rms.repository;

import com.hospital.rms.entity.DoctorSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.UUID;

public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, UUID> {
    List<DoctorSchedule> findByDoctorIdAndDayOfWeekOrderByStartTime(UUID doctorId, DayOfWeek dayOfWeek);
    List<DoctorSchedule> findByDoctorIdOrderByDayOfWeekAscStartTimeAsc(UUID doctorId);
    void deleteByDoctorIdAndDayOfWeek(UUID doctorId, DayOfWeek dayOfWeek);
}
