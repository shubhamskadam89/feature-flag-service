package com.shubhamkadam.feature_flag_service.modules.evaluation.rollout;

import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Component;

@Component
public class DeterministicRolloutInputCanonicalizer implements RolloutInputCanonicalizer {

    private static final String SEPARATOR = ":";

    @Override
    public byte[] canonicalize(String featureKey, String contextKey) {
        if (featureKey == null || featureKey.isBlank()) {
            throw new IllegalArgumentException("Feature key must not be blank");
        }

        if (contextKey == null || contextKey.isBlank()) {
            throw new IllegalArgumentException("Context key must not be blank");
        }

        String canonicalInput = featureKey + SEPARATOR + contextKey;

        return canonicalInput.getBytes(StandardCharsets.UTF_8);
    }
}
