package com.shubhamkadam.feature_flag_service.featurestate;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeatureStateRepository extends JpaRepository<FeatureState, UUID> {

    List<FeatureState> findByEnvironmentId(UUID environmentId);

    Optional<FeatureState> findByFeatureIdAndEnvironmentId(UUID featureId, UUID environmentId);

    Optional<FeatureState> findByFeatureIdAndEnvironmentIdAndOrganizationId(UUID featureId, UUID environmentId, UUID organizationId);
}
