package com.shubhamkadam.feature_flag_service.modules.feature;

import jakarta.validation.constraints.Size;

public record UpdateFeatureRequest(
    @Size(max = 100, message = "Feature name must not exceed 100 characters") String name,

    @Size(max = 500, message = "Feature description must not exceed 500 characters") String description
) {
    public UpdateFeatureRequest {
        if (name != null) {
            name = name.trim();
            if (name.isEmpty()) {
                throw new com.shubhamkadam.feature_flag_service.exceptions.BadRequestException(
                    "Feature name cannot be blank"
                );
            }
        }
        if (description != null) {
            description = description.trim();
        }
    }
}
