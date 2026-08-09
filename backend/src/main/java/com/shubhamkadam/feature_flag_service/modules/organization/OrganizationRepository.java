package com.shubhamkadam.feature_flag_service.modules.organization;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    Optional<Organization> findByIdAndDeletedAtIsNull(UUID id);
    Optional<Organization> findByName(String name);
}
