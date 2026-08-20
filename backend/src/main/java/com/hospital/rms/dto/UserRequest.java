package com.hospital.rms.dto;

import com.hospital.rms.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserRequest {
    // Username is immutable after creation — the frontend's updateUserApi
    // doesn't send it (the PATCH path is set-username-by-id), so we drop the
    // @NotBlank constraint that previously rejected every PUT with 400.
    private String username;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email")
    private String email;

    private String password; // nullable for updates

    @NotNull(message = "Role is required")
    private Role role;

    private boolean enabled = true;
}
