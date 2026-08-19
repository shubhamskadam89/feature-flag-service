package com.shubhamkadam.feature_flag_service.modules.evaluation.common;

import com.shubhamkadam.feature_flag_service.modules.feature.FeatureType;
import java.math.BigDecimal;
import java.util.UUID;

public record FeatureEvaluationData(
    UUID featureId,
    String key,
    FeatureType type,
    Boolean enabled,
    String value,
    BigDecimal rolloutPercentage
) {}
