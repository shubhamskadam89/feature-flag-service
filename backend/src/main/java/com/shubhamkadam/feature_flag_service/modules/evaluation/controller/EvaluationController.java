package com.shubhamkadam.feature_flag_service.modules.evaluation.controller;

import com.shubhamkadam.feature_flag_service.common.ApiResponse;
import com.shubhamkadam.feature_flag_service.modules.evaluation.common.BulkEvaluationRequest;
import com.shubhamkadam.feature_flag_service.modules.evaluation.common.BulkEvaluationResponse;
import com.shubhamkadam.feature_flag_service.modules.evaluation.common.EvaluationResult;
import com.shubhamkadam.feature_flag_service.modules.evaluation.context.EvaluationContext;
import com.shubhamkadam.feature_flag_service.modules.evaluation.service.EvaluationService;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/evaluate/environments/{environmentId}")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;

    @GetMapping("/features/{featureKey}")
    public ResponseEntity<ApiResponse<EvaluationResult>> evaluateFeature(
        @PathVariable UUID environmentId,
        @PathVariable String featureKey,
        @RequestParam(required = false) String contextKey
    ) {
        EvaluationContext context = contextKey == null ? null : new EvaluationContext(contextKey, Map.of());

        EvaluationResult result = evaluationService.evaluate(environmentId, featureKey, context);

        return ResponseEntity.ok(
            ApiResponse.<EvaluationResult>builder()
                .status(200)
                .data(result)
                .message("Feature evaluated successfully")
                .build()
        );
    }

    @PostMapping({ "/batch", "/bulk" })
    public ResponseEntity<ApiResponse<BulkEvaluationResponse>> evaluateBulkFeatures(
        @PathVariable UUID environmentId,
        @Valid @RequestBody BulkEvaluationRequest requestBody
    ) {
        BulkEvaluationResponse response = evaluationService.evaluateBulk(environmentId, requestBody);

        return ResponseEntity.ok(
            ApiResponse.<BulkEvaluationResponse>builder()
                .status(200)
                .data(response)
                .message("Bulk evaluation completed successfully")
                .build()
        );
    }
}
