package com.shubhamkadam.feature_flag_service.modules.project;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ProjectResponseDto(
    String projectName,
    UUID projectId,
    String organizationName,
    UUID organizationId,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    String createdByName,
    UUID createdById
) {}
