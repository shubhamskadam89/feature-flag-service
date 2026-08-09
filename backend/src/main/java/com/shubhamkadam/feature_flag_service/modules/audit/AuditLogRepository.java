package com.shubhamkadam.feature_flag_service.modules.audit;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId, Pageable pageable);

    Page<AuditLog> findByOrganizationIdAndEnvironmentIdOrderByCreatedAtDesc(
        UUID organizationId,
        UUID environmentId,
        Pageable pageable
    );

    Page<AuditLog> findByOrganizationIdAndFeatureIdOrderByCreatedAtDesc(
        UUID organizationId,
        UUID featureId,
        Pageable pageable
    );
}
