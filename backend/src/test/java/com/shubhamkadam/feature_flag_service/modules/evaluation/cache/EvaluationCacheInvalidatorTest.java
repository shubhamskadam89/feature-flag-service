package com.shubhamkadam.feature_flag_service.modules.evaluation.cache;

import static org.mockito.Mockito.*;

import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@ExtendWith(MockitoExtension.class)
class EvaluationCacheInvalidatorTest {

    @Mock
    private EvaluationCache evaluationCache;

    private EvaluationCacheInvalidator invalidator;

    private UUID environmentId;
    private String featureKey;

    @BeforeEach
    void setUp() {
        invalidator = new EvaluationCacheInvalidator(evaluationCache);
        environmentId = UUID.randomUUID();
        featureKey = "checkout";
    }

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void evictAfterCommit_withoutTransaction_evictsImmediately() {
        invalidator.evictAfterCommit(environmentId, featureKey);

        verify(evaluationCache).evict(environmentId, featureKey);
    }

    @Test
    void evictAfterCommit_withActiveTransaction_evictsOnlyAfterCommit() {
        TransactionSynchronizationManager.initSynchronization();

        invalidator.evictAfterCommit(environmentId, featureKey);

        verify(evaluationCache, never()).evict(any(), any());

        TransactionSynchronization synchronization = TransactionSynchronizationManager.getSynchronizations().get(0);

        synchronization.afterCommit();

        verify(evaluationCache).evict(environmentId, featureKey);
    }

    @Test
    void evictAfterCommit_withActiveTransactionRollback_doesNotEvict() {
        TransactionSynchronizationManager.initSynchronization();

        invalidator.evictAfterCommit(environmentId, featureKey);

        verify(evaluationCache, never()).evict(any(), any());

        // Simulate rollback by deliberately NOT invoking afterCommit().
        TransactionSynchronizationManager.clearSynchronization();

        verify(evaluationCache, never()).evict(any(), any());
    }
}
