package com.shubhamkadam.feature_flag_service.modules.evaluation;

import com.shubhamkadam.feature_flag_service.exceptions.ResourceNotFoundException;
import com.shubhamkadam.feature_flag_service.modules.environment.Environment;
import com.shubhamkadam.feature_flag_service.modules.environment.EnvironmentRepository;
import com.shubhamkadam.feature_flag_service.modules.feature.Feature;
import com.shubhamkadam.feature_flag_service.modules.feature.FeatureRepository;
import com.shubhamkadam.feature_flag_service.modules.featurestate.FeatureStateRepository;
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
    private final FeatureRepository featureRepo;
    private final FeatureStateRepository featureStateRepo;

    @Override
    public EvaluationResult evaluate(UUID environmentId, String featureKey) {
        log.info("Evaluating feature '{}' for environment {}", featureKey, environmentId);

        // Step 1: resolve active environment
        Environment environment = envRepo
            .findByIdAndDeletedAtIsNull(environmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Environment not found or deleted"));

        log.debug("Resolved environment: {} (project: {})", environment.getId(), environment.getProject().getId());

        // Step 2: resolve active feature scoped to the environment's project
        Feature feature = featureRepo
            .findActiveByProjectIdAndKey(environment.getProject().getId(), featureKey)
            .orElseThrow(() -> new ResourceNotFoundException("Feature '" + featureKey + "' not found in this project"));

        log.debug("Resolved feature: {} (key: {})", feature.getId(), feature.getKey());

        // Step 3: look up state — absent state means nobody has explicitly enabled
        // this flag in this environment, so the default is false
        boolean enabled = featureStateRepo
            .findByFeatureIdAndEnvironmentId(feature.getId(), environmentId)
            .map(state -> Boolean.TRUE.equals(state.getEnabled()))
            .orElse(false);

        EvaluationResult result = new EvaluationResult(feature.getKey(), enabled);
        log.info("Evaluation result: key={} enabled={}", result.key(), result.enabled());
        return result;
    }
}
