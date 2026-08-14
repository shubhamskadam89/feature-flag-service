package com.shubhamkadam.feature_flag_service.modules.environment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shubhamkadam.feature_flag_service.exceptions.ForbiddenException;
import com.shubhamkadam.feature_flag_service.exceptions.ResourceAlreadyExistsException;
import com.shubhamkadam.feature_flag_service.exceptions.ResourceNotFoundException;
import com.shubhamkadam.feature_flag_service.modules.audit.AuditLogService;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRole;
import com.shubhamkadam.feature_flag_service.modules.project.Project;
import com.shubhamkadam.feature_flag_service.modules.project.ProjectRepository;
import com.shubhamkadam.feature_flag_service.modules.user.User;
import com.shubhamkadam.feature_flag_service.security.ApiKeyGenerator;
import com.shubhamkadam.feature_flag_service.security.JwtService;
import com.shubhamkadam.feature_flag_service.security.OrganizationContextHolder;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnvironmentServiceImpl implements EnvironmentService {

    private final EnvironmentRepository environmentRepository;
    private final ProjectRepository projectRepository;
    private final EnvironmentMapper environmentMapper;
    private final ApiKeyGenerator apiKeyGenerator;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper()
        .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    private UUID getOrganizationId() {
        UUID orgId = OrganizationContextHolder.getCurrentOrganizationId();
        if (orgId == null) {
            throw new ForbiddenException("Organization context is missing");
        }
        return orgId;
    }

    private void enforceAdminRole() {
        OrganizationContextHolder.OrganizationContext context = OrganizationContextHolder.getContext();
        if (context == null || context.getRole() != MembershipRole.ADMIN) {
            log.warn("User attempted mutation on environment without ADMIN role. Org ID: {}", getOrganizationId());
            throw new ForbiddenException("Only ADMIN users can modify environments or rotate keys.");
        }
    }

    private Project getProjectAndVerify(UUID projectId) {
        return projectRepository
            .findByIdAndOrganizationIdAndDeletedAtIsNull(projectId, getOrganizationId())
            .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId.toString()));
    }

    @Override
    @Transactional
    public EnvironmentWithKeyResponseDto createEnvironment(UUID projectId, EnvironmentRequestDto requestDto) {
        enforceAdminRole();
        Project project = getProjectAndVerify(projectId);

        if (
            environmentRepository.existsByNameAndProjectIdAndOrganizationIdAndDeletedAtIsNull(
                requestDto.name(),
                projectId,
                getOrganizationId()
            )
        ) {
            throw new ResourceAlreadyExistsException("Environment", "name", requestDto.name());
        }

        ApiKeyGenerator.ApiKeyResult apiKeyResult = apiKeyGenerator.generateApiKey(requestDto.name());

        Environment environment = Environment.builder()
            .project(project)
            .organization(project.getOrganization())
            .name(requestDto.name())
            .apiKeyPrefix(apiKeyResult.getPrefix())
            .apiKeyHash(apiKeyResult.getHash())
            .build();

        Environment savedEnvironment = environmentRepository.save(environment);

        log.info("Created environment {} in project {}", savedEnvironment.getId(), projectId);

        try {
            User user = jwtService.getCurrentlyAuthenticatedUser();
            String envJson = objectMapper.writeValueAsString(java.util.Map.of("name", savedEnvironment.getName()));
            String apiKeyJson = objectMapper.writeValueAsString(
                java.util.Map.of("prefix", savedEnvironment.getApiKeyPrefix())
            );

            auditLogService.recordEvent(
                savedEnvironment.getOrganization(),
                savedEnvironment,
                null,
                user,
                com.shubhamkadam.feature_flag_service.modules.audit.AuditAction.ENVIRONMENT_CREATED,
                null,
                envJson
            );

            auditLogService.recordEvent(
                savedEnvironment.getOrganization(),
                savedEnvironment,
                null,
                user,
                com.shubhamkadam.feature_flag_service.modules.audit.AuditAction.API_KEY_CREATED,
                null,
                apiKeyJson
            );
        } catch (Exception e) {
            log.error("Failed to write audit logs for environment creation", e);
        }

        return environmentMapper.toWithKeyDto(savedEnvironment, apiKeyResult.getPlaintextKey());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnvironmentResponseDto> getEnvironments(UUID projectId) {
        getProjectAndVerify(projectId);
        return environmentRepository
            .findByProjectIdAndOrganizationIdAndDeletedAtIsNull(projectId, getOrganizationId())
            .stream()
            .map(environmentMapper::toDto)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EnvironmentResponseDto getEnvironmentById(UUID projectId, UUID environmentId) {
        Environment environment = environmentRepository
            .findByIdAndProjectIdAndOrganizationIdAndDeletedAtIsNull(environmentId, projectId, getOrganizationId())
            .orElseThrow(() -> new ResourceNotFoundException("Environment", "id", environmentId.toString()));
        return environmentMapper.toDto(environment);
    }

    @Override
    @Transactional
    public EnvironmentResponseDto updateEnvironment(
        UUID projectId,
        UUID environmentId,
        EnvironmentRequestDto requestDto
    ) {
        enforceAdminRole();
        Environment environment = environmentRepository
            .findByIdAndProjectIdAndOrganizationIdAndDeletedAtIsNull(environmentId, projectId, getOrganizationId())
            .orElseThrow(() -> new ResourceNotFoundException("Environment", "id", environmentId.toString()));

        if (
            !environment.getName().equals(requestDto.name()) &&
            environmentRepository.existsByNameAndProjectIdAndOrganizationIdAndDeletedAtIsNull(
                requestDto.name(),
                projectId,
                getOrganizationId()
            )
        ) {
            throw new ResourceAlreadyExistsException("Environment", "name", requestDto.name());
        }

        String oldName = environment.getName();
        environment.setName(requestDto.name());
        Environment savedEnvironment = environmentRepository.save(environment);
        log.info("Updated environment {} in project {}", environmentId, projectId);

        try {
            User user = jwtService.getCurrentlyAuthenticatedUser();
            String oldValue = objectMapper.writeValueAsString(java.util.Map.of("name", oldName));
            String newValue = objectMapper.writeValueAsString(java.util.Map.of("name", savedEnvironment.getName()));
            auditLogService.recordEvent(
                savedEnvironment.getOrganization(),
                savedEnvironment,
                null,
                user,
                com.shubhamkadam.feature_flag_service.modules.audit.AuditAction.ENVIRONMENT_UPDATED,
                oldValue,
                newValue
            );
        } catch (Exception e) {
            log.error("Failed to write audit log for environment update", e);
        }

        return environmentMapper.toDto(savedEnvironment);
    }

    @Override
    @Transactional
    public EnvironmentResponseDto softDeleteEnvironment(UUID projectId, UUID environmentId) {
        enforceAdminRole();
        Environment environment = environmentRepository
            .findByIdAndProjectIdAndOrganizationIdAndDeletedAtIsNull(environmentId, projectId, getOrganizationId())
            .orElseThrow(() -> new ResourceNotFoundException("Environment", "id", environmentId.toString()));

        environment.setDeletedAt(OffsetDateTime.now());
        Environment savedEnvironment = environmentRepository.save(environment);
        log.info("Deleted environment {} in project {}", environmentId, projectId);

        try {
            User user = jwtService.getCurrentlyAuthenticatedUser();
            String oldValue = objectMapper.writeValueAsString(java.util.Map.of("name", savedEnvironment.getName()));
            auditLogService.recordEvent(
                savedEnvironment.getOrganization(),
                savedEnvironment,
                null,
                user,
                com.shubhamkadam.feature_flag_service.modules.audit.AuditAction.ENVIRONMENT_DELETED,
                oldValue,
                null
            );
        } catch (Exception e) {
            log.error("Failed to write audit log for environment deletion", e);
        }

        return environmentMapper.toDto(savedEnvironment);
    }

    @Override
    @Transactional
    public EnvironmentWithKeyResponseDto rotateApiKey(UUID projectId, UUID environmentId) {
        enforceAdminRole();
        Environment environment = environmentRepository
            .findByIdAndProjectIdAndOrganizationIdAndDeletedAtIsNull(environmentId, projectId, getOrganizationId())
            .orElseThrow(() -> new ResourceNotFoundException("Environment", "id", environmentId.toString()));

        String oldPrefix = environment.getApiKeyPrefix();
        ApiKeyGenerator.ApiKeyResult newApiKeyResult = apiKeyGenerator.generateApiKey(environment.getName());

        environment.setApiKeyPrefix(newApiKeyResult.getPrefix());
        environment.setApiKeyHash(newApiKeyResult.getHash());

        Environment savedEnvironment = environmentRepository.save(environment);
        log.info("Rotated API key for environment {} in project {}", environmentId, projectId);

        try {
            User user = jwtService.getCurrentlyAuthenticatedUser();
            String oldValue = objectMapper.writeValueAsString(java.util.Map.of("prefix", oldPrefix));
            String newValue = objectMapper.writeValueAsString(
                java.util.Map.of("prefix", savedEnvironment.getApiKeyPrefix())
            );
            auditLogService.recordEvent(
                savedEnvironment.getOrganization(),
                savedEnvironment,
                null,
                user,
                com.shubhamkadam.feature_flag_service.modules.audit.AuditAction.API_KEY_ROTATED,
                oldValue,
                newValue
            );
        } catch (Exception e) {
            log.error("Failed to write audit log for api key rotation", e);
        }

        return environmentMapper.toWithKeyDto(savedEnvironment, newApiKeyResult.getPlaintextKey());
    }
}
