package com.shubhamkadam.feature_flag_service.modules.evaluation.context;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class EvaluationContextTest {

    private EvaluationContext evaluationContextUnderTest;

    @BeforeEach
    void setUp() {
        evaluationContextUnderTest = new EvaluationContext("key", Map.of("value", "value"));
    }

    @Test
    void shouldReturnKey() {
        assertThat(evaluationContextUnderTest.key()).isEqualTo("key");
    }

    @Test
    void shouldReturnAttributes() {
        assertThat(evaluationContextUnderTest.attributes()).containsEntry("value", "value");
    }

    @Test
    void shouldUseEmptyAttributesWhenAttributesAreNull() {
        EvaluationContext context = new EvaluationContext("key", null);

        assertThat(context.attributes()).isEmpty();
    }

    @Test
    void shouldRejectNullKey() {
        assertThatThrownBy(() -> new EvaluationContext(null, Map.of())).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void shouldRejectBlankKey() {
        assertThatThrownBy(() -> new EvaluationContext("   ", Map.of())).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void shouldProtectAttributesFromExternalMutation() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("plan", "PRO");

        EvaluationContext context = new EvaluationContext("user-123", attributes);

        attributes.put("plan", "FREE");

        assertThat(context.attributes()).containsEntry("plan", "PRO");
    }

    @Test
    void shouldExposeImmutableAttributes() {
        assertThatThrownBy(() -> evaluationContextUnderTest.attributes().put("country", "IN")).isInstanceOf(
            UnsupportedOperationException.class
        );
    }
}
