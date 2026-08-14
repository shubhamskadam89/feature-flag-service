package com.shubhamkadam.feature_flag_service.modules.feature;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shubhamkadam.feature_flag_service.exceptions.BadRequestException;
import com.shubhamkadam.feature_flag_service.exceptions.ForbiddenException;
import com.shubhamkadam.feature_flag_service.exceptions.ResourceAlreadyExistsException;
import com.shubhamkadam.feature_flag_service.exceptions.ResourceNotFoundException;
import com.shubhamkadam.feature_flag_service.modules.audit.AuditLogService;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRole;
import com.shubhamkadam.feature_flag_service.modules.project.Project;
import com.shubhamkadam.feature_flag_service.modules.project.ProjectRepository;
import com.shubhamkadam.feature_flag_service.modules.user.User;
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
public class FeatureServiceImpl implements FeatureService {

    private final FeatureRepository featureRepository;
    private final ProjectRepository projectRepository;
    private final FeatureMapper featureMapper;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper()
        .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    private UUID getOrganizationId() {
        UUID organizationId = OrganizationContextHolder.getCurrentOrganizationId();

        if (organizationId == null) {
            throw new ForbiddenException("Organization context is missing");
        }

        return organizationId;
    }

    private void enforceAdminRole() {
        OrganizationContextHolder.OrganizationContext context = OrganizationContextHolder.getContext();

        if (context == null || context.getRole() != MembershipRole.ADMIN) {
            log.warn("User attempted feature mutation without ADMIN role. Org ID: {}", getOrganizationId());
            throw new ForbiddenException("Only ADMIN users can modify features.");
        }
    }

