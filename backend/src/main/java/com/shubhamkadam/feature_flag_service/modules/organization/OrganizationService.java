package com.shubhamkadam.feature_flag_service.modules.organization;

import java.util.List;
import java.util.UUID;

public interface OrganizationService {
    OrganizationResponseDto createOrg(OrganizationRequestDto requestDto);
    List<OrganizationResponseDto> getAllOrganizationsForUser();
    OrganizationResponseDto getOrganizationById(UUID orgId);
    OrganizationResponseDto updateOrganization(UUID orgId, OrganizationRequestDto requestDto);
    OrganizationResponseDto softDeleteOrganization(UUID orgId);
}
