package com.shubhamkadam.feature_flag_service.modules.evaluation.service;

import com.shubhamkadam.feature_flag_service.exceptions.BadRequestException;
import com.shubhamkadam.feature_flag_service.exceptions.ResourceNotFoundException;
import com.shubhamkadam.feature_flag_service.modules.environment.EnvironmentRepository;
import com.shubhamkadam.feature_flag_service.modules.evaluation.cache.EvaluationCache;
import com.shubhamkadam.feature_flag_service.modules.evaluation.common.BulkEvaluationRequest;
import com.shubhamkadam.feature_flag_service.modules.evaluation.common.BulkEvaluationResponse;
import com.shubhamkadam.feature_flag_service.modules.evaluation.common.EvaluationReason;
import com.shubhamkadam.feature_flag_service.modules.evaluation.common.EvaluationReasonType;
import com.shubhamkadam.feature_flag_service.modules.evaluation.common.EvaluationResult;
import com.shubhamkadam.feature_flag_service.modules.evaluation.common.FeatureEvaluationData;
import com.shubhamkadam.feature_flag_service.modules.evaluation.context.EvaluationContext;
import com.shubhamkadam.feature_flag_service.modules.evaluation.repository.EvaluationRepository;
import com.shubhamkadam.feature_flag_service.modules.evaluation.rollout.PercentageRolloutEvaluator;
import com.shubhamkadam.feature_flag_service.modules.feature.FeatureType;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class EvaluationServiceImpl implements EvaluationService {

    private final EnvironmentRepository envRepo;
    private final EvaluationRepository evaluationRepo;
    private final EvaluationCache evaluationCache;
    private final PercentageRolloutEvaluator percentageRolloutEvaluator;

    @Autowired(required = false)
    private MeterRegistry meterRegistry;

    @Override
    public EvaluationResult evaluate(UUID environmentId, String featureKey, EvaluationContext context) {
        Timer.Sample serviceSample = meterRegistry != null ? Timer.start(meterRegistry) : null;
        try {
            log.info("Evaluating feature '{}' for environment {}", featureKey, environmentId);

            if (context != null) {
                Optional<EvaluationResult> cachedContextual = evaluationCache.get(environmentId, featureKey, context);
                if (cachedContextual.isPresent()) {
                    if (meterRegistry != null) meterRegistry.counter("evaluation.cache.hit").increment();
                    return cachedContextual.get();
                }
            }

            Optional<EvaluationResult> cachedResult = evaluationCache.get(environmentId, featureKey);

            if (cachedResult.isPresent()) {
                if (meterRegistry != null) meterRegistry.counter("evaluation.cache.hit").increment();
                return cachedResult.get();
            }

            if (meterRegistry != null) meterRegistry.counter("evaluation.cache.miss").increment();

            Timer.Sample envSample = meterRegistry != null ? Timer.start(meterRegistry) : null;
            try {
                envRepo
                    .findByIdAndDeletedAtIsNull(environmentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Environment not found or deleted"));
            } finally {
                if (envSample != null) {
                    envSample.stop(meterRegistry.timer("evaluation.env.lookup"));
                }
            }

            List<FeatureEvaluationData> evaluationData = evaluationRepo.findAllEvaluationDataByEnvironmentId(
                environmentId
            );

            FeatureEvaluationData data = evaluationData
                .stream()
                .filter(d -> d.key().equals(featureKey))
                .findFirst()
                .orElseThrow(() ->
                    new ResourceNotFoundException("Feature '" + featureKey + "' not found in this project")
                );

            if (data.type() != FeatureType.BOOLEAN) {
                throw new BadRequestException("Unsupported feature type: " + data.type());
            }

            if (data.rolloutPercentage() != null) {
                if (context == null) {
                    throw new BadRequestException("Context is required for percentage rollout");
                }

                Timer.Sample rolloutSample = meterRegistry != null ? Timer.start(meterRegistry) : null;
                long bucket;
                long threshold;
                try {
                    bucket = percentageRolloutEvaluator.bucket(data.key(), context);
                    threshold = percentageRolloutEvaluator.threshold(data.rolloutPercentage());
                } finally {
                    if (rolloutSample != null) {
                        rolloutSample.stop(meterRegistry.timer("evaluation.rollout.eval"));
                    }
                }
                boolean enabled = bucket < threshold;

                EvaluationResult result = new EvaluationResult(
                    data.key(),
                    enabled,
                    EvaluationReason.percentageRollout(data.rolloutPercentage(), bucket, threshold)
                );

                evaluationCache.put(environmentId, result, context);

                return result;
            }

            boolean enabled = Boolean.TRUE.equals(data.enabled());

            EvaluationResult result = new EvaluationResult(data.key(), enabled, EvaluationReason.staticReason());

            evaluationCache.put(environmentId, result);

            return result;
        } finally {
            if (serviceSample != null) {
                serviceSample.stop(meterRegistry.timer("evaluation.service.latency"));
            }
        }
    }

    @Override
    public BulkEvaluationResponse evaluateBulk(UUID environmentId, BulkEvaluationRequest request) {
        Timer.Sample serviceSample = meterRegistry != null ? Timer.start(meterRegistry) : null;
        try {
            log.info("Evaluating {} features for environment {}", request.keys().size(), environmentId);

            request.validate();

            EvaluationContext context = request.context();
            Map<String, EvaluationResult> cachedResults = new HashMap<>();
            List<String> missingKeys = new ArrayList<>();

            for (String key : request.keys()) {
                Optional<EvaluationResult> cachedResult = Optional.empty();
                if (context != null) {
                    cachedResult = evaluationCache.get(environmentId, key, context);
                }
                if (cachedResult.isEmpty()) {
                    cachedResult = evaluationCache.get(environmentId, key);
                }

                if (cachedResult.isPresent()) {
                    cachedResults.put(key, cachedResult.get());
                } else {
                    missingKeys.add(key);
                }
            }

            if (!missingKeys.isEmpty()) {
                Timer.Sample envSample = meterRegistry != null ? Timer.start(meterRegistry) : null;
                try {
                    envRepo
                        .findByIdAndDeletedAtIsNull(environmentId)
                        .orElseThrow(() -> new ResourceNotFoundException("Environment not found or deleted"));
                } finally {
                    if (envSample != null) {
                        envSample.stop(meterRegistry.timer("evaluation.env.lookup"));
                    }
                }

                List<FeatureEvaluationData> evaluationData = evaluationRepo.findAllEvaluationDataByEnvironmentId(
                    environmentId
                );

                Map<String, FeatureEvaluationData> dataMap = evaluationData
                    .stream()
                    .collect(Collectors.toMap(FeatureEvaluationData::key, Function.identity()));

                Map<String, EvaluationResult> newResults = new HashMap<>();

                for (String key : missingKeys) {
                    FeatureEvaluationData data = dataMap.get(key);

                    if (data == null) {
                        throw new ResourceNotFoundException("Feature '" + key + "' not found in this project");
                    }

                    if (data.type() != FeatureType.BOOLEAN) {
                        throw new BadRequestException("Unsupported feature type: " + data.type());
                    }

                    if (data.rolloutPercentage() != null) {
                        if (context == null) {
                            throw new BadRequestException("Context is required for percentage rollout");
                        }

                        long bucket = percentageRolloutEvaluator.bucket(data.key(), context);
                        long threshold = percentageRolloutEvaluator.threshold(data.rolloutPercentage());
                        boolean enabled = bucket < threshold;

                        EvaluationResult result = new EvaluationResult(
                            data.key(),
                            enabled,
                            EvaluationReason.percentageRollout(data.rolloutPercentage(), bucket, threshold)
                        );
                        newResults.put(key, result);
                    } else {
                        boolean enabled = Boolean.TRUE.equals(data.enabled());
                        EvaluationResult result = new EvaluationResult(
                            data.key(),
                            enabled,
                            EvaluationReason.staticReason()
                        );
                        newResults.put(key, result);
                    }
                }

                for (String key : missingKeys) {
                    EvaluationResult result = newResults.get(key);
                    FeatureEvaluationData data = dataMap.get(key);
                    cachedResults.put(key, result);
                    if (data.rolloutPercentage() != null) {
                        evaluationCache.put(environmentId, result, context);
                    } else {
                        evaluationCache.put(environmentId, result);
                    }
                }
            }

            List<EvaluationResult> results = request
                .keys()
                .stream()
                .map(cachedResults::get)
                .collect(Collectors.toList());

            return new BulkEvaluationResponse(results);
        } finally {
            if (serviceSample != null) {
                serviceSample.stop(meterRegistry.timer("evaluation.service.latency"));
            }
        }
    }
}
