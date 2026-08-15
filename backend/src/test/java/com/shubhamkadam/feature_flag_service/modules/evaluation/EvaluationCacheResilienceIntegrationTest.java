package com.shubhamkadam.feature_flag_service.modules.evaluation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

import com.shubhamkadam.feature_flag_service.modules.environment.Environment;
import com.shubhamkadam.feature_flag_service.modules.environment.EnvironmentRepository;
import com.shubhamkadam.feature_flag_service.modules.feature.Feature;
import com.shubhamkadam.feature_flag_service.modules.feature.FeatureRepository;
import com.shubhamkadam.feature_flag_service.modules.feature.FeatureType;
import com.shubhamkadam.feature_flag_service.modules.featurestate.FeatureState;
import com.shubhamkadam.feature_flag_service.modules.featurestate.FeatureStateRepository;
import com.shubhamkadam.feature_flag_service.modules.organization.Organization;
import com.shubhamkadam.feature_flag_service.modules.organization.OrganizationRepository;
import com.shubhamkadam.feature_flag_service.modules.project.Project;
import com.shubhamkadam.feature_flag_service.modules.project.ProjectRepository;
import com.shubhamkadam.feature_flag_service.modules.user.User;
import com.shubhamkadam.feature_flag_service.modules.user.UserRepository;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EvaluationCacheResilienceIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private EnvironmentRepository environmentRepository;

    @Autowired
    private FeatureRepository featureRepository;

    @Autowired
    private FeatureStateRepository featureStateRepository;

    @Autowired
    private EvaluationService evaluationService;

    @MockitoBean
    private RedisTemplate<String, EvaluationResult> mockRedisTemplate;

    @MockitoBean
    private ValueOperations<String, EvaluationResult> mockValueOperations;

    private User owner;
    private Organization org;
    private Project projectA;
    private Environment envA;

    @BeforeEach
    void setUp() {
        when(mockRedisTemplate.opsForValue()).thenReturn(mockValueOperations);

        owner = userRepository.save(
            User.builder()
                .id(UUID.randomUUID())
                .name("Owner")
                .email("owner-resil-it@test.com")
                .passwordHash("hash")
                .build()
        );

        org = organizationRepository.save(
            Organization.builder().id(UUID.randomUUID()).name("Resil Org").createdBy(owner.getId()).build()
        );

        projectA = projectRepository.save(
            Project.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .name("Project A")
                .createdBy(owner)
                .isDeleted(false)
                .build()
        );

        envA = environmentRepository.save(
            Environment.builder()
                .id(UUID.randomUUID())
                .project(projectA)
                .organization(org)
                .name("Production")
                .apiKeyPrefix("prod-pfx")
                .apiKeyHash("irrelevant-hash")
                .build()
        );
    }

    @AfterEach
    void tearDown() {
        featureStateRepository.deleteAllInBatch();
        featureRepository.deleteAllInBatch();
        environmentRepository.deleteAllInBatch();
        projectRepository.deleteAllInBatch();
        organizationRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    private Feature activeFeature(Project project, String key) {
        return featureRepository.save(
            Feature.builder()
                .id(UUID.randomUUID())
                .project(project)
                .key(key)
                .name(key + " feature")
                .type(FeatureType.BOOLEAN)
                .build()
        );
    }

    private FeatureState stateFor(Feature feature, Environment env, boolean enabled) {
        return featureStateRepository.save(
            FeatureState.builder()
                .id(UUID.randomUUID())
                .feature(feature)
                .environment(env)
                .organization(org)
                .enabled(enabled)
                .build()
        );
    }

    @Test
    void evaluate_whenRedisGetFails_fallsBackToPostgresSuccessfully() {
        Feature checkout = activeFeature(projectA, "checkout");
        stateFor(checkout, envA, true);

        // Redis GET throws connection exception
        when(mockValueOperations.get(anyString())).thenThrow(new RedisConnectionFailureException("Redis unavailable"));

        // Redis PUT throws connection exception
        doThrow(new RedisConnectionFailureException("Redis unavailable"))
            .when(mockValueOperations)
            .set(anyString(), any(), anyLong(), any());

        // Should fall back to Postgres and return the correct result without throwing
        EvaluationResult result = evaluationService.evaluate(envA.getId(), "checkout");

        assertThat(result.enabled()).isTrue();
    }

    @Test
    void evaluateBulk_whenRedisFails_fallsBackToPostgresSuccessfully() {
        Feature checkout = activeFeature(projectA, "checkout");
        Feature payments = activeFeature(projectA, "payments");
        stateFor(checkout, envA, true);
        stateFor(payments, envA, false);

        // Redis GET throws connection exception
        when(mockValueOperations.get(anyString())).thenThrow(new RedisConnectionFailureException("Redis unavailable"));

        // Redis PUT throws connection exception
        doThrow(new RedisConnectionFailureException("Redis unavailable"))
            .when(mockValueOperations)
            .set(anyString(), any(), anyLong(), any());

        BulkEvaluationRequest request = new BulkEvaluationRequest(List.of("checkout", "payments"));

        // Should evaluate from database and return results successfully
        BulkEvaluationResponse response = evaluationService.evaluateBulk(envA.getId(), request);

        assertThat(response.results()).containsExactly(
            new EvaluationResult("checkout", true),
            new EvaluationResult("payments", false)
        );
    }
}
