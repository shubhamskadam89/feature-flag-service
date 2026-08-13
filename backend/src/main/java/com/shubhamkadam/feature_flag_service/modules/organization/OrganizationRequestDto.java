package com.shubhamkadam.feature_flag_service.modules.organization;

import jakarta.validation.constraints.NotBlank;

public record OrganizationRequestDto(@NotBlank(message = "Organization name cannot be blank") String name) {}
