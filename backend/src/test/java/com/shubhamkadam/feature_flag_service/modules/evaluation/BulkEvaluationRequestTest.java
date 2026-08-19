package com.shubhamkadam.feature_flag_service.modules.evaluation;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.shubhamkadam.feature_flag_service.exceptions.BadRequestException;
import com.shubhamkadam.feature_flag_service.modules.evaluation.common.BulkEvaluationRequest;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class BulkEvaluationRequestTest {

    @Test
    void validate_withValidKeys_passes() {
        BulkEvaluationRequest request = new BulkEvaluationRequest(List.of("checkout", "dark-mode", "new-ui.v2"));
        assertThatCode(request::validate).doesNotThrowAnyException();
    }

    @Test
    void validate_withNullKeys_throws() {
        BulkEvaluationRequest request = new BulkEvaluationRequest(null);
        assertThatThrownBy(request::validate)
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Keys list cannot be empty");
    }

    @Test
    void validate_withEmptyKeys_throws() {
        BulkEvaluationRequest request = new BulkEvaluationRequest(List.of());
        assertThatThrownBy(request::validate)
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Keys list cannot be empty");
    }

    @Test
    void validate_withTooManyKeys_throws() {
        List<String> keys = new ArrayList<>();
        for (int i = 0; i < 101; i++) {
            keys.add("key-" + i);
        }
        BulkEvaluationRequest request = new BulkEvaluationRequest(keys);
        assertThatThrownBy(request::validate)
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Cannot request more than 100 keys");
    }

    @Test
    void validate_withBlankKey_throws() {
        BulkEvaluationRequest request = new BulkEvaluationRequest(List.of("checkout", "   "));
        assertThatThrownBy(request::validate)
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Feature key cannot be blank");
    }

    @Test
    void validate_withNullKey_throws() {
        List<String> keys = new ArrayList<>();
        keys.add("checkout");
        keys.add(null);
        BulkEvaluationRequest request = new BulkEvaluationRequest(keys);
        assertThatThrownBy(request::validate)
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Feature key cannot be blank");
    }

    @Test
    void validate_withInvalidFormatKey_throws() {
        BulkEvaluationRequest request = new BulkEvaluationRequest(List.of("checkout", "invalidKeyWithUppercase"));
        assertThatThrownBy(request::validate)
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Feature key may contain only lowercase letters, numbers, dots, hyphens, and underscores");
    }

    @Test
    void validate_withDuplicateKeys_throws() {
        BulkEvaluationRequest request = new BulkEvaluationRequest(List.of("checkout", "dark-mode", "checkout"));
        assertThatThrownBy(request::validate)
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Duplicate feature keys are not allowed");
    }
}
