package com.shubhamkadam.feature_flag_service.modules.organization;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OrganizationRequestDto(
    @NotBlank(message = "Organization name cannot be blank")
    @Size(max = 100, message = "Organization name must not exceed 100 characters")
    String name
) {
    public OrganizationRequestDto {
        if (name != null) {
            name = name.trim();
        }
    }
}
