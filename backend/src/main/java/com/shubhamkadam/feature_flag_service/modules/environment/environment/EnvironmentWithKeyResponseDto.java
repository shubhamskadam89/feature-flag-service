package com.shubhamkadam.feature_flag_service.modules.environment.environment;

import java.time.OffsetDateTime;
import java.util.UUID;

public record EnvironmentWithKeyResponseDto(
    UUID id,
    UUID projectId,
    String name,
    String apiKeyPrefix,
    String plaintextApiKey,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
