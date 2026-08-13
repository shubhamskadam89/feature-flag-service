package com.shubhamkadam.feature_flag_service.modules.feature;

import java.time.OffsetDateTime;
import java.util.UUID;

public record FeatureResponseDto(
    UUID id,
    UUID projectId,
    String key,
    String name,
    String description,
    FeatureType type,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
