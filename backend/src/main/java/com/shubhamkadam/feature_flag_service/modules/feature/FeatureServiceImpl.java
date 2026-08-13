package com.shubhamkadam.feature_flag_service.modules.feature;

import com.shubhamkadam.feature_flag_service.exceptions.BadRequestException;
import com.shubhamkadam.feature_flag_service.exceptions.ForbiddenException;
import com.shubhamkadam.feature_flag_service.exceptions.ResourceAlreadyExistsException;
import com.shubhamkadam.feature_flag_service.exceptions.ResourceNotFoundException;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRole;
import com.shubhamkadam.feature_flag_service.modules.project.Project;
import com.shubhamkadam.feature_flag_service.modules.project.ProjectRepository;
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

        if (request.name() != null) {
            feature.setName(request.name());
        }

        if (request.description() != null) {
            feature.setDescription(request.description());
        }

        Feature savedFeature = featureRepository.save(feature);

        log.info("Updated feature {} in project {}", featureId, projectId);

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

        return featureMapper.toDto(savedFeature);
    }

    private void validateFeatureType(FeatureType type) {
        if (type != FeatureType.BOOLEAN) {
            throw new BadRequestException("Only BOOLEAN feature type is supported in V1.");
        }
    }
}
