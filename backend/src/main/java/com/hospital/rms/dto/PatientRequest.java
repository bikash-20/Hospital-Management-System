package com.hospital.rms.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class PatientRequest {
    @NotBlank @Size(max = 200)
    private String fullName;

    @NotBlank @Pattern(regexp = "^\\d{10,15}$", message = "Mobile must be 10-15 digits")
    private String mobileNumber;

    @NotNull @Past
    private LocalDate dob;

    @NotBlank
    private String gender;

    private String nid;

    @Size(max = 500)
    private String address;
}
