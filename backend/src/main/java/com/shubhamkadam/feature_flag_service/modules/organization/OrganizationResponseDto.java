package com.shubhamkadam.feature_flag_service.modules.organization;

import java.time.OffsetDateTime;
import java.util.UUID;

public record OrganizationResponseDto(
    UUID id,
    String name,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    UUID createdBy,
    String role
) {}
