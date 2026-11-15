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

    @NotBlank @Pattern(regexp = "^[+]?[0-9\\s-]{10,20}$", message = "Mobile must be a valid 10-15 digit phone number")
    private String mobileNumber;

    @NotNull @PastOrPresent(message = "Date of birth cannot be in the future")
    private LocalDate dob;

    @NotBlank
    private String gender;

    private String nid;

    @Size(max = 500)
    private String address;
}
