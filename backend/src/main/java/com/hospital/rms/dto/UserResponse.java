package com.hospital.rms.dto;

import com.hospital.rms.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserResponse {
    private UUID id;
    private String username;
    private String fullName;
    private String email;
    private Role role;
    private boolean enabled;
    private LocalDateTime createdDate;
}
