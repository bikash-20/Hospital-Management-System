package com.hospital.rms.service;

import com.hospital.rms.dto.UserRequest;
import com.hospital.rms.dto.UserResponse;
import com.hospital.rms.entity.User;
import com.hospital.rms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getUsersByRole(String role) {
        try {
            var roleEnum = com.hospital.rms.enums.Role.valueOf(role.toUpperCase());
            return userRepository.findByRole(roleEnum).stream()
                .map(this::toResponse)
                .toList();
        } catch (IllegalArgumentException e) {
            return List.of();
        }
    }

    @Transactional
    public UserResponse createUser(UserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        String encodedPassword = passwordEncoder.encode(
            request.getPassword() != null ? request.getPassword() : "password"
        );

        User user = User.builder()
            .username(request.getUsername())
            .fullName(request.getFullName())
            .email(request.getEmail())
            .password(encodedPassword)
            .role(request.getRole())
            .enabled(request.isEnabled())
            .build();

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @Transactional
    public UserResponse updateUser(UUID id, UserRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());
        user.setEnabled(request.isEnabled());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @Transactional
    public void toggleUserEnabled(UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("User not found: " + id);
        }
        userRepository.deleteById(id);
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .role(user.getRole())
            .enabled(user.isEnabled())
            .createdDate(user.getCreatedDate())
            .build();
    }
}
