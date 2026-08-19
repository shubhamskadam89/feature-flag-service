package com.shubhamkadam.feature_flag_service.modules.evaluation.common;

public record EvaluationResult(String key, boolean enabled, EvaluationReason reason) {
    public EvaluationResult(String key, boolean enabled) {
        this(key, enabled, new EvaluationReason(EvaluationReasonType.STATIC));
    }
}
