package com.shubhamkadam.feature_flag_service.modules.environment.environment;

import java.time.OffsetDateTime;
import java.util.UUID;

public record EnvironmentResponseDto(
    UUID id,
    UUID projectId,
    String name,
    String apiKeyPrefix,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
