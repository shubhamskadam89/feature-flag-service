package com.shubhamkadam.feature_flag_service.modules.audit;

import org.springframework.stereotype.Component;

@Component
public class AuditLogMapper {

    public AuditLogResponseDto toResponseDto(AuditLog auditLog) {
        if (auditLog == null) {
            return null;
        }

        return new AuditLogResponseDto(
            auditLog.getId(),
            auditLog.getOrganization().getId(),
            auditLog.getEnvironment() != null ? auditLog.getEnvironment().getId() : null,
            auditLog.getFeature() != null ? auditLog.getFeature().getId() : null,
            auditLog.getUser() != null ? auditLog.getUser().getId() : null,
            auditLog.getUser() != null ? auditLog.getUser().getEmail() : null,
            auditLog.getUser() != null ? auditLog.getUser().getName() : null,
            auditLog.getAction(),
            auditLog.getOldValue(),
            auditLog.getNewValue(),
            auditLog.getCreatedAt()
        );
    }
}
