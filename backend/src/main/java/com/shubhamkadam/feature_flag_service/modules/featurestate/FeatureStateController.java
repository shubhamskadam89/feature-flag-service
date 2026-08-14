package com.shubhamkadam.feature_flag_service.modules.featurestate;

import com.shubhamkadam.feature_flag_service.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/environments/{environmentId}/features")
@RequiredArgsConstructor
public class FeatureStateController {

    private final FeatureStateService featureStateService;

    @PatchMapping("/{featureKey}")
    public ResponseEntity<ApiResponse<FeatureStateResponse>> toggleFeatureState(
        @PathVariable UUID environmentId,
        @PathVariable String featureKey,
        @Valid @RequestBody FeatureStateRequest request,
        HttpServletRequest httpRequest
    ) {
        log.info("Updating feature state for key '{}' in environment {}", featureKey, environmentId);

        FeatureStateResponse response = featureStateService.toggleFeatureState(environmentId, featureKey, request);

        return ResponseEntity.ok(
            ApiResponse.success(
                HttpStatus.OK.value(),
                "Feature state updated successfully",
                response,
                httpRequest.getRequestURI()
            )
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FeatureStateResponse>>> getFeatureStates(
        @PathVariable UUID environmentId,
        HttpServletRequest httpRequest
    ) {
        log.info("Fetching feature states for environment {}", environmentId);
        List<FeatureStateResponse> response = featureStateService.getFeatureStatesByEnvironment(environmentId);
        return ResponseEntity.ok(
            ApiResponse.success(
                HttpStatus.OK.value(),
                "Feature states retrieved successfully",
                response,
                httpRequest.getRequestURI()
            )
        );
    }
}
