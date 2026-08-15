package com.shubhamkadam.feature_flag_service.modules.feature;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FeatureRepository extends JpaRepository<Feature, UUID> {
    @Query(
        "SELECT f FROM Feature f WHERE f.project.id = :projectId AND f.project.organization.id = :organizationId AND f.deletedAt IS NULL"
    )
    List<Feature> findByProjectIdAndOrganizationIdAndDeletedAtIsNull(
        @Param("projectId") UUID projectId,
        @Param("organizationId") UUID organizationId
    );

    @Query(
        "SELECT f FROM Feature f WHERE f.id = :id AND f.project.id = :projectId AND f.project.organization.id = :organizationId AND f.deletedAt IS NULL"
    )
    Optional<Feature> findByIdAndProjectIdAndOrganizationIdAndDeletedAtIsNull(
        @Param("id") UUID id,
        @Param("projectId") UUID projectId,
        @Param("organizationId") UUID organizationId
    );

    @Query(
        "SELECT f FROM Feature f WHERE f.project.id = :projectId AND f.key = :key AND f.project.organization.id = :organizationId AND f.deletedAt IS NULL"
    )
    Optional<Feature> findByProjectIdAndKeyAndOrganizationIdAndDeletedAtIsNull(
        @Param("projectId") UUID projectId,
        @Param("key") String key,
        @Param("organizationId") UUID organizationId
    );

    @Query(
        "SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM Feature f WHERE f.project.id = :projectId AND f.key = :key AND f.project.organization.id = :organizationId AND f.deletedAt IS NULL"
    )
    boolean existsByProjectIdAndKeyAndOrganizationIdAndDeletedAtIsNull(
        @Param("projectId") UUID projectId,
        @Param("key") String key,
        @Param("organizationId") UUID organizationId
    );

    Optional<Feature> findByIdAndDeletedAtIsNull(UUID id);

    /**
     * Evaluation read path: resolve an active feature by its project and public key.
     * <p>
     * Scoped to {@code project.id} (derived from the resolved environment) so that
     * {@code "checkout"} in Project A can never resolve to {@code "checkout"} in
     * Project B, even if both share the same key string.
     */
    @Query("SELECT f FROM Feature f WHERE f.project.id = :projectId AND f.key = :key AND f.deletedAt IS NULL")
    Optional<Feature> findActiveByProjectIdAndKey(@Param("projectId") UUID projectId, @Param("key") String key);
}
