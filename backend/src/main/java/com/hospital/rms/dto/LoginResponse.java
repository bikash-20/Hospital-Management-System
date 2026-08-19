package com.hospital.rms.dto;

import com.hospital.rms.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LoginResponse {
    private String accessToken;
    private String tokenType;
    private String username;
    private String fullName;
    private Role role;
    private String email;
}
