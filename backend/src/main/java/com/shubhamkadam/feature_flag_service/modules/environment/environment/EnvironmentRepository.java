package com.shubhamkadam.feature_flag_service.modules.environment.environment;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EnvironmentRepository extends JpaRepository<Environment, UUID> {
    List<Environment> findByProjectIdAndDeletedAtIsNull(UUID projectId);

    Optional<Environment> findByIdAndProjectIdAndDeletedAtIsNull(UUID id, UUID projectId);

    Optional<Environment> findByApiKeyHashAndDeletedAtIsNull(String apiKeyHash);

    boolean existsByProjectIdAndNameAndDeletedAtIsNull(UUID projectId, String name);

    List<Environment> findByOrganizationIdAndDeletedAtIsNull(UUID organizationId);

    Optional<Environment> findByIdAndOrganizationIdAndDeletedAtIsNull(UUID id, UUID organizationId);

    List<Environment> findByProjectIdAndOrganizationIdAndDeletedAtIsNull(UUID projectId, UUID organizationId);

    Optional<Environment> findByIdAndProjectIdAndOrganizationIdAndDeletedAtIsNull(
        UUID id,
        UUID projectId,
        UUID organizationId
    );

    boolean existsByNameAndProjectIdAndOrganizationIdAndDeletedAtIsNull(
        String name,
        UUID projectId,
        UUID organizationId
    );
}
