package com.shubhamkadam.feature_flag_service.modules.organization;

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
@RequestMapping("/api/v1/org")
@Tag(name = "Organizations", description = "Organization management APIs")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @Operation(
        summary = "Create a new organization",
        description = "Creates a new organization for the authenticated user"
    )
    @ApiResponses(
        value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "200",
                description = "Organization created successfully",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = OrganizationResponseDto.class)
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
    @PostMapping("")
    public ResponseEntity<ApiResponse<OrganizationResponseDto>> createOrganization(
        @Valid @RequestBody OrganizationRequestDto requestDto,
        HttpServletRequest request
    ) {
        log.info("Creating organization");
        OrganizationResponseDto responseDto = organizationService.createOrg(requestDto);

        ApiResponse<OrganizationResponseDto> response = ApiResponse.success(
            HttpStatus.OK.value(),
            "Organization created successfully",
            responseDto,
            request.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @Operation(
        summary = "Get all organizations",
        description = "Retrieves all organizations that the current user belongs to"
    )
    @ApiResponses(
        value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "200",
                description = "Successfully retrieved organizations",
                content = @Content(mediaType = "application/json")
            ),
        }
    )
    @GetMapping("")
    public ResponseEntity<ApiResponse<List<OrganizationResponseDto>>> getAllOrganizationsForUser(
        HttpServletRequest request
    ) {
        log.info("Fetching all organizations for user");
        List<OrganizationResponseDto> responseDtos = organizationService.getAllOrganizationsForUser();
        ApiResponse<List<OrganizationResponseDto>> response = ApiResponse.success(
            HttpStatus.OK.value(),
            "Organizations retrieved successfully",
            responseDtos,
            request.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get organization by ID", description = "Retrieves a specific organization by its ID")
    @ApiResponses(
        value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "200",
                description = "Successfully retrieved organization",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = OrganizationResponseDto.class)
                )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "404",
                description = "Organization not found",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            ),
        }
    )
    @GetMapping("/{orgId}")
    public ResponseEntity<ApiResponse<OrganizationResponseDto>> getOrganizationById(
        @PathVariable UUID orgId,
        HttpServletRequest request
    ) {
        log.info("Fetching organization by ID: {}", orgId);
        OrganizationResponseDto responseDto = organizationService.getOrganizationById(orgId);
        ApiResponse<OrganizationResponseDto> response = ApiResponse.success(
            HttpStatus.OK.value(),
            "Organization retrieved successfully",
            responseDto,
            request.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Update organization", description = "Updates an organization's details by ID")
    @ApiResponses(
        value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "200",
                description = "Organization updated successfully",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = OrganizationResponseDto.class)
                )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "404",
                description = "Organization not found",
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
    @PatchMapping("/{orgId}")
    public ResponseEntity<ApiResponse<OrganizationResponseDto>> updateOrganization(
        @PathVariable UUID orgId,
        @Valid @RequestBody OrganizationRequestDto requestDto,
        HttpServletRequest request
    ) {
        log.info("Updating organization with ID: {}", orgId);
        OrganizationResponseDto responseDto = organizationService.updateOrganization(orgId, requestDto);
        ApiResponse<OrganizationResponseDto> response = ApiResponse.success(
            HttpStatus.OK.value(),
            "Organization updated successfully",
            responseDto,
            request.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Delete organization", description = "Deletes an organization by ID")
    @ApiResponses(
        value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "200",
                description = "Organization deleted successfully"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "404",
                description = "Organization not found",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ErrorResponse.class)
                )
            ),
        }
    )
    @DeleteMapping("/{orgId}")
    public ResponseEntity<ApiResponse<OrganizationResponseDto>> deleteOrganization(
        @PathVariable UUID orgId,
        HttpServletRequest request
    ) {
        log.info("Deleting organization with ID: {}", orgId);
        OrganizationResponseDto responseDto = organizationService.softDeleteOrganization(orgId);
        ApiResponse<OrganizationResponseDto> response = ApiResponse.success(
            HttpStatus.OK.value(),
            "Organization deleted successfully",
            responseDto,
            request.getRequestURI()
        );
        return ResponseEntity.ok(response);
    }
}
