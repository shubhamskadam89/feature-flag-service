package com.shubhamkadam.feature_flag_service.modules.organization;

import org.springframework.stereotype.Component;

@Component
public class OrganizationMapper {

    public Organization toEntity(OrganizationRequestDto requestDto) {
        if (requestDto == null) {
            return null;
        }

        return Organization.builder()
                .name(requestDto.name())
                .build();
    }

    public OrganizationResponseDto toDto(Organization organization) {
        if (organization == null) {
            return null;
        }

        return new OrganizationResponseDto(
                organization.getId(),
                organization.getName(),
                organization.getCreatedAt(),
                organization.getUpdatedAt(),
                organization.getCreatedBy()
        );
    }
}
