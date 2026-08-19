package com.shubhamkadam.feature_flag_service.modules.evaluation.rollout;

import com.shubhamkadam.feature_flag_service.modules.evaluation.context.EvaluationContext;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import net.openhft.hashing.LongHashFunction;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DeterministicPercentageRolloutEvaluator implements PercentageRolloutEvaluator {

    private static final long BUCKET_COUNT = 1_000_000L;

    private final RolloutInputCanonicalizer canonicalizer;

    private static final LongHashFunction HASH_FUNCTION = LongHashFunction.xx();

    @Override
    public long bucket(String featureKey, EvaluationContext context) {
        if (context == null) {
            throw new IllegalArgumentException("Evaluation context must not be null");
        }

        byte[] input = canonicalizer.canonicalize(featureKey, context.key());

        long hash = HASH_FUNCTION.hashBytes(input);

        return Long.remainderUnsigned(hash, BUCKET_COUNT);
    }

    @Override
    public long threshold(BigDecimal rolloutPercentage) {
        if (rolloutPercentage == null) {
            throw new IllegalArgumentException("Rollout percentage must not be null");
        }

        if (
            rolloutPercentage.compareTo(BigDecimal.ZERO) < 0 || rolloutPercentage.compareTo(BigDecimal.valueOf(100)) > 0
        ) {
            throw new IllegalArgumentException("Rollout percentage must be between 0 and 100");
        }

        return rolloutPercentage.movePointRight(4).longValueExact();
    }

    @Override
    public boolean evaluate(String featureKey, EvaluationContext context, BigDecimal rolloutPercentage) {
        return bucket(featureKey, context) < threshold(rolloutPercentage);
    }
}
