package com.shubhamkadam.feature_flag_service.modules.evaluation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.shubhamkadam.feature_flag_service.exceptions.BadRequestException;
import com.shubhamkadam.feature_flag_service.exceptions.ResourceNotFoundException;
import com.shubhamkadam.feature_flag_service.modules.environment.Environment;
import com.shubhamkadam.feature_flag_service.modules.environment.EnvironmentRepository;
import com.shubhamkadam.feature_flag_service.modules.feature.Feature;
import com.shubhamkadam.feature_flag_service.modules.feature.FeatureRepository;
import com.shubhamkadam.feature_flag_service.modules.feature.FeatureType;
import com.shubhamkadam.feature_flag_service.modules.featurestate.FeatureState;
import com.shubhamkadam.feature_flag_service.modules.featurestate.FeatureStateRepository;
import com.shubhamkadam.feature_flag_service.modules.project.Project;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EvaluationServiceImplTest {

    // ── fixed identifiers used across tests ──────────────────────────────────
    private static final UUID ENV_ID = UUID.fromString("89386d4d-061a-4c9e-82fb-baf58d7525d5");
    private static final UUID PROJECT_A = UUID.fromString("fd534f0e-96ae-4614-8034-af46b9ae09c8");
    private static final UUID PROJECT_B = UUID.fromString("aabbccdd-0000-0000-0000-000000000001");
    private static final UUID FEATURE_ID = UUID.fromString("157e28c9-670a-46b2-9c45-1510b29e23c5");
    private static final String FEATURE_KEY = "checkout";

    @Mock
    private EnvironmentRepository mockEnvRepo;

    @Mock
    private FeatureRepository mockFeatureRepo;

    @Mock
    private FeatureStateRepository mockFeatureStateRepo;

    private EvaluationServiceImpl service;

    /** Environment belonging to Project A — reused by every happy-path test. */
    private Environment environmentA;

    /** Active "checkout" feature that belongs to Project A. */
    private Feature checkoutFeature;

    @BeforeEach
    void setUp() {
        service = new EvaluationServiceImpl(mockEnvRepo, mockFeatureRepo, mockFeatureStateRepo);

        environmentA = Environment.builder().id(ENV_ID).project(Project.builder().id(PROJECT_A).build()).build();

        checkoutFeature = Feature.builder().id(FEATURE_ID).key(FEATURE_KEY).type(FeatureType.BOOLEAN).build();
    }

    // ── 1. enabled state → true ───────────────────────────────────────────────

    @Test
    void evaluate_whenStateIsEnabled_returnsTrue() {
        when(mockEnvRepo.findByIdAndDeletedAtIsNull(ENV_ID)).thenReturn(Optional.of(environmentA));
        when(mockFeatureRepo.findActiveByProjectIdAndKey(PROJECT_A, FEATURE_KEY)).thenReturn(
            Optional.of(checkoutFeature)
        );
        when(mockFeatureStateRepo.findByFeatureIdAndEnvironmentId(FEATURE_ID, ENV_ID)).thenReturn(
            Optional.of(FeatureState.builder().enabled(true).build())
        );

        EvaluationResult result = service.evaluate(ENV_ID, FEATURE_KEY);

        assertThat(result).isEqualTo(new EvaluationResult(FEATURE_KEY, true));
    }

    // ── 2. disabled state → false ─────────────────────────────────────────────

    @Test
    void evaluate_whenStateIsDisabled_returnsFalse() {
        when(mockEnvRepo.findByIdAndDeletedAtIsNull(ENV_ID)).thenReturn(Optional.of(environmentA));
        when(mockFeatureRepo.findActiveByProjectIdAndKey(PROJECT_A, FEATURE_KEY)).thenReturn(
            Optional.of(checkoutFeature)
        );
        when(mockFeatureStateRepo.findByFeatureIdAndEnvironmentId(FEATURE_ID, ENV_ID)).thenReturn(
            Optional.of(FeatureState.builder().enabled(false).build())
        );

        EvaluationResult result = service.evaluate(ENV_ID, FEATURE_KEY);

        assertThat(result).isEqualTo(new EvaluationResult(FEATURE_KEY, false));
    }

    // ── 3. missing state → false (sparse state default) ──────────────────────

    @Test
    void evaluate_whenStateIsAbsent_defaultsToFalse() {
        when(mockEnvRepo.findByIdAndDeletedAtIsNull(ENV_ID)).thenReturn(Optional.of(environmentA));
        when(mockFeatureRepo.findActiveByProjectIdAndKey(PROJECT_A, FEATURE_KEY)).thenReturn(
            Optional.of(checkoutFeature)
        );
        when(mockFeatureStateRepo.findByFeatureIdAndEnvironmentId(FEATURE_ID, ENV_ID)).thenReturn(Optional.empty());

        EvaluationResult result = service.evaluate(ENV_ID, FEATURE_KEY);

        assertThat(result).isEqualTo(new EvaluationResult(FEATURE_KEY, false));
    }

    // ── 4. missing environment → 404 + short-circuit ─────────────────────────

    @Test
    void evaluate_whenEnvironmentNotFound_throws_andDoesNotQueryDownstream() {
        when(mockEnvRepo.findByIdAndDeletedAtIsNull(ENV_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.evaluate(ENV_ID, FEATURE_KEY)).isInstanceOf(ResourceNotFoundException.class);

        // short-circuit: feature and state repos must never be touched
        verify(mockFeatureRepo, never()).findActiveByProjectIdAndKey(any(), anyString());
        verify(mockFeatureStateRepo, never()).findByFeatureIdAndEnvironmentId(any(), any());
    }

    // ── 5. missing feature → 404 + short-circuit ─────────────────────────────

    @Test
    void evaluate_whenFeatureNotFoundInProject_throws_andDoesNotQueryState() {
        when(mockEnvRepo.findByIdAndDeletedAtIsNull(ENV_ID)).thenReturn(Optional.of(environmentA));
        when(mockFeatureRepo.findActiveByProjectIdAndKey(PROJECT_A, FEATURE_KEY)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.evaluate(ENV_ID, FEATURE_KEY)).isInstanceOf(ResourceNotFoundException.class);

        // short-circuit: state repo must never be touched
        verify(mockFeatureStateRepo, never()).findByFeatureIdAndEnvironmentId(any(), any());
    }

    // ── 6. cross-project isolation ────────────────────────────────────────────
    //
    // Environment belongs to Project A.
    // "checkout" exists in Project B — a completely separate project.
    // The evaluator scopes the feature lookup to the environment's project,
    // so Project B's "checkout" must never resolve here.
    // If this test fails it means the query was widened to findByKey(key)
    // without project scoping — which would be a cross-project leakage bug.

    @Test
    void evaluate_whenFeatureKeyExistsInDifferentProject_throws() {
        // Environment → Project A
        when(mockEnvRepo.findByIdAndDeletedAtIsNull(ENV_ID)).thenReturn(Optional.of(environmentA));

        // "checkout" in Project A does NOT exist
        when(mockFeatureRepo.findActiveByProjectIdAndKey(PROJECT_A, FEATURE_KEY)).thenReturn(Optional.empty());

        // (Project B's "checkout" is never queried — the service never receives PROJECT_B)

        assertThatThrownBy(() -> service.evaluate(ENV_ID, FEATURE_KEY))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining(FEATURE_KEY);

        // Prove the service called the repo with Project A's id — not a broader lookup.
        // This is the invariant: evaluation is always scoped to the environment's project.
        verify(mockFeatureRepo).findActiveByProjectIdAndKey(PROJECT_A, FEATURE_KEY);
    }

    // ── 7. unsupported feature type ──────────────────────────────────────────

    @Test
    void evaluate_whenFeatureTypeIsUnsupported_throws() {
        when(mockEnvRepo.findByIdAndDeletedAtIsNull(ENV_ID)).thenReturn(Optional.of(environmentA));
        Feature unsupportedFeature = Feature.builder().id(FEATURE_ID).key(FEATURE_KEY).type(FeatureType.STRING).build();
        when(mockFeatureRepo.findActiveByProjectIdAndKey(PROJECT_A, FEATURE_KEY)).thenReturn(
            Optional.of(unsupportedFeature)
        );

        assertThatThrownBy(() -> service.evaluate(ENV_ID, FEATURE_KEY))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unsupported feature type");
    }
}
