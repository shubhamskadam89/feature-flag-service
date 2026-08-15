package com.shubhamkadam.feature_flag_service.modules.evaluation.cache;

import com.shubhamkadam.feature_flag_service.modules.evaluation.EvaluationResult;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.SerializationException;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RedisEvaluationCache implements EvaluationCache {

    private final RedisTemplate<String, EvaluationResult> redisTemplate;
    private final EvaluationCacheProperties properties;

    @Override
    public Optional<EvaluationResult> get(UUID environmentId, String featureKey) {
        String key = buildKey(environmentId, featureKey);

        try {
            EvaluationResult result = redisTemplate.opsForValue().get(key);
            return Optional.ofNullable(result);
        } catch (DataAccessException | SerializationException e) {
            log.warn(
                "Redis cache read failed for environment={} feature={}; falling back to PostgreSQL",
                environmentId,
                featureKey,
                e
            );
            return Optional.empty();
        }
    }

    @Override
    public void put(UUID environmentId, EvaluationResult result) {
        String key = buildKey(environmentId, result.key());

        try {
            redisTemplate.opsForValue().set(key, result, properties.ttl().toMillis(), TimeUnit.MILLISECONDS);
        } catch (DataAccessException | SerializationException e) {
            log.warn(
                "Redis cache write failed for environment={} feature={}; evaluation result remains valid",
                environmentId,
                result.key(),
                e
            );
        }
    }

    @Override
    public void evict(UUID environmentId, String featureKey) {
        String key = buildKey(environmentId, featureKey);

        try {
            redisTemplate.delete(key);
        } catch (DataAccessException e) {
            log.warn("Redis cache eviction failed for environment={} feature={}", environmentId, featureKey, e);
        }
    }

    @Override
    public void evictEnvironment(UUID environmentId) {
        String pattern = properties.keyPrefix() + ":" + environmentId + ":*";
        try {
            redisTemplate.execute((org.springframework.data.redis.connection.RedisConnection connection) -> {
                try (
                    org.springframework.data.redis.core.Cursor<byte[]> cursor = connection.scan(
                        org.springframework.data.redis.core.ScanOptions.scanOptions().match(pattern).count(100).build()
                    )
                ) {
                    while (cursor.hasNext()) {
                        connection.del(cursor.next());
                    }
                } catch (Exception e) {}
                return null;
            });
        } catch (DataAccessException e) {
            log.warn("Redis environment cache eviction failed for environment={}", environmentId, e);
        }
    }

    private String buildKey(UUID environmentId, String featureKey) {
        return properties.keyPrefix() + ":" + environmentId + ":" + featureKey;
    }
}
