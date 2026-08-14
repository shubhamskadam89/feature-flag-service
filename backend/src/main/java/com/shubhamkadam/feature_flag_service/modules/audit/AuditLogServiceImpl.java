package com.shubhamkadam.feature_flag_service.modules.audit;

import com.shubhamkadam.feature_flag_service.exceptions.ForbiddenException;
import com.shubhamkadam.feature_flag_service.exceptions.ResourceNotFoundException;
import com.shubhamkadam.feature_flag_service.modules.environment.Environment;
import com.shubhamkadam.feature_flag_service.modules.environment.EnvironmentRepository;
import com.shubhamkadam.feature_flag_service.modules.feature.Feature;
import com.shubhamkadam.feature_flag_service.modules.organization.Organization;
import com.shubhamkadam.feature_flag_service.modules.user.User;
import com.shubhamkadam.feature_flag_service.security.OrganizationContextHolder;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final EnvironmentRepository environmentRepository;
    private final AuditLogMapper auditLogMapper;

    private UUID getOrganizationId() {
        UUID orgId = OrganizationContextHolder.getCurrentOrganizationId();
        if (orgId == null) {
            throw new ForbiddenException("Organization context is missing");
        }
        return orgId;
    }

    @Override
    public void recordEvent(
        Organization organization,
        Environment environment,
        Feature feature,
        User user,
        AuditAction action,
        String oldValue,
        String newValue
    ) {
        log.info("Recording audit log event: {} for organization: {}", action, organization.getId());
        AuditLog auditLog = AuditLog.builder()
            .organization(organization)
            .environment(environment)
            .feature(feature)
            .user(user)
            .action(action.name())
            .oldValue(oldValue)
            .newValue(newValue)
            .build();

        auditLogRepository.save(auditLog);
    }

    @Override
    public Page<AuditLogResponseDto> getEnvironmentAuditLogs(UUID environmentId, Pageable pageable) {
        UUID orgId = getOrganizationId();
        log.info("Fetching audit logs for environment: {} in organization: {}", environmentId, orgId);

        // Verify the environment exists and belongs to the current organization
        environmentRepository
            .findByIdAndOrganizationIdAndDeletedAtIsNull(environmentId, orgId)
            .orElseThrow(() -> new ResourceNotFoundException("Environment", "id", environmentId.toString()));

        return auditLogRepository
            .findByOrganizationIdAndEnvironmentIdOrderByCreatedAtDesc(orgId, environmentId, pageable)
            .map(auditLogMapper::toResponseDto);
    }
}
