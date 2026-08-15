package com.shubhamkadam.feature_flag_service.modules.evaluation;

import com.shubhamkadam.feature_flag_service.modules.evaluation.cache.EvaluationCacheInvalidator;
import com.shubhamkadam.feature_flag_service.modules.featurestate.FeatureState;
import com.shubhamkadam.feature_flag_service.modules.featurestate.FeatureStateRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TransactionRollbackTestService {

    private final FeatureStateRepository featureStateRepository;
    private final EvaluationCacheInvalidator evaluationCacheInvalidator;

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void updateThenRollback(FeatureState state, UUID environmentId, String featureKey) {
        state.setEnabled(false);
        featureStateRepository.save(state);

        evaluationCacheInvalidator.evictAfterCommit(environmentId, featureKey);

        throw new RuntimeException("intentional rollback");
    }
}
