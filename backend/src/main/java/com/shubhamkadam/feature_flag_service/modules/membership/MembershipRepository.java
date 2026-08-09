package com.shubhamkadam.feature_flag_service.modules.membership;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MembershipRepository extends JpaRepository<Membership, MembershipId> {
    List<Membership> findByIdOrganizationId(UUID organizationId);

    List<Membership> findByIdUserId(UUID userId);

    Optional<Membership> findByIdOrganizationIdAndIdUserId(UUID organizationId, UUID userId);

    boolean existsByIdOrganizationIdAndIdUserId(UUID organizationId, UUID userId);
}
