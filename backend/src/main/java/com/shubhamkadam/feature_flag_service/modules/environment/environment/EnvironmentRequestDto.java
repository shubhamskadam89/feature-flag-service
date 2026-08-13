package com.shubhamkadam.feature_flag_service.modules.environment.environment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EnvironmentRequestDto(
    @NotBlank(message = "Environment name cannot be blank")
    @Size(max = 100, message = "Environment name must be less than 100 characters")
    String name
) {}
