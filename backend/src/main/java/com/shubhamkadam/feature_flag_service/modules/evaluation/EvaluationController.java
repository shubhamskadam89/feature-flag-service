package com.shubhamkadam.feature_flag_service.modules.evaluation;

import com.shubhamkadam.feature_flag_service.common.ApiResponse;
import com.shubhamkadam.feature_flag_service.modules.environment.Environment;
import com.shubhamkadam.feature_flag_service.security.ApiKeyAuthenticationFilter;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public evaluation API — authenticated by environment API key, not JWT.
 *
 * <p>The {@link ApiKeyAuthenticationFilter} runs before this controller and:
 * <ul>
 *   <li>validates the {@code X-Api-Key} header</li>
 *   <li>verifies the path {@code environmentId} matches the key's environment</li>
 *   <li>attaches the resolved {@link Environment} as a request attribute</li>
 * </ul>
 *
 * <p>This controller's only job is to extract inputs and delegate to
 * {@link EvaluationService}. It contains no evaluation logic, no repository
 * calls, and no knowledge of how the API key was validated.
 */
@RestController
@RequestMapping("/api/v1/evaluate")
@RequiredArgsConstructor
@Slf4j
public class EvaluationController {

    private final EvaluationService evaluationService;

    /**
     * Evaluates a feature flag for the authenticated environment.
     *
     * @param featureKey the public key of the feature flag (e.g. {@code checkout})
     * @param request    the HTTP request carrying the resolved environment attribute
     * @return {@code 200} with {@link EvaluationResult}; {@code 404} if the feature
     *         does not exist in this environment's project
     */
    @GetMapping("/environments/{environmentId}/features/{featureKey}")
    public ResponseEntity<ApiResponse<EvaluationResult>> evaluate(
        @PathVariable("environmentId") String environmentId,
        @PathVariable("featureKey") String featureKey,
        HttpServletRequest request
    ) {
        // The filter already validated the key and matched it to this environment.
        // We read the resolved environment from the request attribute to avoid
        // a redundant DB lookup.
        Environment environment = (Environment) request.getAttribute(
            ApiKeyAuthenticationFilter.RESOLVED_ENVIRONMENT_ATTR
        );

        log.info("Evaluating feature '{}' for environment {}", featureKey, environment.getId());

        EvaluationResult result = evaluationService.evaluate(environment.getId(), featureKey);

        return ResponseEntity.ok(
            ApiResponse.success(200, "Feature evaluated successfully", result, request.getRequestURI())
        );
    }

    /**
     * Evaluates multiple feature flags in bulk for the authenticated environment.
     *
     * @param environmentId the environment identifier (must match the API key's environment)
     * @param request       the bulk request payload containing the list of keys
     * @param httpRequest   the HTTP request carrying the resolved environment attribute
     * @return {@code 200} with {@link BulkEvaluationResponse}; {@code 400} if request validation fails;
     *         {@code 404} if any requested feature does not exist in this environment's project
     */
    @PostMapping("/environments/{environmentId}/bulk")
    public ResponseEntity<ApiResponse<BulkEvaluationResponse>> evaluateBulk(
        @PathVariable("environmentId") String environmentId,
        @RequestBody BulkEvaluationRequest request,
        HttpServletRequest httpRequest
    ) {
        Environment environment = (Environment) httpRequest.getAttribute(
            ApiKeyAuthenticationFilter.RESOLVED_ENVIRONMENT_ATTR
        );

        log.info(
            "Bulk evaluating {} features for environment {}",
            request.keys() != null ? request.keys().size() : 0,
            environment.getId()
        );

        BulkEvaluationResponse result = evaluationService.evaluateBulk(environment.getId(), request);

        return ResponseEntity.ok(
            ApiResponse.success(200, "Features evaluated in bulk successfully", result, httpRequest.getRequestURI())
        );
    }
}
