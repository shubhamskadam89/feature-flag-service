package com.shubhamkadam.feature_flag_service.modules.featurestate;

import java.time.OffsetDateTime;
import java.util.UUID;

public record FeatureStateResponse(
    UUID id,
    UUID featureId,
    UUID environmentId,
    boolean enabled,
    UUID updatedBy,
    OffsetDateTime updatedAt
) {}
