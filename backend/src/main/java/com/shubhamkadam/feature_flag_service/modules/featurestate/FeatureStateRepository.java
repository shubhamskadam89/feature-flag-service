package com.shubhamkadam.feature_flag_service.modules.featurestate;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

@Repository
public interface FeatureStateRepository extends JpaRepository<FeatureState, UUID> {
    List<FeatureState> findByEnvironmentId(UUID environmentId);

    Optional<FeatureState> findByFeatureIdAndEnvironmentId(UUID featureId, UUID environmentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<FeatureState> findByFeatureIdAndEnvironmentIdAndOrganizationId(
        UUID featureId,
        UUID environmentId,
        UUID organizationId
    );
}
