package com.shubhamkadam.feature_flag_service.modules.evaluation;

import java.util.UUID;

public interface EvaluationService {
    /**
     * Evaluates a feature flag by its public key for a specific environment.
     *
     * @param environmentId the environment identifier
     * @param featureKey    the public key of the feature (e.g. {@code "checkout"})
     * @return the computed {@link EvaluationResult} for the given feature and
     *         environment
     * @implSpec The implementation should:
     *           <ol>
     *           <li>Resolve the active environment.</li>
     *           <li>Resolve the active feature scoped to the environment's
     *           project by key.</li>
     *           <li>Look up the {@code FeatureState} for the environment-feature
     *           pair.</li>
     *           <li>Return {@code enabled=true} if a state row exists and is
     *           enabled; {@code false} otherwise (absent state defaults to
     *           {@code false}).</li>
     *           </ol>
     * @apiNote This method orchestrates the full evaluation flow from lookup to
     *          final result.
     */
    EvaluationResult evaluate(UUID environmentId, String featureKey);

    /**
     * Evaluates multiple feature flags in a single request for a specific environment.
     *
     * @param environmentId the environment identifier
     * @param request       the bulk request containing feature keys
     * @return the {@link BulkEvaluationResponse} containing results in request order
     */
    BulkEvaluationResponse evaluateBulk(UUID environmentId, BulkEvaluationRequest request);
}
