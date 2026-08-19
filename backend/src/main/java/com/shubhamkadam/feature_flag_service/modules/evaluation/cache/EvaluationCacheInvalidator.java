package com.shubhamkadam.feature_flag_service.modules.evaluation.cache;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
@RequiredArgsConstructor
public class EvaluationCacheInvalidator {

    private final EvaluationCache evaluationCache;

    public void evictAfterCommit(UUID environmentId, String featureKey) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            evaluationCache.invalidate(environmentId, featureKey);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(
            new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    evaluationCache.invalidate(environmentId, featureKey);
                }
            }
        );
    }

    public void evictEnvironmentAfterCommit(UUID environmentId) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            evaluationCache.evictEnvironment(environmentId);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(
            new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    evaluationCache.evictEnvironment(environmentId);
                }
            }
        );
    }
}
