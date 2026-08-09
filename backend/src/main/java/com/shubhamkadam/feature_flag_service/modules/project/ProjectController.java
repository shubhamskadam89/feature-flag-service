package com.shubhamkadam.feature_flag_service.modules.project;

import com.shubhamkadam.feature_flag_service.common.ApiResponse;
import com.shubhamkadam.feature_flag_service.common.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/projects")
@Tag(name = "Projects", description = "Project management APIs")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @Operation(summary = "Create a new project", description = "Creates a new project within the organization context")
    @ApiResponses(
        value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "200",
                description = "Project created successfully",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ProjectResponseDto.class)
                )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "400",
                description = "Invalid request format",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "403",
                description = "Forbidden - missing or invalid organization context",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            ),
        }
    )
    @PostMapping("")
    public ResponseEntity<ApiResponse<ProjectResponseDto>> createProject(
        @Valid @RequestBody ProjectRequestDto projectRequestDto,
        HttpServletRequest request
    ) {
        log.info("Project creation request fetched");
        ProjectResponseDto responseDto = projectService.createProjectWithinOrganization(projectRequestDto);
        ApiResponse<ProjectResponseDto> response = ApiResponse.success(
            HttpStatus.OK.value(),
            "Project created successfully",
            responseDto,
            request.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get all projects", description = "Retrieves all projects for the organization context")
    @ApiResponses(
        value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "200",
                description = "Successfully retrieved projects",
                content = @Content(mediaType = "application/json")
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "403",
                description = "Forbidden - missing or invalid organization context",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            ),
        }
    )
    @GetMapping("")
    public ResponseEntity<ApiResponse<List<ProjectResponseDto>>> getAllProjectsByOrganization(
        HttpServletRequest request
    ) {
        log.info("Fetching all project in organization");
        List<ProjectResponseDto> responseDtos = projectService.getAllProjectsByOrganization();
        ApiResponse<List<ProjectResponseDto>> listApiResponse = ApiResponse.success(
            HttpStatus.OK.value(),
            "Project retrieved successfully",
            responseDtos,
            request.getRequestURI()
        );
        return ResponseEntity.ok(listApiResponse);
    }

    @Operation(summary = "Get project by ID", description = "Retrieves a specific project by its ID")
    @ApiResponses(
        value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "200",
                description = "Successfully retrieved project",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ProjectResponseDto.class)
                )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "404",
                description = "Project not found",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "403",
                description = "Forbidden - missing or invalid organization context",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            ),
        }
    )
    @GetMapping("/{projectId}")
    public ResponseEntity<ApiResponse<ProjectResponseDto>> getProjectById(
        @PathVariable UUID projectId,
        HttpServletRequest request
    ) {
        log.info("Fetching project by ID: {}", projectId);
        // Note: Using null for requestDto as per the current interface signature
        ProjectResponseDto responseDto = projectService.getProjectByIdWithinOrganization(projectId);
        ApiResponse<ProjectResponseDto> response = ApiResponse.success(
            HttpStatus.OK.value(),
            "Project retrieved successfully",
            responseDto,
            request.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Update project", description = "Updates a project's details by ID")
    @ApiResponses(
        value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "200",
                description = "Project updated successfully",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ProjectResponseDto.class)
                )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "404",
                description = "Project not found",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "400",
                description = "Invalid request format",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            ),
        }
    )
    @PatchMapping("/{projectId}")
    public ResponseEntity<ApiResponse<ProjectResponseDto>> updateProject(
        @PathVariable UUID projectId,
        @Valid @RequestBody ProjectRequestDto projectRequestDto,
        HttpServletRequest request
    ) {
        log.info("Updating project with ID: {}", projectId);
        ProjectResponseDto responseDto = projectService.updateProjectByIdWithinOrganization(
            projectRequestDto,
            projectId
        );
        ApiResponse<ProjectResponseDto> response = ApiResponse.success(
            HttpStatus.OK.value(),
            "Project updated successfully",
            responseDto,
            request.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Delete project", description = "Deletes a project by ID")
    @ApiResponses(
        value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "200",
                description = "Project deleted successfully"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "404",
                description = "Project not found",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "403",
                description = "Forbidden - missing or invalid organization context",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            ),
        }
    )
    @DeleteMapping("/{projectId}")
    public ResponseEntity<ApiResponse<ProjectResponseDto>> deleteProject(
        @PathVariable UUID projectId,
        HttpServletRequest request
    ) {
        log.info("Deleting project with ID: {}", projectId);
        // Note: ProjectService softDeleteProject returns ProjectResponseDto and takes a RequestDto
        ProjectResponseDto responseDto = projectService.softDeleteProject(projectId);
        ApiResponse<ProjectResponseDto> response = ApiResponse.success(
            HttpStatus.OK.value(),
            "Project deleted successfully",
            responseDto,
            request.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }
}
