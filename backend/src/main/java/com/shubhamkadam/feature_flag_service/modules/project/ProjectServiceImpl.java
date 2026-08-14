package com.shubhamkadam.feature_flag_service.modules.project;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shubhamkadam.feature_flag_service.exceptions.ForbiddenException;
import com.shubhamkadam.feature_flag_service.exceptions.ResourceNotFoundException;
import com.shubhamkadam.feature_flag_service.modules.audit.AuditAction;
import com.shubhamkadam.feature_flag_service.modules.audit.AuditLogService;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRole;
import com.shubhamkadam.feature_flag_service.modules.organization.Organization;
import com.shubhamkadam.feature_flag_service.modules.organization.OrganizationRepository;
import com.shubhamkadam.feature_flag_service.modules.user.User;
import com.shubhamkadam.feature_flag_service.security.JwtService;
import com.shubhamkadam.feature_flag_service.security.OrganizationContextHolder;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;

    private final JwtService jwtService;
    private final ProjectMapper projectMapper;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper()
        .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    @Override
    @Transactional
    public ProjectResponseDto createProjectWithinOrganization(ProjectRequestDto requestDto) {
        log.info("Starting project creation process for project name: {}", requestDto.projectName());

        // 1. Retrieve the validated organization context from the ThreadLocal
        // interceptor
        OrganizationContextHolder.OrganizationContext context = OrganizationContextHolder.getContext();
        UUID orgId = context.getOrganizationId();

        // 2. Validate Authorization: Only ADMINs can create projects
        if (context.getRole() != MembershipRole.ADMIN) {
            log.warn("User attempted to create a project without ADMIN privileges in org: {}", orgId);
            throw new ForbiddenException("Only admins are allowed to create projects in this organization.");
        }

        // 3. Validate Business Logic: Project name must be unique within the active
        // projects of the organization
        boolean projectExists = projectRepository.existsByOrganizationIdAndNameAndDeletedAtIsNull(
            orgId,
            requestDto.projectName()
        );
        if (projectExists) {
            log.warn(
                "Project creation failed: Project with name '{}' already exists in org: {}",
                requestDto.projectName(),
                orgId
            );
            throw new IllegalArgumentException("A project with this name already exists in the organization.");
        }

        // 4. Fetch related entities
        Organization organization = organizationRepository
            .findById(orgId)
            .orElseThrow(() -> new ResourceNotFoundException("Organization not found for id: " + orgId));
        User user = jwtService.getCurrentlyAuthenticatedUser();

        // 5. Build and save the project entity
        log.debug("Building new Project entity");
        Project project = Project.builder()
            .id(UUID.randomUUID())
            .name(requestDto.projectName())
            .organization(organization)
            .createdBy(user) // CRITICAL: Added the createdBy assignment here
            .isDeleted(false) // Mapped to the new field in Project.java
            .createdAt(OffsetDateTime.now())
            .updatedAt(OffsetDateTime.now())
            .deletedAt(null)
            .build();

        projectRepository.save(project);
        log.info("Successfully created project with ID: {}", project.getId());

        try {
            String newValue = objectMapper.writeValueAsString(java.util.Map.of("name", project.getName()));
            auditLogService.recordEvent(organization, null, null, user, AuditAction.PROJECT_CREATED, null, newValue);
        } catch (Exception e) {
            log.error("Failed to write audit log for project creation", e);
        }

        // 6. Map to DTO and return
        return projectMapper.projectResponseDto(project);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectResponseDto> getAllProjectsByOrganization() {
        OrganizationContextHolder.OrganizationContext context = OrganizationContextHolder.getContext();
        log.info("Fetching all projects for organization: {}", context.getOrganizationId());

        List<Project> projectList = projectRepository.findByOrganizationIdAndDeletedAtIsNull(
            context.getOrganizationId()
        );

        return projectList.stream().map(projectMapper::projectResponseDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectResponseDto getProjectByIdWithinOrganization(UUID projectId) {
        OrganizationContextHolder.OrganizationContext context = OrganizationContextHolder.getContext();
        log.info("Fetching project with ID: {} for organization: {}", projectId, context.getOrganizationId());
        Project project = projectRepository
            .findByIdAndOrganizationIdAndDeletedAtIsNull(projectId, context.getOrganizationId())
            .orElseThrow(() -> new ResourceNotFoundException("Project not found or you don't have access."));
        return projectMapper.projectResponseDto(project);
    }

    @Override
    @Transactional
    public ProjectResponseDto updateProjectByIdWithinOrganization(ProjectRequestDto requestDto, UUID projectId) {
        OrganizationContextHolder.OrganizationContext context = OrganizationContextHolder.getContext();
        UUID orgId = context.getOrganizationId();
        log.info("Updating project with ID: {} in organization: {}", projectId, orgId);
        if (context.getRole() != MembershipRole.ADMIN) {
            log.warn("User attempted to update a project without ADMIN privileges in org: {}", orgId);
            throw new ForbiddenException("Only admins are allowed to update projects.");
        }
        Project project = projectRepository
            .findByIdAndOrganizationIdAndDeletedAtIsNull(projectId, orgId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found or you don't have access."));
        String oldName = project.getName();
        // Check if new name is already taken by another project
        if (!project.getName().equals(requestDto.projectName())) {
            boolean nameTaken = projectRepository.existsByOrganizationIdAndNameAndDeletedAtIsNull(
                orgId,
                requestDto.projectName()
            );
            if (nameTaken) {
                log.warn(
                    "Project update failed: Name '{}' is already taken in org: {}",
                    requestDto.projectName(),
                    orgId
                );
                throw new IllegalArgumentException("A project with this name already exists.");
            }
            project.setName(requestDto.projectName());
        }
        projectRepository.save(project);
        log.info("Successfully updated project with ID: {}", projectId);

        try {
            String oldValueStr = objectMapper.writeValueAsString(java.util.Map.of("name", oldName));
            String newValueStr = objectMapper.writeValueAsString(java.util.Map.of("name", project.getName()));
            User user = jwtService.getCurrentlyAuthenticatedUser();
            auditLogService.recordEvent(
                project.getOrganization(),
                null,
                null,
                user,
                AuditAction.PROJECT_UPDATED,
                oldValueStr,
                newValueStr
            );
        } catch (Exception e) {
            log.error("Failed to write audit log for project update", e);
        }

        return projectMapper.projectResponseDto(project);
    }

    @Override
    @Transactional
    public ProjectResponseDto softDeleteProject(UUID projectId) {
        OrganizationContextHolder.OrganizationContext context = OrganizationContextHolder.getContext();
        UUID orgId = context.getOrganizationId();
        log.info("Soft deleting project with ID: {} in organization: {}", projectId, orgId);
        if (context.getRole() != MembershipRole.ADMIN) {
            log.warn("User attempted to delete a project without ADMIN privileges in org: {}", orgId);
            throw new ForbiddenException("Only admins are allowed to delete projects.");
        }
        Project project = projectRepository
            .findByIdAndOrganizationIdAndDeletedAtIsNull(projectId, orgId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found or you don't have access."));
        project.setIsDeleted(true);
        project.setDeletedAt(OffsetDateTime.now());

        projectRepository.save(project);
        log.info("Successfully soft deleted project with ID: {}", projectId);

        try {
            String oldValueStr = objectMapper.writeValueAsString(java.util.Map.of("name", project.getName()));
            User user = jwtService.getCurrentlyAuthenticatedUser();
            auditLogService.recordEvent(
                project.getOrganization(),
                null,
                null,
                user,
                AuditAction.PROJECT_DELETED,
                oldValueStr,
                null
            );
        } catch (Exception e) {
            log.error("Failed to write audit log for project deletion", e);
        }

        return projectMapper.projectResponseDto(project);
    }
}
