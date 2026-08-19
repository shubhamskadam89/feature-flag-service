package com.shubhamkadam.feature_flag_service.modules.evaluation.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.math.BigDecimal;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record EvaluationReason(EvaluationReasonType type, BigDecimal rolloutPercentage, Long bucket, Long threshold) {
    public EvaluationReason(EvaluationReasonType type) {
        this(type, null, null, null);
    }

    public static EvaluationReason staticReason() {
        return new EvaluationReason(EvaluationReasonType.STATIC, null, null, null);
    }

    public static EvaluationReason percentageRollout(BigDecimal rolloutPercentage, long bucket, long threshold) {
        return new EvaluationReason(EvaluationReasonType.PERCENTAGE_ROLLOUT, rolloutPercentage, bucket, threshold);
    }
}
