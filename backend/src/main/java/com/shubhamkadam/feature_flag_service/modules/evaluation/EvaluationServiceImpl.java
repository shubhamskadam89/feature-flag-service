package com.shubhamkadam.feature_flag_service.modules.evaluation;

import com.shubhamkadam.feature_flag_service.exceptions.BadRequestException;
import com.shubhamkadam.feature_flag_service.exceptions.ResourceNotFoundException;
import com.shubhamkadam.feature_flag_service.modules.environment.EnvironmentRepository;
import com.shubhamkadam.feature_flag_service.modules.feature.FeatureType;
import java.util.List;
import java.util.UUID;
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

    @Override
    public EvaluationResult evaluate(UUID environmentId, String featureKey) {
        log.info("Evaluating feature '{}' for environment {}", featureKey, environmentId);

        // Step 1: resolve active environment (or throw 404)
        envRepo
            .findByIdAndDeletedAtIsNull(environmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Environment not found or deleted"));

        // Step 2: retrieve all active evaluation data for the environment
        List<FeatureEvaluationData> evaluationData = evaluationRepo.findAllEvaluationDataByEnvironmentId(environmentId);

        // Step 3: find the requested feature key
        FeatureEvaluationData data = evaluationData
            .stream()
            .filter(d -> d.key().equals(featureKey))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Feature '" + featureKey + "' not found in this project"));

        // Step 4: Verify type is BOOLEAN
        if (data.type() != FeatureType.BOOLEAN) {
            throw new BadRequestException("Unsupported feature type: " + data.type());
        }

        // Step 5: resolve enabled state (absent state defaults to false)
        boolean enabled = Boolean.TRUE.equals(data.enabled());

        EvaluationResult result = new EvaluationResult(data.key(), enabled);
        log.info("Evaluation result: key={} enabled={}", result.key(), result.enabled());
        return result;
    }
}
