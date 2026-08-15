package com.shubhamkadam.feature_flag_service.modules.evaluation.cache.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shubhamkadam.feature_flag_service.modules.evaluation.EvaluationResult;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisEvaluationCacheConfig {

    @Bean
    public RedisTemplate<String, EvaluationResult> evaluationRedisTemplate(
        RedisConnectionFactory connectionFactory,
        ObjectMapper objectMapper
    ) {
        RedisTemplate<String, EvaluationResult> template = new RedisTemplate<>();

        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer keySerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer valueSerializer = new GenericJackson2JsonRedisSerializer(objectMapper);

        template.setKeySerializer(keySerializer);
        template.setHashKeySerializer(keySerializer);

        template.setValueSerializer(valueSerializer);
        template.setHashValueSerializer(valueSerializer);

        template.afterPropertiesSet();

        return template;
    }
}
