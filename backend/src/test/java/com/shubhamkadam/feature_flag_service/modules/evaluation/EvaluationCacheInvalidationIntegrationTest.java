package com.shubhamkadam.feature_flag_service.modules.evaluation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.shubhamkadam.feature_flag_service.exceptions.ResourceNotFoundException;
import com.shubhamkadam.feature_flag_service.modules.audit.AuditLogRepository;
import com.shubhamkadam.feature_flag_service.modules.environment.Environment;
import com.shubhamkadam.feature_flag_service.modules.environment.EnvironmentRepository;
import com.shubhamkadam.feature_flag_service.modules.environment.EnvironmentService;
import com.shubhamkadam.feature_flag_service.modules.evaluation.cache.EvaluationCacheProperties;
import com.shubhamkadam.feature_flag_service.modules.feature.Feature;
import com.shubhamkadam.feature_flag_service.modules.feature.FeatureRepository;
import com.shubhamkadam.feature_flag_service.modules.feature.FeatureService;
import com.shubhamkadam.feature_flag_service.modules.feature.FeatureType;
import com.shubhamkadam.feature_flag_service.modules.featurestate.FeatureState;
import com.shubhamkadam.feature_flag_service.modules.featurestate.FeatureStateRepository;
import com.shubhamkadam.feature_flag_service.modules.featurestate.FeatureStateRequest;
import com.shubhamkadam.feature_flag_service.modules.featurestate.FeatureStateService;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRepository;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRole;
import com.shubhamkadam.feature_flag_service.modules.organization.Organization;
import com.shubhamkadam.feature_flag_service.modules.organization.OrganizationRepository;
import com.shubhamkadam.feature_flag_service.modules.project.Project;
import com.shubhamkadam.feature_flag_service.modules.project.ProjectRepository;
import com.shubhamkadam.feature_flag_service.modules.user.User;
import com.shubhamkadam.feature_flag_service.modules.user.UserRepository;
import com.shubhamkadam.feature_flag_service.security.OrganizationContextHolder;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class EvaluationCacheInvalidationIntegrationTest {

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
    private AuditLogRepository auditLogRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private EvaluationService evaluationService;

    @Autowired
    private FeatureService featureService;

    @Autowired
    private EnvironmentService environmentService;

    @Autowired
    private FeatureStateService featureStateService;

    @Autowired
    private TransactionRollbackTestService transactionRollbackTestService;

    @Autowired
    private RedisTemplate<String, EvaluationResult> evaluationRedisTemplate;

    @Autowired
    private EvaluationCacheProperties properties;

    @Autowired
    private EntityManager entityManager;

    private User owner;
    private Organization org;
    private Project projectA;
    private Project projectB;
    private Environment envA;

    @BeforeEach
    void setUp() {
        evaluationRedisTemplate.getConnectionFactory().getConnection().serverCommands().flushDb();

        owner = userRepository.save(
            User.builder()
                .id(UUID.randomUUID())
                .name("Owner")
                .email("owner-eval-inval@test.com")
                .passwordHash("hash")
                .build()
        );

        org = organizationRepository.save(
            Organization.builder().id(UUID.randomUUID()).name("Eval Org").createdBy(owner.getId()).build()
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

        projectB = projectRepository.save(
            Project.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .name("Project B")
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
        clearSecurityContext();
        auditLogRepository.deleteAllInBatch();
        featureStateRepository.deleteAllInBatch();
        featureRepository.deleteAllInBatch();
        environmentRepository.deleteAllInBatch();
        projectRepository.deleteAllInBatch();
        membershipRepository.deleteAllInBatch();
        organizationRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    private void setSecurityContext() {
        SecurityContextHolder.getContext()
            .setAuthentication(new UsernamePasswordAuthenticationToken(owner, null, owner.getAuthorities()));
        OrganizationContextHolder.setContext(
            new OrganizationContextHolder.OrganizationContext(org.getId(), MembershipRole.ADMIN)
        );
    }

    private void clearSecurityContext() {
        OrganizationContextHolder.clearContext();
        SecurityContextHolder.clearContext();
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
    void evaluate_whenFeatureStateToggled_evictsCache() {
        setSecurityContext();
        try {
            Feature checkout = activeFeature(projectA, "checkout");
            stateFor(checkout, envA, true);

            // 1. Initial request evaluates to true and populates cache
            EvaluationResult initial = evaluationService.evaluate(envA.getId(), "checkout");
            assertThat(initial.enabled()).isTrue();

            String redisKey = "evaluation:" + envA.getId() + ":checkout";
            assertThat(evaluationRedisTemplate.hasKey(redisKey)).isTrue();

            // 2. Toggle state to false and commit transaction
            featureStateService.toggleFeatureState(envA.getId(), "checkout", new FeatureStateRequest(false));

            // 3. Cache must be evicted
            assertThat(evaluationRedisTemplate.hasKey(redisKey)).isFalse();

            // 4. Next evaluation evaluates to false (from DB)
            EvaluationResult afterToggle = evaluationService.evaluate(envA.getId(), "checkout");
            assertThat(afterToggle.enabled()).isFalse();
        } finally {
            clearSecurityContext();
        }
    }

    @Test
    void evaluate_whenFeatureSoftDeleted_evictsAllEnvironmentsInProject() {
        setSecurityContext();
        try {
            // envB belongs to Project A
            Environment envB = environmentRepository.save(
                Environment.builder()
                    .id(UUID.randomUUID())
                    .project(projectA)
                    .organization(org)
                    .name("Staging")
                    .apiKeyPrefix("stg-pfx")
                    .apiKeyHash("irrelevant-hash-b")
                    .build()
            );

            // envB2 belongs to Project B
            Environment envB2 = environmentRepository.save(
                Environment.builder()
                    .id(UUID.randomUUID())
                    .project(projectB)
                    .organization(org)
                    .name("Production B")
                    .apiKeyPrefix("prod-b-pfx")
                    .apiKeyHash("irrelevant-hash-b2")
                    .build()
            );

            Feature checkoutA = activeFeature(projectA, "checkout");
            Feature checkoutB = activeFeature(projectB, "checkout");

            stateFor(checkoutA, envA, true);
            stateFor(checkoutA, envB, true);
            stateFor(checkoutB, envB2, true);

            // Populate Redis for all three
            assertThat(evaluationService.evaluate(envA.getId(), "checkout").enabled()).isTrue();
            assertThat(evaluationService.evaluate(envB.getId(), "checkout").enabled()).isTrue();
            assertThat(evaluationService.evaluate(envB2.getId(), "checkout").enabled()).isTrue();

            String keyA = "evaluation:" + envA.getId() + ":checkout";
            String keyB = "evaluation:" + envB.getId() + ":checkout";
            String keyB2 = "evaluation:" + envB2.getId() + ":checkout";

            assertThat(evaluationRedisTemplate.hasKey(keyA)).isTrue();
            assertThat(evaluationRedisTemplate.hasKey(keyB)).isTrue();
            assertThat(evaluationRedisTemplate.hasKey(keyB2)).isTrue();

            // Soft delete checkout from Project A
            featureService.softDeleteFeature(projectA.getId(), checkoutA.getId());

            // Project A keys should be evicted
            assertThat(evaluationRedisTemplate.hasKey(keyA)).isFalse();
            assertThat(evaluationRedisTemplate.hasKey(keyB)).isFalse();

            // Project B key must remain cached
            assertThat(evaluationRedisTemplate.hasKey(keyB2)).isTrue();

            // Evaluating Project A feature should throw 404
            assertThatThrownBy(() -> evaluationService.evaluate(envA.getId(), "checkout")).isInstanceOf(
                ResourceNotFoundException.class
            );
        } finally {
            clearSecurityContext();
        }
    }

    @Test
    void evaluate_whenEnvironmentSoftDeleted_evictsAllEnvironmentKeys() {
        setSecurityContext();
        try {
            Environment envB = environmentRepository.save(
                Environment.builder()
                    .id(UUID.randomUUID())
                    .project(projectA)
                    .organization(org)
                    .name("Staging")
                    .apiKeyPrefix("stg-pfx-2")
                    .apiKeyHash("irrelevant-hash-stg-2")
                    .build()
            );

            Feature checkout = activeFeature(projectA, "checkout");
            Feature payments = activeFeature(projectA, "payments");

            stateFor(checkout, envA, true);
            stateFor(payments, envA, false);
            stateFor(checkout, envB, true);

            // Populate Redis
            assertThat(evaluationService.evaluate(envA.getId(), "checkout").enabled()).isTrue();
            assertThat(evaluationService.evaluate(envA.getId(), "payments").enabled()).isFalse();
            assertThat(evaluationService.evaluate(envB.getId(), "checkout").enabled()).isTrue();

            String keyA_checkout = "evaluation:" + envA.getId() + ":checkout";
            String keyA_payments = "evaluation:" + envA.getId() + ":payments";
            String keyB_checkout = "evaluation:" + envB.getId() + ":checkout";

            assertThat(evaluationRedisTemplate.hasKey(keyA_checkout)).isTrue();
            assertThat(evaluationRedisTemplate.hasKey(keyA_payments)).isTrue();
            assertThat(evaluationRedisTemplate.hasKey(keyB_checkout)).isTrue();

            // Delete envA
            environmentService.softDeleteEnvironment(projectA.getId(), envA.getId());

            // envA keys should be evicted
            assertThat(evaluationRedisTemplate.hasKey(keyA_checkout)).isFalse();
            assertThat(evaluationRedisTemplate.hasKey(keyA_payments)).isFalse();

            // envB key must remain cached
            assertThat(evaluationRedisTemplate.hasKey(keyB_checkout)).isTrue();
        } finally {
            clearSecurityContext();
        }
    }

    @Test
    void evaluate_whenMutationRollsBack_preservesExistingCache() {
        setSecurityContext();
        try {
            Feature checkout = activeFeature(projectA, "checkout");
            stateFor(checkout, envA, true);

            // Populate Redis
            EvaluationResult initial = evaluationService.evaluate(envA.getId(), "checkout");
            assertThat(initial.enabled()).isTrue();

            String redisKey = "evaluation:" + envA.getId() + ":checkout";
            assertThat(evaluationRedisTemplate.hasKey(redisKey)).isTrue();

            // Attempt mutation that rolls back
            assertThatThrownBy(() ->
                transactionRollbackTestService.updateThenRollback(
                    featureStateRepository
                        .findByFeatureIdAndEnvironmentId(checkout.getId(), envA.getId())
                        .orElseThrow(),
                    envA.getId(),
                    "checkout"
                )
            )
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("intentional rollback");

            // Cache must still exist because afterCommit() never executed
            assertThat(evaluationRedisTemplate.hasKey(redisKey)).isTrue();

            // Cached TRUE should still be returned
            EvaluationResult result = evaluationService.evaluate(envA.getId(), "checkout");
            assertThat(result.enabled()).isTrue();

            // Verify DB rolled back
            FeatureState persistedState = featureStateRepository
                .findByFeatureIdAndEnvironmentId(checkout.getId(), envA.getId())
                .orElseThrow();
            assertThat(persistedState.getEnabled()).isTrue();
        } finally {
            clearSecurityContext();
        }
    }
}
