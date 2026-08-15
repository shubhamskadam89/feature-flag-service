package com.shubhamkadam.feature_flag_service.modules.evaluation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.shubhamkadam.feature_flag_service.exceptions.BadRequestException;
import com.shubhamkadam.feature_flag_service.exceptions.ResourceNotFoundException;
import com.shubhamkadam.feature_flag_service.modules.environment.Environment;
import com.shubhamkadam.feature_flag_service.modules.environment.EnvironmentRepository;
import com.shubhamkadam.feature_flag_service.modules.feature.FeatureType;
import com.shubhamkadam.feature_flag_service.modules.project.Project;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EvaluationServiceImplTest {

    private static final UUID ENV_ID = UUID.fromString("89386d4d-061a-4c9e-82fb-baf58d7525d5");
    private static final UUID PROJECT_A = UUID.fromString("fd534f0e-96ae-4614-8034-af46b9ae09c8");
    private static final UUID FEATURE_ID = UUID.fromString("157e28c9-670a-46b2-9c45-1510b29e23c5");
    private static final String FEATURE_KEY = "checkout";

    @Mock
    private EnvironmentRepository mockEnvRepo;

    @Mock
    private EvaluationRepository mockEvaluationRepo;

    private EvaluationServiceImpl service;
    private Environment environmentA;

    @BeforeEach
    void setUp() {
        service = new EvaluationServiceImpl(mockEnvRepo, mockEvaluationRepo);

        environmentA = Environment.builder().id(ENV_ID).project(Project.builder().id(PROJECT_A).build()).build();
    }

    @Test
    void evaluate_whenStateIsEnabled_returnsTrue() {
        when(mockEnvRepo.findByIdAndDeletedAtIsNull(ENV_ID)).thenReturn(Optional.of(environmentA));
        when(mockEvaluationRepo.findAllEvaluationDataByEnvironmentId(ENV_ID)).thenReturn(
            List.of(new FeatureEvaluationData(FEATURE_ID, FEATURE_KEY, FeatureType.BOOLEAN, true, null, null))
        );

        EvaluationResult result = service.evaluate(ENV_ID, FEATURE_KEY);

        assertThat(result).isEqualTo(new EvaluationResult(FEATURE_KEY, true));
    }

    @Test
    void evaluate_whenStateIsDisabled_returnsFalse() {
        when(mockEnvRepo.findByIdAndDeletedAtIsNull(ENV_ID)).thenReturn(Optional.of(environmentA));
        when(mockEvaluationRepo.findAllEvaluationDataByEnvironmentId(ENV_ID)).thenReturn(
            List.of(new FeatureEvaluationData(FEATURE_ID, FEATURE_KEY, FeatureType.BOOLEAN, false, null, null))
        );

        EvaluationResult result = service.evaluate(ENV_ID, FEATURE_KEY);

        assertThat(result).isEqualTo(new EvaluationResult(FEATURE_KEY, false));
    }

    @Test
    void evaluate_whenStateIsAbsent_defaultsToFalse() {
        when(mockEnvRepo.findByIdAndDeletedAtIsNull(ENV_ID)).thenReturn(Optional.of(environmentA));
        when(mockEvaluationRepo.findAllEvaluationDataByEnvironmentId(ENV_ID)).thenReturn(
            List.of(new FeatureEvaluationData(FEATURE_ID, FEATURE_KEY, FeatureType.BOOLEAN, null, null, null))
        );

        EvaluationResult result = service.evaluate(ENV_ID, FEATURE_KEY);

        assertThat(result).isEqualTo(new EvaluationResult(FEATURE_KEY, false));
    }

    @Test
    void evaluate_whenEnvironmentNotFound_throws_andDoesNotQueryDownstream() {
        when(mockEnvRepo.findByIdAndDeletedAtIsNull(ENV_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.evaluate(ENV_ID, FEATURE_KEY)).isInstanceOf(ResourceNotFoundException.class);

        verify(mockEvaluationRepo, never()).findAllEvaluationDataByEnvironmentId(any());
    }

    @Test
    void evaluate_whenFeatureNotFoundInProject_throws() {
        when(mockEnvRepo.findByIdAndDeletedAtIsNull(ENV_ID)).thenReturn(Optional.of(environmentA));
        when(mockEvaluationRepo.findAllEvaluationDataByEnvironmentId(ENV_ID)).thenReturn(List.of());

        assertThatThrownBy(() -> service.evaluate(ENV_ID, FEATURE_KEY)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void evaluate_whenFeatureKeyExistsInDifferentProject_throws() {
        // Environment -> Project A, but Project B has the feature (so it won't be returned by the Env A query)
        when(mockEnvRepo.findByIdAndDeletedAtIsNull(ENV_ID)).thenReturn(Optional.of(environmentA));
        when(mockEvaluationRepo.findAllEvaluationDataByEnvironmentId(ENV_ID)).thenReturn(List.of());

        assertThatThrownBy(() -> service.evaluate(ENV_ID, FEATURE_KEY))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining(FEATURE_KEY);
    }

    @Test
    void evaluate_whenFeatureTypeIsUnsupported_throws() {
        when(mockEnvRepo.findByIdAndDeletedAtIsNull(ENV_ID)).thenReturn(Optional.of(environmentA));
        when(mockEvaluationRepo.findAllEvaluationDataByEnvironmentId(ENV_ID)).thenReturn(
            List.of(new FeatureEvaluationData(FEATURE_ID, FEATURE_KEY, FeatureType.STRING, true, null, null))
        );

        assertThatThrownBy(() -> service.evaluate(ENV_ID, FEATURE_KEY))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unsupported feature type");
    }
}
