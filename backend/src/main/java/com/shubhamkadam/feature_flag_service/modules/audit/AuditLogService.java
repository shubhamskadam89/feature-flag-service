package com.shubhamkadam.feature_flag_service.modules.audit;

import com.shubhamkadam.feature_flag_service.modules.environment.Environment;
import com.shubhamkadam.feature_flag_service.modules.feature.Feature;
import com.shubhamkadam.feature_flag_service.modules.organization.Organization;
import com.shubhamkadam.feature_flag_service.modules.user.User;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuditLogService {
    void recordEvent(
        Organization organization,
        Environment environment,
        Feature feature,
        User user,
        AuditAction action,
        String oldValue,
        String newValue
    );

    Page<AuditLogResponseDto> getEnvironmentAuditLogs(UUID environmentId, Pageable pageable);
}
