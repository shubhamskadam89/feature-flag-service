package com.shubhamkadam.feature_flag_service.modules.evaluation.cache;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "feature-flag.evaluation.cache")
public record EvaluationCacheProperties(String keyPrefix, Duration ttl) {}
