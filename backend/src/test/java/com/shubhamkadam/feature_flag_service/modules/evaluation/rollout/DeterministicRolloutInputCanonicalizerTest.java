package com.shubhamkadam.feature_flag_service.modules.evaluation.rollout;

import static org.junit.jupiter.api.Assertions.*;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class DeterministicRolloutInputCanonicalizerTest {

    private final RolloutInputCanonicalizer canonicalizer = new DeterministicRolloutInputCanonicalizer();

    @Test
    void shouldBuildCanonicalInputUsingFeatureAndContext() {
        byte[] result = canonicalizer.canonicalize("checkout-v2", "user-123");

        assertArrayEquals("checkout-v2:user-123".getBytes(StandardCharsets.UTF_8), result);
    }

    @Test
    void shouldUseUtf8Encoding() {
        byte[] result = canonicalizer.canonicalize("café", "用户-123");

        byte[] expected = "café:用户-123".getBytes(StandardCharsets.UTF_8);

        assertArrayEquals(expected, result);
    }

    @Test
    void shouldRejectNullFeatureKey() {
        assertThrows(IllegalArgumentException.class, () -> canonicalizer.canonicalize(null, "user-123"));
    }

    @Test
    void shouldRejectBlankFeatureKey() {
        assertThrows(IllegalArgumentException.class, () -> canonicalizer.canonicalize("   ", "user-123"));
    }

    @Test
    void shouldRejectNullContextKey() {
        assertThrows(IllegalArgumentException.class, () -> canonicalizer.canonicalize("checkout-v2", null));
    }

    @Test
    void shouldRejectBlankContextKey() {
        assertThrows(IllegalArgumentException.class, () -> canonicalizer.canonicalize("checkout-v2", "   "));
    }
}
