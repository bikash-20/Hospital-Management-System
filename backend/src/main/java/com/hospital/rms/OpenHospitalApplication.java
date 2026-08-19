package com.hospital.rms;

import com.hospital.rms.entity.User;
import com.hospital.rms.enums.Role;
import com.hospital.rms.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@SpringBootApplication
@Slf4j
public class OpenHospitalApplication {

    public static void main(String[] args) {
        SpringApplication.run(OpenHospitalApplication.class, args);
    }

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() == 0) {
                List<User> seedUsers = List.of(
                    createUser("admin", "Admin User", "admin@hospital.com", "password", Role.ADMIN, passwordEncoder),
                    createUser("dr.rahim", "Dr. Rahim Ahmed", "rahim@hospital.com", "password", Role.DOCTOR, passwordEncoder),
                    createUser("dr.sara", "Dr. Sara Khan", "sara@hospital.com", "password", Role.DOCTOR, passwordEncoder),
                    createUser("reception1", "Fatima Begum", "fatima@hospital.com", "password", Role.RECEPTIONIST, passwordEncoder),
                    createUser("labtech1", "Kamal Hossain", "kamal@hospital.com", "password", Role.LAB_TECH, passwordEncoder),
                    createUser("cashier1", "Nasir Uddin", "nasir@hospital.com", "password", Role.CASHIER, passwordEncoder)
                );
                userRepository.saveAll(seedUsers);
                log.info("Seeded {} demo users", seedUsers.size());
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
