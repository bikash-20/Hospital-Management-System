package com.hospital.rms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBedRequest {

    @NotBlank(message = "Bed number is required")
    @Size(min = 1, max = 20, message = "Bed number must be between 1 and 20 characters")
    private String bedNumber;

    @NotBlank(message = "Ward name is required")
    @Size(min = 1, max = 50, message = "Ward name must be between 1 and 50 characters")
    private String wardName;
}
