package com.shubhamkadam.feature_flag_service.modules.feature;

import jakarta.validation.constraints.Size;

public record UpdateFeatureRequest(
    @Size(max = 100, message = "Feature name must not exceed 100 characters") String name,

    String description
) {}
