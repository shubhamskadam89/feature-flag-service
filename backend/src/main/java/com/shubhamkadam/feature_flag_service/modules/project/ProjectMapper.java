package com.shubhamkadam.feature_flag_service.modules.project;

import org.springframework.stereotype.Component;

@Component
public class ProjectMapper {

    ProjectResponseDto projectResponseDto(Project project) {
        return new ProjectResponseDto(
            project.getName(),
            project.getId(),
            project.getOrganization().getName(),
            project.getOrganization().getId(),
            project.getCreatedAt(),
            project.getUpdatedAt(),
            project.getCreatedBy().getName(),
            project.getCreatedBy().getId()
        );
    }
}
