package com.shubhamkadam.feature_flag_service.modules.evaluation.cache;

import com.shubhamkadam.feature_flag_service.modules.evaluation.common.EvaluationResult;
import com.shubhamkadam.feature_flag_service.modules.evaluation.context.EvaluationContext;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Autowired(required = false)
    private MeterRegistry meterRegistry;

    @Override
    public Optional<EvaluationResult> get(UUID environmentId, String featureKey) {
        String key = buildKey(environmentId, featureKey);
        return getByKey(key, environmentId, featureKey);
    }

    @Override
    public Optional<EvaluationResult> get(UUID environmentId, String featureKey, EvaluationContext context) {
        if (context == null) {
            return get(environmentId, featureKey);
        }
        String key = buildKey(environmentId, featureKey, context);
        return getByKey(key, environmentId, featureKey);
    }

    private Optional<EvaluationResult> getByKey(String key, UUID environmentId, String featureKey) {
        Timer.Sample sample = meterRegistry != null ? Timer.start(meterRegistry) : null;
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
        } finally {
            if (sample != null) {
                sample.stop(meterRegistry.timer("evaluation.redis.lookup"));
            }
        }
    }

    @Override
    public void put(UUID environmentId, EvaluationResult result) {
        String key = buildKey(environmentId, result.key());
        putByKey(key, environmentId, result);
    }

    @Override
    public void put(UUID environmentId, EvaluationResult result, EvaluationContext context) {
        if (context == null) {
            put(environmentId, result);
            return;
        }
        String key = buildKey(environmentId, result.key(), context);
        putByKey(key, environmentId, result);
    }

    private void putByKey(String key, UUID environmentId, EvaluationResult result) {
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
    public void invalidate(UUID environmentId, String featureKey) {
        String baseKey = buildKey(environmentId, featureKey);
        String contextPattern = baseKey + ":context:*";

        try {
            redisTemplate.delete(baseKey);

            redisTemplate.execute((org.springframework.data.redis.connection.RedisConnection connection) -> {
                try (
                    org.springframework.data.redis.core.Cursor<byte[]> cursor = connection.scan(
                        org.springframework.data.redis.core.ScanOptions.scanOptions()
                            .match(contextPattern)
                            .count(100)
                            .build()
                    )
                ) {
                    while (cursor.hasNext()) {
                        connection.del(cursor.next());
                    }
                } catch (Exception e) {
                    log.warn(
                        "Error scanning contextual keys for eviction: environment={} feature={}",
                        environmentId,
                        featureKey,
                        e
                    );
                }
                return null;
            });
        } catch (DataAccessException e) {
            log.warn("Redis cache invalidation failed for environment={} feature={}", environmentId, featureKey, e);
        }
    }

    @Override
    public void evict(UUID environmentId, String featureKey) {
        invalidate(environmentId, featureKey);
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

    private String buildKey(UUID environmentId, String featureKey, EvaluationContext context) {
        String contextHash = sha256Hex(context.key());
        return properties.keyPrefix() + ":" + environmentId + ":" + featureKey + ":context:" + contextHash;
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
