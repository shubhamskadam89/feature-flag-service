package com.shubhamkadam.feature_flag_service.modules.evaluation.rollout;

import java.math.BigDecimal;

public interface PercentageRolloutEvaluator {
    long bucket(String featureKey, String contextKey);

    long threshold(BigDecimal rolloutPercentage);

    boolean evaluate(String featureKey, String contextKey, BigDecimal rolloutPercentage);
}
