package com.shubhamkadam.feature_flag_service.modules.evaluation.cache;

import static org.assertj.core.api.Assertions.assertThat;

import com.shubhamkadam.feature_flag_service.modules.evaluation.common.EvaluationResult;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;

@SpringBootTest
class RedisEvaluationCacheIntegrationTest {

    @Autowired
    private EvaluationCache cache;

    @Autowired
    private RedisTemplate<String, EvaluationResult> evaluationRedisTemplate;

    @AfterEach
    void cleanup() {
        evaluationRedisTemplate.getConnectionFactory().getConnection().serverCommands().flushDb();
    }

    @Test
    void shouldStoreAndRetrieveEvaluationResult() {
        UUID environmentId = UUID.randomUUID();

        EvaluationResult expected = new EvaluationResult("checkout", true);

        cache.put(environmentId, expected);

        Optional<EvaluationResult> actual = cache.get(environmentId, "checkout");

        assertThat(actual).contains(expected);
    }

    @Test
    void shouldReturnEmptyForMissingEntry() {
        UUID environmentId = UUID.randomUUID();

        Optional<EvaluationResult> result = cache.get(environmentId, "checkout");

        assertThat(result).isEmpty();
    }

    @Test
    void shouldKeepEntriesIsolatedByEnvironment() {
        UUID environmentA = UUID.randomUUID();
        UUID environmentB = UUID.randomUUID();

        EvaluationResult resultA = new EvaluationResult("checkout", true);

        EvaluationResult resultB = new EvaluationResult("checkout", false);

        cache.put(environmentA, resultA);
        cache.put(environmentB, resultB);

        assertThat(cache.get(environmentA, "checkout")).contains(resultA);

        assertThat(cache.get(environmentB, "checkout")).contains(resultB);
    }

    @Test
    void shouldEvictEntry() {
        UUID environmentId = UUID.randomUUID();

        EvaluationResult result = new EvaluationResult("checkout", true);

        cache.put(environmentId, result);

        assertThat(cache.get(environmentId, "checkout")).contains(result);

        cache.evict(environmentId, "checkout");

        assertThat(cache.get(environmentId, "checkout")).isEmpty();
    }

    @Test
    void shouldApplyConfiguredTtl() {
        UUID environmentId = UUID.randomUUID();

        EvaluationResult result = new EvaluationResult("checkout", true);

        cache.put(environmentId, result);

        String redisKey = "evaluation:" + environmentId + ":checkout";

        Long ttl = evaluationRedisTemplate.getExpire(redisKey);

        assertThat(ttl).isNotNull().isGreaterThan(0);
    }
}
