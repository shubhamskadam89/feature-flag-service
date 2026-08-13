package com.shubhamkadam.feature_flag_service.modules.featurestate;

import com.shubhamkadam.feature_flag_service.exceptions.ForbiddenException;
import com.shubhamkadam.feature_flag_service.exceptions.ResourceNotFoundException;
import com.shubhamkadam.feature_flag_service.modules.environment.Environment;
import com.shubhamkadam.feature_flag_service.modules.environment.EnvironmentRepository;
import com.shubhamkadam.feature_flag_service.modules.feature.Feature;
import com.shubhamkadam.feature_flag_service.modules.feature.FeatureRepository;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRole;
import com.shubhamkadam.feature_flag_service.modules.user.User;
import com.shubhamkadam.feature_flag_service.security.JwtService;
import com.shubhamkadam.feature_flag_service.security.OrganizationContextHolder;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeatureStateServiceImpl implements FeatureStateService {

    private final FeatureStateRepository featureStateRepository;
    private final FeatureRepository featureRepository;
    private final EnvironmentRepository environmentRepository;
    private final JwtService jwtService;
    private final FeatureStateMapper featureStateMapper;

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
            log.warn("User attempted feature state mutation without ADMIN role. Org ID: {}", getOrganizationId());

            throw new ForbiddenException("Only ADMIN users can modify feature state.");
        }
    }

    private User getAuthenticatedUser() {
        User user = jwtService.getCurrentlyAuthenticatedUser();

        if (user == null) {
            throw new ForbiddenException("Authenticated user is missing");
        }

        return user;
    }

    private Environment getEnvironment(UUID environmentId, UUID organizationId) {
        return environmentRepository
            .findByIdAndOrganizationIdAndDeletedAtIsNull(environmentId, organizationId)
            .orElseThrow(() -> new ResourceNotFoundException("Environment", "id", environmentId.toString()));
    }

    private Feature getFeature(String featureKey, UUID organizationId, UUID projectId) {
        return featureRepository
            .findByProjectIdAndKeyAndOrganizationIdAndDeletedAtIsNull(projectId, featureKey, organizationId)
            .orElseThrow(() -> new ResourceNotFoundException("Feature", "key", featureKey));
    }

    @Override
    @Transactional
    public FeatureStateResponse toggleFeatureState(UUID environmentId, String featureKey, FeatureStateRequest request) {
        enforceAdminRole();

        UUID organizationId = getOrganizationId();
        User authenticatedUser = getAuthenticatedUser();

        Environment environment = getEnvironment(environmentId, organizationId);

        Feature feature = getFeature(featureKey, organizationId, environment.getProject().getId());

        java.util.Optional<FeatureState> existingState =
            featureStateRepository.findByFeatureIdAndEnvironmentIdAndOrganizationId(
                feature.getId(),
                environmentId,
                organizationId
            );

        FeatureState featureState;
        if (existingState.isPresent()) {
            featureState = existingState.get();
        } else {
            featureState = FeatureState.builder()
                .feature(feature)
                .environment(environment)
                .organization(environment.getOrganization())
                .enabled(request.enabled())
                .updatedBy(authenticatedUser)
                .updatedAt(OffsetDateTime.now())
                .build();
        }

        featureState.setEnabled(request.enabled());
        featureState.setUpdatedBy(authenticatedUser);
        featureState.setUpdatedAt(OffsetDateTime.now());

        FeatureState savedFeatureState = featureStateRepository.save(featureState);

        log.info(
            "Updated feature state for feature '{}' in environment {} to {} by user {}",
            featureKey,
            environmentId,
            request.enabled(),
            authenticatedUser.getId()
        );

        return featureStateMapper.toResponse(savedFeatureState);
    }
}
