package com.shubhamkadam.feature_flag_service.modules.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    Page<AuditLog> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId, Pageable pageable);

    Page<AuditLog> findByOrganizationIdAndEnvironmentIdOrderByCreatedAtDesc(UUID organizationId, UUID environmentId, Pageable pageable);

    Page<AuditLog> findByOrganizationIdAndFeatureIdOrderByCreatedAtDesc(UUID organizationId, UUID featureId, Pageable pageable);
}
