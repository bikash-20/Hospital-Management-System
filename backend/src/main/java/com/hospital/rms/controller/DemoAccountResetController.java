package com.hospital.rms.controller;

import com.hospital.rms.entity.User;
import com.hospital.rms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Development-only password reset endpoint. Bean is created only when the
 * Spring profile is NOT "prod", so it cannot be deployed to production even
 * if the token env var is set. This prevents an attacker who learns the
 * dev-reset token from mass-resetting demo accounts (including admin).
 */
@RestController
@RequestMapping("/api/setup")
@Profile("!prod")
@RequiredArgsConstructor
public class DemoAccountResetController {

    private static final List<String> DEMO_USERNAMES = List.of(
        "admin", "dr.rahim", "dr.sara", "reception1", "labtech1", "cashier1"
    );

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.demo-reset-token:}")
    private String configuredResetToken;

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @RequestHeader(value = "X-Demo-Reset-Token", required = false) String resetToken,
            @RequestBody ResetPasswordRequest request) {
        if (configuredResetToken.isBlank() || !configuredResetToken.equals(resetToken)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        if (request.password() == null || request.password().length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 8 characters"));
        }

        List<User> users = request.username() == null || request.username().isBlank()
            ? userRepository.findAll().stream()
                .filter(user -> DEMO_USERNAMES.contains(user.getUsername()))
                .toList()
            : userRepository.findByUsername(request.username()).stream().toList();

        if (users.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        users.forEach(user -> {
            user.setPassword(passwordEncoder.encode(request.password()));
            user.setEnabled(true);
        });
        userRepository.saveAll(users);

        return ResponseEntity.ok(Map.of("reset", Integer.toString(users.size())));
    }

    public record ResetPasswordRequest(String username, String password) {
    }
}