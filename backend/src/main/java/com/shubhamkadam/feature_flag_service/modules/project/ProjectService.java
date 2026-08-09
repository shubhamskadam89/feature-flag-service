package com.shubhamkadam.feature_flag_service.modules.project;

import java.util.List;
import java.util.UUID;

public interface ProjectService {
    ProjectResponseDto createProjectWithinOrganization(ProjectRequestDto requestDto);
    List<ProjectResponseDto> getAllProjectsByOrganization();
    ProjectResponseDto getProjectByIdWithinOrganization(UUID projectId);
    ProjectResponseDto updateProjectByIdWithinOrganization(ProjectRequestDto requestDto, UUID projectId);
    ProjectResponseDto softDeleteProject(UUID projectId);
}
