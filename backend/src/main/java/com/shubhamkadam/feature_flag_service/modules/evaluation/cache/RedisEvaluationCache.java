package com.shubhamkadam.feature_flag_service.modules.evaluation.cache;

import com.shubhamkadam.feature_flag_service.modules.evaluation.EvaluationResult;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RedisEvaluationCache implements EvaluationCache {

    private final RedisTemplate<String, EvaluationResult> redisTemplate;
    private final EvaluationCacheProperties properties;

    @Override
    public Optional<EvaluationResult> get(UUID environmentId, String featureKey) {
        String key = buildKey(environmentId, featureKey);

        EvaluationResult result = redisTemplate.opsForValue().get(key);

        return Optional.ofNullable(result);
    }

    @Override
    public void put(UUID environmentId, EvaluationResult result) {
        String key = buildKey(environmentId, result.key());

        redisTemplate.opsForValue().set(key, result, properties.ttl().toMillis(), TimeUnit.MILLISECONDS);
    }

    @Override
    public void evict(UUID environmentId, String featureKey) {
        String key = buildKey(environmentId, featureKey);

        redisTemplate.delete(key);
    }

    private String buildKey(UUID environmentId, String featureKey) {
        return properties.keyPrefix() + ":" + environmentId + ":" + featureKey;
    }
}
