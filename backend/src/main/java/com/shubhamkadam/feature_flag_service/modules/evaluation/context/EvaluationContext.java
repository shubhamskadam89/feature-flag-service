package com.shubhamkadam.feature_flag_service.modules.evaluation.context;

import java.util.Map;

public record EvaluationContext(String key, Map<String, Object> attributes) {
    public EvaluationContext {
        if (key == null || key.isBlank()) {
            throw new IllegalArgumentException("Evaluation context key must not be blank");
        }

        attributes = attributes == null ? Map.of() : Map.copyOf(attributes);
    }
}