    private Project getProjectAndVerify(UUID projectId) {
        UUID organizationId = getOrganizationId();

        return projectRepository
            .findByIdAndOrganizationIdAndDeletedAtIsNull(projectId, organizationId)
            .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId.toString()));
    }

    @Override
    @Transactional
    public FeatureResponseDto createFeature(UUID projectId, CreateFeatureRequest request) {
        enforceAdminRole();

        Project project = getProjectAndVerify(projectId);
        UUID organizationId = getOrganizationId();

        if (
            featureRepository.existsByProjectIdAndKeyAndOrganizationIdAndDeletedAtIsNull(
                projectId,
                request.key(),
                organizationId
            )
        ) {
            throw new ResourceAlreadyExistsException("Feature", "key", request.key());
        }

        validateFeatureType(request.type());

        Feature feature = Feature.builder()
            .project(project)
            .key(request.key())
            .name(request.name())
            .description(request.description())
            .type(request.type())
            .build();

        Feature savedFeature = featureRepository.save(feature);

        log.info(
            "Created feature {} with key '{}' in project {}",
            savedFeature.getId(),
            savedFeature.getKey(),
            projectId
        );

        try {
            User user = jwtService.getCurrentlyAuthenticatedUser();
            String featureJson = objectMapper.writeValueAsString(
                java.util.Map.of(
                    "name",
                    savedFeature.getName(),
                    "key",
                    savedFeature.getKey(),
                    "description",
                    savedFeature.getDescription() != null ? savedFeature.getDescription() : "",
                    "type",
                    savedFeature.getType().name()
                )
            );

            auditLogService.recordEvent(
                savedFeature.getProject().getOrganization(),
                null,
                savedFeature,
                user,
                com.shubhamkadam.feature_flag_service.modules.audit.AuditAction.FEATURE_CREATED,
                null,
                featureJson
            );
        } catch (Exception e) {
            log.error("Failed to write audit log for feature creation", e);
        }

        return featureMapper.toDto(savedFeature);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeatureResponseDto> getFeatures(UUID projectId) {
        getProjectAndVerify(projectId);

        UUID organizationId = getOrganizationId();

        return featureRepository
            .findByProjectIdAndOrganizationIdAndDeletedAtIsNull(projectId, organizationId)
            .stream()
            .map(featureMapper::toDto)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public FeatureResponseDto getFeatureById(UUID projectId, UUID featureId) {
        UUID organizationId = getOrganizationId();

        Feature feature = featureRepository
            .findByIdAndProjectIdAndOrganizationIdAndDeletedAtIsNull(featureId, projectId, organizationId)
            .orElseThrow(() -> new ResourceNotFoundException("Feature", "id", featureId.toString()));

        return featureMapper.toDto(feature);
    }

    @Override
    @Transactional
    public FeatureResponseDto updateFeature(UUID projectId, UUID featureId, UpdateFeatureRequest request) {
        enforceAdminRole();

        UUID organizationId = getOrganizationId();

        // Establish that the project itself belongs to the current organization.
        getProjectAndVerify(projectId);

        Feature feature = featureRepository
            .findByIdAndProjectIdAndOrganizationIdAndDeletedAtIsNull(featureId, projectId, organizationId)
            .orElseThrow(() -> new ResourceNotFoundException("Feature", "id", featureId.toString()));

        if (request.name() == null && request.description() == null) {
            throw new BadRequestException("At least one feature field must be provided for update.");
        }

        String oldName = feature.getName();
        String oldDescription = feature.getDescription() != null ? feature.getDescription() : "";

        if (request.name() != null) {
            feature.setName(request.name());
        }

        if (request.description() != null) {
            feature.setDescription(request.description());
        }

        Feature savedFeature = featureRepository.save(feature);

        log.info("Updated feature {} in project {}", featureId, projectId);

        try {
            User user = jwtService.getCurrentlyAuthenticatedUser();
            String oldValue = objectMapper.writeValueAsString(
                java.util.Map.of("name", oldName, "description", oldDescription)
            );
            String newValue = objectMapper.writeValueAsString(
                java.util.Map.of(
                    "name",
                    savedFeature.getName(),
                    "description",
                    savedFeature.getDescription() != null ? savedFeature.getDescription() : ""
                )
            );
            auditLogService.recordEvent(
                savedFeature.getProject().getOrganization(),
                null,
                savedFeature,
                user,
                com.shubhamkadam.feature_flag_service.modules.audit.AuditAction.FEATURE_UPDATED,
                oldValue,
                newValue
            );
        } catch (Exception e) {
            log.error("Failed to write audit log for feature update", e);
        }

        return featureMapper.toDto(savedFeature);
    }

    @Override
    @Transactional
    public FeatureResponseDto softDeleteFeature(UUID projectId, UUID featureId) {
        enforceAdminRole();

        UUID organizationId = getOrganizationId();

        // Establish that the project itself belongs to the current organization.
        getProjectAndVerify(projectId);

        Feature feature = featureRepository
            .findByIdAndProjectIdAndOrganizationIdAndDeletedAtIsNull(featureId, projectId, organizationId)
            .orElseThrow(() -> new ResourceNotFoundException("Feature", "id", featureId.toString()));

        feature.setDeletedAt(OffsetDateTime.now());

        Feature savedFeature = featureRepository.save(feature);

        log.info("Deleted feature {} from project {}", featureId, projectId);

        try {
            User user = jwtService.getCurrentlyAuthenticatedUser();
            String oldValue = objectMapper.writeValueAsString(
                java.util.Map.of("name", savedFeature.getName(), "key", savedFeature.getKey())
            );
            auditLogService.recordEvent(
                savedFeature.getProject().getOrganization(),
                null,
                savedFeature,
                user,
                com.shubhamkadam.feature_flag_service.modules.audit.AuditAction.FEATURE_DELETED,
                oldValue,
                null
            );
        } catch (Exception e) {
            log.error("Failed to write audit log for feature deletion", e);
        }

        return featureMapper.toDto(savedFeature);
    }

    private void validateFeatureType(FeatureType type) {
        if (type != FeatureType.BOOLEAN) {
            throw new BadRequestException("Only BOOLEAN feature type is supported in V1.");
        }
    }
}
