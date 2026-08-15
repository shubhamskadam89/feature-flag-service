package com.shubhamkadam.feature_flag_service.modules.evaluation;

import com.shubhamkadam.feature_flag_service.exceptions.BadRequestException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

public record BulkEvaluationRequest(List<String> keys) {
    private static final Pattern KEY_PATTERN = Pattern.compile("^[a-z0-9_.-]+$");

    public void validate() {
        if (keys == null || keys.isEmpty()) {
            throw new BadRequestException("Keys list cannot be empty");
        }
        if (keys.size() > 100) {
            throw new BadRequestException("Cannot request more than 100 keys");
        }

        Set<String> seen = new HashSet<>();
        for (String key : keys) {
            if (key == null || key.isBlank()) {
                throw new BadRequestException("Feature key cannot be blank");
            }
            if (!KEY_PATTERN.matcher(key).matches()) {
                throw new BadRequestException(
                    "Feature key may contain only lowercase letters, numbers, dots, hyphens, and underscores"
                );
            }
            if (!seen.add(key)) {
                throw new BadRequestException("Duplicate feature keys are not allowed: " + key);
            }
        }
    }
}
