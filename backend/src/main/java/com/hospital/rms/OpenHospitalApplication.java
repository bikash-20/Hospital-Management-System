package com.hospital.rms;

import com.hospital.rms.entity.User;
import com.hospital.rms.enums.Role;
import com.hospital.rms.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
@Slf4j
public class OpenHospitalApplication {

    public static void main(String[] args) {
        // Lock the JVM default timezone to Asia/Dhaka so LocalDate.now(),
        // LocalDateTime.now() and Instant→LocalDate conversions everywhere
        // in the app — including DashboardService's "today" filter, the
        // DataSeeder, and DemoDataRefresher — all agree on the same "today".
        // Without this, Render runs in UTC and the dashboard's "today" filter
        // rolls forward 6 hours before yours does, so freshly seeded
        // appointments stop matching the dashboard query.
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Dhaka"));
        SpringApplication.run(OpenHospitalApplication.class, args);
    }

    @Bean
    @Order(1)
    CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            List<User> demoUsers = List.of(
                createUser("admin", "Admin User", "admin@hospital.com", "password", Role.ADMIN, passwordEncoder),
                createUser("dr.rahim", "Dr. Rahim Ahmed", "rahim@hospital.com", "password", Role.DOCTOR, passwordEncoder),
                createUser("dr.sara", "Dr. Sara Khan", "sara@hospital.com", "password", Role.DOCTOR, passwordEncoder),
                createUser("reception1", "Fatima Begum", "fatima@hospital.com", "password", Role.RECEPTIONIST, passwordEncoder),
                createUser("labtech1", "Kamal Uddin", "kamal@hospital.com", "password", Role.LAB_TECH, passwordEncoder),
                createUser("cashier1", "Nasir Uddin", "nasir@hospital.com", "password", Role.CASHIER, passwordEncoder)
            );

            List<User> missingUsers = demoUsers.stream()
                .filter(user -> !userRepository.existsByUsername(user.getUsername()))
                .toList();

            if (!missingUsers.isEmpty()) {
                userRepository.saveAll(missingUsers);
                log.info("Seeded {} missing demo users", missingUsers.size());
            } else {
                log.info("Demo users already present — skipping user seed");
            }
        };
    }

    private User createUser(String username, String fullName, String email, String password, Role role, PasswordEncoder encoder) {
        return User.builder()
            .username(username)
            .fullName(fullName)
            .email(email)
            .password(encoder.encode(password))
            .role(role)
            .enabled(true)
            .build();
    }
}
