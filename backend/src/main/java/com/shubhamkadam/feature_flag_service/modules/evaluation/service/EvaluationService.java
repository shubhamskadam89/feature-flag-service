package com.shubhamkadam.feature_flag_service.modules.evaluation.service;

import com.shubhamkadam.feature_flag_service.modules.evaluation.common.BulkEvaluationRequest;
import com.shubhamkadam.feature_flag_service.modules.evaluation.common.BulkEvaluationResponse;
import com.shubhamkadam.feature_flag_service.modules.evaluation.common.EvaluationResult;
import com.shubhamkadam.feature_flag_service.modules.evaluation.context.EvaluationContext;
import java.util.UUID;

public interface EvaluationService {
    EvaluationResult evaluate(UUID environmentId, String featureKey, EvaluationContext context);

    BulkEvaluationResponse evaluateBulk(UUID environmentId, BulkEvaluationRequest request);
}
