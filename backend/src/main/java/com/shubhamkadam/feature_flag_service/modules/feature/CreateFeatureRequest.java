package com.shubhamkadam.feature_flag_service.modules.feature;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateFeatureRequest(
    @NotBlank(message = "Feature key cannot be blank")
    @Size(max = 100, message = "Feature key must not exceed 100 characters")
    @Pattern(
        regexp = "^[a-z0-9_.-]+$",
        message = "Feature key may contain only lowercase letters, numbers, dots, hyphens, and underscores"
    )
    String key,

    @NotBlank(message = "Feature name cannot be blank")
    @Size(max = 100, message = "Feature name must not exceed 100 characters")
    String name,

    @Size(max = 500, message = "Feature description must not exceed 500 characters") String description,

    @NotNull(message = "Feature type is required") FeatureType type
) {
    public CreateFeatureRequest {
        if (key != null) key = key.trim();
        if (name != null) name = name.trim();
        if (description != null) description = description.trim();
    }
}
