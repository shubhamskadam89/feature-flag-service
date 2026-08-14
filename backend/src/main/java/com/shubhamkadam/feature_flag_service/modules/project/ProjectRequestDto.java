package com.shubhamkadam.feature_flag_service.modules.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectRequestDto(
    @NotBlank(message = "Project name cannot be blank")
    @Size(max = 100, message = "Project name must not exceed 100 characters")
    String projectName
) {
    public ProjectRequestDto {
        if (projectName != null) {
            projectName = projectName.trim();
        }
    }
}
