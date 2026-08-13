package com.shubhamkadam.feature_flag_service.modules.featurestate;

import jakarta.validation.constraints.NotNull;

public record FeatureStateRequest(@NotNull(message = "Enabled state is required") Boolean enabled) {}
