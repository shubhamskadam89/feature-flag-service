package com.shubhamkadam.feature_flag_service.modules.evaluation.cache;

import com.shubhamkadam.feature_flag_service.modules.evaluation.EvaluationResult;
import java.util.Optional;
import java.util.UUID;

public interface EvaluationCache {
    Optional<EvaluationResult> get(UUID environmentId, String featureKey);

    void put(UUID environmentId, EvaluationResult result);

    void evict(UUID environmentId, String featureKey);

    void evictEnvironment(UUID environmentId);
}
