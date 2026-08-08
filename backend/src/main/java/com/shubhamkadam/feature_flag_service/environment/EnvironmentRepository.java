package com.shubhamkadam.feature_flag_service.environment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnvironmentRepository extends JpaRepository<Environment, UUID> {

    List<Environment> findByProjectIdAndDeletedAtIsNull(UUID projectId);

    Optional<Environment> findByIdAndProjectIdAndDeletedAtIsNull(UUID id, UUID projectId);

    Optional<Environment> findByApiKeyHashAndDeletedAtIsNull(String apiKeyHash);

    boolean existsByProjectIdAndNameAndDeletedAtIsNull(UUID projectId, String name);
}
