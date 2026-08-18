package com.shubhamkadam.feature_flag_service.modules.evaluation.rollout;

public interface RolloutInputCanonicalizer {
    byte[] canonicalize(String featureKey, String contextKey);
}
