package com.shubhamkadam.feature_flag_service.modules.evaluation.cache;

import com.shubhamkadam.feature_flag_service.modules.evaluation.common.EvaluationResult;
import com.shubhamkadam.feature_flag_service.modules.evaluation.context.EvaluationContext;
import java.util.Optional;
import java.util.UUID;

public interface EvaluationCache {
    Optional<EvaluationResult> get(UUID environmentId, String featureKey);

    Optional<EvaluationResult> get(UUID environmentId, String featureKey, EvaluationContext context);

    void put(UUID environmentId, EvaluationResult result);

    void put(UUID environmentId, EvaluationResult result, EvaluationContext context);

    void invalidate(UUID environmentId, String featureKey);

    default void evict(UUID environmentId, String featureKey) {
        invalidate(environmentId, featureKey);
    }

    void evictEnvironment(UUID environmentId);
}
