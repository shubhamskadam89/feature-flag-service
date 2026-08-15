package com.shubhamkadam.feature_flag_service.modules.evaluation;

import com.shubhamkadam.feature_flag_service.exceptions.BadRequestException;
import com.shubhamkadam.feature_flag_service.exceptions.ResourceNotFoundException;
import com.shubhamkadam.feature_flag_service.modules.environment.EnvironmentRepository;
import com.shubhamkadam.feature_flag_service.modules.evaluation.cache.EvaluationCache;
import com.shubhamkadam.feature_flag_service.modules.feature.FeatureType;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class EvaluationServiceImpl implements EvaluationService {

    private final EnvironmentRepository envRepo;
    private final EvaluationRepository evaluationRepo;
    private final EvaluationCache evaluationCache;

    @Override
    public EvaluationResult evaluate(UUID environmentId, String featureKey) {
        log.info("Evaluating feature '{}' for environment {}", featureKey, environmentId);

        // Step 1: resolve active environment (or throw 404)
        envRepo
            .findByIdAndDeletedAtIsNull(environmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Environment not found or deleted"));
        // Step 2: check cache before querying PostgreSQL
        Optional<EvaluationResult> cachedResult = evaluationCache.get(environmentId, featureKey);

        if (cachedResult.isPresent()) {
            log.info("Cache hit for feature '{}' in environment {}", featureKey, environmentId);
            return cachedResult.get();
        }

        // Step 3: retrieve all active evaluation data for the environment
        List<FeatureEvaluationData> evaluationData = evaluationRepo.findAllEvaluationDataByEnvironmentId(environmentId);

        // Step 4: find the requested feature key
        FeatureEvaluationData data = evaluationData
            .stream()
            .filter(d -> d.key().equals(featureKey))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Feature '" + featureKey + "' not found in this project"));

        // Step 5: Verify type is BOOLEAN
        if (data.type() != FeatureType.BOOLEAN) {
            throw new BadRequestException("Unsupported feature type: " + data.type());
        }

        // Step 6: resolve enabled state (absent state defaults to false)
        boolean enabled = Boolean.TRUE.equals(data.enabled());

        // Step 7: cache the result for future requests
        EvaluationResult result = new EvaluationResult(data.key(), enabled);

        evaluationCache.put(environmentId, result);

        log.info("Evaluation result: key={} enabled={}", result.key(), result.enabled());
        return result;
    }

    @Override
    public BulkEvaluationResponse evaluateBulk(UUID environmentId, BulkEvaluationRequest request) {
        log.info("Evaluating {} features for environment {}", request.keys().size(), environmentId);

        // Step 1: validate request
        request.validate();

        // Step 2: resolve active environment (or throw 404)
        envRepo
            .findByIdAndDeletedAtIsNull(environmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Environment not found or deleted"));

        // Step 3: retrieve all active evaluation data for the environment (exactly one
        // repository read)
        List<FeatureEvaluationData> evaluationData = evaluationRepo.findAllEvaluationDataByEnvironmentId(environmentId);

        // Step 4: build an in-memory key -> data map
        Map<String, FeatureEvaluationData> dataMap = evaluationData
            .stream()
            .collect(Collectors.toMap(FeatureEvaluationData::key, Function.identity()));

        // Step 5: process requested keys in request order
        List<EvaluationResult> results = request
            .keys()
            .stream()
            .map(key -> {
                FeatureEvaluationData data = dataMap.get(key);
                if (data == null) {
                    throw new ResourceNotFoundException("Feature '" + key + "' not found in this project");
                }
                if (data.type() != FeatureType.BOOLEAN) {
                    throw new BadRequestException("Unsupported feature type: " + data.type());
                }
                boolean enabled = Boolean.TRUE.equals(data.enabled());
                return new EvaluationResult(data.key(), enabled);
            })
            .collect(Collectors.toList());

        return new BulkEvaluationResponse(results);
    }
}
