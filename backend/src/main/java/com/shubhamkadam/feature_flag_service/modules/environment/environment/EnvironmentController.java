package com.shubhamkadam.feature_flag_service.modules.environment.environment;

import com.shubhamkadam.feature_flag_service.common.ApiResponse;
import com.shubhamkadam.feature_flag_service.common.ErrorResponse;
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
@RequestMapping("/api/v1/projects/{projectId}/environments")
@RequiredArgsConstructor
public class EnvironmentController {

    private final EnvironmentService environmentService;

    @PostMapping("")
    public ResponseEntity<ApiResponse<EnvironmentWithKeyResponseDto>> createEnvironment(
        @PathVariable UUID projectId,
        @Valid @RequestBody EnvironmentRequestDto requestDto,
        HttpServletRequest request
    ) {
        log.info("Creating environment for project: {}", projectId);
        EnvironmentWithKeyResponseDto responseDto = environmentService.createEnvironment(projectId, requestDto);
        return ResponseEntity.ok(
            ApiResponse.success(
                HttpStatus.OK.value(),
                "Environment created successfully",
                responseDto,
                request.getRequestURI()
            )
        );
    }

    @GetMapping("")
    public ResponseEntity<ApiResponse<List<EnvironmentResponseDto>>> getEnvironments(
        @PathVariable UUID projectId,
        HttpServletRequest request
    ) {
        log.info("Fetching all environments for project: {}", projectId);
        List<EnvironmentResponseDto> responseDtos = environmentService.getEnvironments(projectId);
        return ResponseEntity.ok(
            ApiResponse.success(
                HttpStatus.OK.value(),
                "Environments retrieved successfully",
                responseDtos,
                request.getRequestURI()
            )
        );
    }

    @GetMapping("/{environmentId}")
    public ResponseEntity<ApiResponse<EnvironmentResponseDto>> getEnvironmentById(
        @PathVariable UUID projectId,
        @PathVariable UUID environmentId,
        HttpServletRequest request
    ) {
        log.info("Fetching environment {} for project: {}", environmentId, projectId);
        EnvironmentResponseDto responseDto = environmentService.getEnvironmentById(projectId, environmentId);
        return ResponseEntity.ok(
            ApiResponse.success(
                HttpStatus.OK.value(),
                "Environment retrieved successfully",
                responseDto,
                request.getRequestURI()
            )
        );
    }

    @PatchMapping("/{environmentId}")
    public ResponseEntity<ApiResponse<EnvironmentResponseDto>> updateEnvironment(
        @PathVariable UUID projectId,
        @PathVariable UUID environmentId,
        @Valid @RequestBody EnvironmentRequestDto requestDto,
        HttpServletRequest request
    ) {
        log.info("Updating environment {} for project: {}", environmentId, projectId);
        EnvironmentResponseDto responseDto = environmentService.updateEnvironment(projectId, environmentId, requestDto);
        return ResponseEntity.ok(
            ApiResponse.success(
                HttpStatus.OK.value(),
                "Environment updated successfully",
                responseDto,
                request.getRequestURI()
            )
        );
    }

    @DeleteMapping("/{environmentId}")
    public ResponseEntity<ApiResponse<EnvironmentResponseDto>> deleteEnvironment(
        @PathVariable UUID projectId,
        @PathVariable UUID environmentId,
        HttpServletRequest request
    ) {
        log.info("Deleting environment {} for project: {}", environmentId, projectId);
        EnvironmentResponseDto responseDto = environmentService.softDeleteEnvironment(projectId, environmentId);
        return ResponseEntity.ok(
            ApiResponse.success(
                HttpStatus.OK.value(),
                "Environment deleted successfully",
                responseDto,
                request.getRequestURI()
            )
        );
    }

    @PostMapping("/{environmentId}/rotate-key")
    public ResponseEntity<ApiResponse<EnvironmentWithKeyResponseDto>> rotateApiKey(
        @PathVariable UUID projectId,
        @PathVariable UUID environmentId,
        HttpServletRequest request
    ) {
        log.info("Rotating API key for environment {} in project: {}", environmentId, projectId);
        EnvironmentWithKeyResponseDto responseDto = environmentService.rotateApiKey(projectId, environmentId);
        return ResponseEntity.ok(
            ApiResponse.success(
                HttpStatus.OK.value(),
                "API key rotated successfully",
                responseDto,
                request.getRequestURI()
            )
        );
    }
}
