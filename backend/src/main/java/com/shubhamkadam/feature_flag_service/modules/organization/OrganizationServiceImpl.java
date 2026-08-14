package com.shubhamkadam.feature_flag_service.modules.organization;

import com.shubhamkadam.feature_flag_service.exceptions.ResourceAlreadyExistsException;
import com.shubhamkadam.feature_flag_service.exceptions.ResourceNotFoundException;
import com.shubhamkadam.feature_flag_service.modules.membership.Membership;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipId;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRepository;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRole;
import com.shubhamkadam.feature_flag_service.modules.user.User;
import com.shubhamkadam.feature_flag_service.security.JwtService;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationServiceImpl implements OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMapper organizationMapper;
    private final MembershipRepository membershipRepository;
    private final JwtService jwtService;

    @Override
    @Transactional
    public OrganizationResponseDto createOrg(OrganizationRequestDto requestDto) {
        log.info("Creating organization with name: {}", requestDto.name());

        User currentUser = jwtService.getCurrentlyAuthenticatedUser();

        if (organizationRepository.findByName(requestDto.name()).isPresent()) {
            log.warn("Organization with name {} already exists", requestDto.name());
            throw new ResourceAlreadyExistsException("Organization", "name", requestDto.name());
        }

        Organization organization = organizationMapper.toEntity(requestDto);
        organization.setCreatedBy(currentUser.getId());
        Organization savedOrganization = organizationRepository.save(organization);

        log.debug("Assigning current user as ADMIN to the newly created organization: {}", savedOrganization.getId());
        Membership membership = Membership.builder()
            .id(new MembershipId(savedOrganization.getId(), currentUser.getId()))
            .organization(savedOrganization)
            .user(currentUser)
            .role(MembershipRole.ADMIN)
            .build();
        membershipRepository.save(membership);

        log.info("Organization created successfully with ID: {}", savedOrganization.getId());
        return organizationMapper.toDto(savedOrganization, MembershipRole.ADMIN);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrganizationResponseDto> getAllOrganizationsForUser() {
        User currentUser = jwtService.getCurrentlyAuthenticatedUser();
        log.info("Fetching all organizations for user ID: {}", currentUser.getId());

        List<Membership> memberships = membershipRepository.findByIdUserId(currentUser.getId());

        return memberships
            .stream()
            .filter(m -> m.getOrganization().getDeletedAt() == null)
            .map(m -> organizationMapper.toDto(m.getOrganization(), m.getRole()))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OrganizationResponseDto getOrganizationById(UUID orgId) {
        log.info("Fetching organization with ID: {}", orgId);

        Organization organization = organizationRepository
            .findByIdAndDeletedAtIsNull(orgId)
            .orElseThrow(() -> {
                log.error("Organization with ID {} not found", orgId);
                return new ResourceNotFoundException("Organization", "id", orgId.toString());
            });

        return organizationMapper.toDto(organization, getCurrentUserRole(orgId));
    }

    @Override
    @Transactional
    public OrganizationResponseDto updateOrganization(UUID orgId, OrganizationRequestDto requestDto) {
        log.info("Updating organization with ID: {}", orgId);

        Organization organization = organizationRepository
            .findByIdAndDeletedAtIsNull(orgId)
            .orElseThrow(() -> {
                log.error("Organization with ID {} not found for update", orgId);
                return new ResourceNotFoundException("Organization", "id", orgId.toString());
            });

        if (
            !organization.getName().equals(requestDto.name()) &&
            organizationRepository.findByName(requestDto.name()).isPresent()
        ) {
            log.warn("Cannot update organization {}: name {} already exists", orgId, requestDto.name());
            throw new ResourceAlreadyExistsException("Organization", "name", requestDto.name());
        }

        organization.setName(requestDto.name());
        Organization updatedOrganization = organizationRepository.save(organization);

        log.info("Organization with ID {} updated successfully", orgId);
        return organizationMapper.toDto(updatedOrganization, getCurrentUserRole(orgId));
    }

    @Override
    @Transactional
    public OrganizationResponseDto softDeleteOrganization(UUID orgId) {
        log.info("Soft deleting organization with ID: {}", orgId);

        Organization organization = organizationRepository
            .findByIdAndDeletedAtIsNull(orgId)
            .orElseThrow(() -> {
                log.error("Organization with ID {} not found for deletion", orgId);
                return new ResourceNotFoundException("Organization", "id", orgId.toString());
            });

        organization.setDeletedAt(OffsetDateTime.now());
        Organization deletedOrganization = organizationRepository.save(organization);

        log.info("Organization with ID {} soft deleted successfully", orgId);
        return organizationMapper.toDto(deletedOrganization, getCurrentUserRole(orgId));
    }

    private com.shubhamkadam.feature_flag_service.modules.membership.MembershipRole getCurrentUserRole(UUID orgId) {
        try {
            User currentUser = jwtService.getCurrentlyAuthenticatedUser();
            return membershipRepository
                .findByIdOrganizationIdAndIdUserId(orgId, currentUser.getId())
                .map(Membership::getRole)
                .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}
