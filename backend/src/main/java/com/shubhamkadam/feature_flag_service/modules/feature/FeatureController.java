package com.shubhamkadam.feature_flag_service.modules.feature;

import com.shubhamkadam.feature_flag_service.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/projects/{projectId}/features")
@RequiredArgsConstructor
public class FeatureController {

    private final FeatureService featureService;

    @PostMapping
    public ResponseEntity<ApiResponse<FeatureResponseDto>> createFeature(
        @PathVariable UUID projectId,
        @Valid @RequestBody CreateFeatureRequest request,
        HttpServletRequest httpRequest
    ) {
        log.info("Creating feature for project: {}", projectId);

        FeatureResponseDto responseDto = featureService.createFeature(projectId, request);

        return ResponseEntity.ok(
            ApiResponse.success(
                HttpStatus.OK.value(),
                "Feature created successfully",
                responseDto,
                httpRequest.getRequestURI()
            )
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FeatureResponseDto>>> getFeatures(
        @PathVariable UUID projectId,
        HttpServletRequest httpRequest
    ) {
        log.info("Fetching features for project: {}", projectId);

        List<FeatureResponseDto> responseDtos = featureService.getFeatures(projectId);

        return ResponseEntity.ok(
            ApiResponse.success(
                HttpStatus.OK.value(),
                "Features retrieved successfully",
                responseDtos,
                httpRequest.getRequestURI()
            )
        );
    }

    @GetMapping("/{featureId}")
    public ResponseEntity<ApiResponse<FeatureResponseDto>> getFeatureById(
        @PathVariable UUID projectId,
        @PathVariable UUID featureId,
        HttpServletRequest httpRequest
    ) {
        log.info("Fetching feature {} for project: {}", featureId, projectId);

        FeatureResponseDto responseDto = featureService.getFeatureById(projectId, featureId);

        return ResponseEntity.ok(
            ApiResponse.success(
                HttpStatus.OK.value(),
                "Feature retrieved successfully",
                responseDto,
                httpRequest.getRequestURI()
            )
        );
    }

    @PatchMapping("/{featureId}")
    public ResponseEntity<ApiResponse<FeatureResponseDto>> updateFeature(
        @PathVariable UUID projectId,
        @PathVariable UUID featureId,
        @Valid @RequestBody UpdateFeatureRequest request,
        HttpServletRequest httpRequest
    ) {
        log.info("Updating feature {} in project: {}", featureId, projectId);

        FeatureResponseDto responseDto = featureService.updateFeature(projectId, featureId, request);

        return ResponseEntity.ok(
            ApiResponse.success(
                HttpStatus.OK.value(),
                "Feature updated successfully",
                responseDto,
                httpRequest.getRequestURI()
            )
        );
    }

    @DeleteMapping("/{featureId}")
    public ResponseEntity<ApiResponse<FeatureResponseDto>> deleteFeature(
        @PathVariable UUID projectId,
        @PathVariable UUID featureId,
        HttpServletRequest httpRequest
    ) {
        log.info("Deleting feature {} from project: {}", featureId, projectId);

        FeatureResponseDto responseDto = featureService.softDeleteFeature(projectId, featureId);

        return ResponseEntity.ok(
            ApiResponse.success(
                HttpStatus.OK.value(),
                "Feature deleted successfully",
                responseDto,
                httpRequest.getRequestURI()
            )
        );
    }
}
