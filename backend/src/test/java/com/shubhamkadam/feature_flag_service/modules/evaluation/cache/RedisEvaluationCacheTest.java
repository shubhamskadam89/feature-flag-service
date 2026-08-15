package com.shubhamkadam.feature_flag_service.modules.evaluation.cache;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.shubhamkadam.feature_flag_service.modules.evaluation.EvaluationResult;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

class RedisEvaluationCacheTest {

    private RedisTemplate<String, EvaluationResult> redisTemplate;
    private ValueOperations<String, EvaluationResult> valueOperations;
    private EvaluationCacheProperties properties;
    private RedisEvaluationCache cache;

    @BeforeEach
    void setUp() {
        redisTemplate = mock(RedisTemplate.class);
        valueOperations = mock(ValueOperations.class);

        properties = new EvaluationCacheProperties("evaluation", java.time.Duration.ofSeconds(60));

        cache = new RedisEvaluationCache(redisTemplate, properties);

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void shouldReturnEmptyWhenCacheMisses() {
        UUID environmentId = UUID.randomUUID();

        when(valueOperations.get("evaluation:" + environmentId + ":checkout")).thenReturn(null);

        Optional<EvaluationResult> result = cache.get(environmentId, "checkout");

        assertThat(result).isEmpty();
    }

    @Test
    void shouldReturnCachedResultWhenCacheHits() {
        UUID environmentId = UUID.randomUUID();

        EvaluationResult expected = new EvaluationResult("checkout", true);

        when(valueOperations.get("evaluation:" + environmentId + ":checkout")).thenReturn(expected);

        Optional<EvaluationResult> result = cache.get(environmentId, "checkout");

        assertThat(result).contains(expected);
    }

    @Test
    void shouldStoreEvaluationResultWithConfiguredTtl() {
        UUID environmentId = UUID.randomUUID();

        EvaluationResult result = new EvaluationResult("checkout", true);

        cache.put(environmentId, result);

        verify(valueOperations).set(
            "evaluation:" + environmentId + ":checkout",
            result,
            60_000L,
            java.util.concurrent.TimeUnit.MILLISECONDS
        );
    }

    @Test
    void shouldEvictCachedResult() {
        UUID environmentId = UUID.randomUUID();

        cache.evict(environmentId, "checkout");

        verify(redisTemplate).delete("evaluation:" + environmentId + ":checkout");
    }
}
