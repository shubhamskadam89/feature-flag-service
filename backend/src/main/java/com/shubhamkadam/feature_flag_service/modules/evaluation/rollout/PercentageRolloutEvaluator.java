package com.shubhamkadam.feature_flag_service.modules.evaluation.rollout;

import com.shubhamkadam.feature_flag_service.modules.evaluation.context.EvaluationContext;
import java.math.BigDecimal;

public interface PercentageRolloutEvaluator {
    long bucket(String featureKey, EvaluationContext context);

    long threshold(BigDecimal rolloutPercentage);

    boolean evaluate(String featureKey, EvaluationContext context, BigDecimal rolloutPercentage);
}
