package com.shubhamkadam.feature_flag_service.modules.evaluation.rollout;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class DeterministicPercentageRolloutEvaluatorTest {

    private final PercentageRolloutEvaluator evaluator = new DeterministicPercentageRolloutEvaluator(
        new DeterministicRolloutInputCanonicalizer()
    );

    @Test
    void bucket_shouldBeWithinDefinedRange() {
        long bucket = evaluator.bucket("checkout-v2", "user-123");

        assertTrue(bucket >= 0);
        assertTrue(bucket < 1_000_000);
    }

    @Test
    void sameFeatureAndContext_shouldProduceSameBucket() {
        long first = evaluator.bucket("checkout-v2", "user-123");
        long second = evaluator.bucket("checkout-v2", "user-123");

        assertEquals(first, second);
    }

    @Test
    void zeroPercent_shouldAlwaysBeDisabled() {
        assertFalse(evaluator.evaluate("checkout-v2", "user-123", new BigDecimal("0.00")));
    }

    @Test
    void hundredPercent_shouldAlwaysBeEnabled() {
        assertTrue(evaluator.evaluate("checkout-v2", "user-123", new BigDecimal("100.00")));
    }

    @Test
    void threshold_shouldConvertPercentageToIntegerThreshold() {
        assertEquals(0L, evaluator.threshold(new BigDecimal("0.00")));

        assertEquals(155_500L, evaluator.threshold(new BigDecimal("15.55")));

        assertEquals(500_000L, evaluator.threshold(new BigDecimal("50.00")));

        assertEquals(1_000_000L, evaluator.threshold(new BigDecimal("100.00")));
    }

    @Test
    void percentageBelowZero_shouldBeRejected() {
        assertThrows(IllegalArgumentException.class, () ->
            evaluator.evaluate("checkout-v2", "user-123", new BigDecimal("-0.01"))
        );
    }

    @Test
    void percentageAboveHundred_shouldBeRejected() {
        assertThrows(IllegalArgumentException.class, () ->
            evaluator.evaluate("checkout-v2", "user-123", new BigDecimal("100.01"))
        );
    }

    @Test
    void nullPercentage_shouldBeRejected() {
        assertThrows(IllegalArgumentException.class, () -> evaluator.evaluate("checkout-v2", "user-123", null));
    }

    @Test
    void missingContext_shouldBeRejected() {
        assertThrows(IllegalArgumentException.class, () ->
            evaluator.evaluate("checkout-v2", null, new BigDecimal("50.00"))
        );
    }

    @Test
    void blankContext_shouldBeRejected() {
        assertThrows(IllegalArgumentException.class, () ->
            evaluator.evaluate("checkout-v2", "   ", new BigDecimal("50.00"))
        );
    }

    @Test
    void knownInput_checkoutUser123_shouldProduceStableBucket() {
        assertEquals(504_602L, evaluator.bucket("checkout-v2", "user-123"));
    }

    @Test
    void knownInput_checkoutUser456_shouldProduceStableBucket() {
        assertEquals(77_133L, evaluator.bucket("checkout-v2", "user-456"));
    }

    @Test
    void knownInput_newDashboardUser123_shouldProduceStableBucket() {
        assertEquals(149_570L, evaluator.bucket("new-dashboard", "user-123"));
    }
}
