package com.hospital.rms.dto;

import com.hospital.rms.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private long accessExpiresInMs;
    private long refreshExpiresInMs;
    private String username;
    private String fullName;
    private Role role;
    private String email;
}
