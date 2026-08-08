package com.shubhamkadam.feature_flag_service.modules.feature;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeatureRepository extends JpaRepository<Feature, UUID> {

    List<Feature> findByProjectIdAndDeletedAtIsNull(UUID projectId);

    Optional<Feature> findByIdAndProjectIdAndDeletedAtIsNull(UUID id, UUID projectId);

    Optional<Feature> findByProjectIdAndKeyAndDeletedAtIsNull(UUID projectId, String key);

    boolean existsByProjectIdAndKeyAndDeletedAtIsNull(UUID projectId, String key);
}
