package com.shubhamkadam.feature_flag_service.modules.audit;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AuditLogResponseDto(
    UUID id,
    UUID organizationId,
    UUID environmentId,
    UUID featureId,
    UUID userId,
    String userEmail,
    String userName,
    String action,
    String oldValue,
    String newValue,
    OffsetDateTime createdAt
) {}
