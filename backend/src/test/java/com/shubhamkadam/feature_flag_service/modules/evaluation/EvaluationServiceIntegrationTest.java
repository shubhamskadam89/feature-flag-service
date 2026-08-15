package com.shubhamkadam.feature_flag_service.modules.evaluation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.shubhamkadam.feature_flag_service.exceptions.ResourceNotFoundException;
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
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EvaluationServiceIntegrationTest {

    @Autowired
    private EvaluationService evaluationService;

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
    private RedisTemplate<String, EvaluationResult> evaluationRedisTemplate;

    // ── shared fixtures ───────────────────────────────────────────────────────

    private Organization org;
    private Project projectA;
    private Project projectB;
    private Environment envA; // belongs to Project A
    private User owner;

    @BeforeEach
    void setUp() {
        evaluationRedisTemplate.getConnectionFactory().getConnection().serverCommands().flushDb();

        owner = userRepository.save(
            User.builder()
                .id(UUID.randomUUID())
                .name("Owner")
                .email("owner-eval-it@test.com")
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

        // Environment belongs to Project A
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

    // ── helpers ───────────────────────────────────────────────────────────────

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

    // ── 1. environmentId + featureKey → correct feature ──────────────────────

    @Test
    void evaluate_resolvesCorrectFeatureByKeyAndEnvironment() {
        Feature checkout = activeFeature(projectA, "checkout");
        stateFor(checkout, envA, true);

        EvaluationResult result = evaluationService.evaluate(envA.getId(), "checkout");

        assertThat(result.key()).isEqualTo("checkout");
        assertThat(result.enabled()).isTrue();
    }

    @Test
    void evaluate_firstRequestPopulatesCache_secondRequestUsesCachedResult() {
        Feature checkout = activeFeature(projectA, "checkout");
        FeatureState state = stateFor(checkout, envA, true);

        // First evaluation:
        // Redis MISS -> PostgreSQL -> Redis PUT
        EvaluationResult first = evaluationService.evaluate(envA.getId(), "checkout");

        assertThat(first.key()).isEqualTo("checkout");
        assertThat(first.enabled()).isTrue();

        String redisKey = "evaluation:" + envA.getId() + ":checkout";

        assertThat(evaluationRedisTemplate.hasKey(redisKey)).isTrue();

        // Change PostgreSQL state after the cache has been populated.
        state.setEnabled(false);
        featureStateRepository.saveAndFlush(state);

        // Second evaluation:
        // Redis HIT -> should still return the cached TRUE.
        EvaluationResult second = evaluationService.evaluate(envA.getId(), "checkout");

        assertThat(second.key()).isEqualTo("checkout");
        assertThat(second.enabled()).isTrue();
    }

    // ── 2. feature from another project → not found ───────────────────────────
    //
    // "checkout" exists in Project B, but envA belongs to Project A.
    // The evaluator must scope its feature lookup to Project A only.

    @Test
    void evaluate_whenFeatureExistsOnlyInOtherProject_throws() {
        // "checkout" lives in Project B — not in Project A
        activeFeature(projectB, "checkout");

        assertThatThrownBy(() -> evaluationService.evaluate(envA.getId(), "checkout")).isInstanceOf(
            ResourceNotFoundException.class
        );
    }

    // ── 3. active feature resolves ────────────────────────────────────────────

    @Test
    void evaluate_activeFeatureWithNoState_returnsFalse() {
        // Feature exists and is active, but no FeatureState row yet
        activeFeature(projectA, "dark-mode");

        EvaluationResult result = evaluationService.evaluate(envA.getId(), "dark-mode");

        assertThat(result.key()).isEqualTo("dark-mode");
        assertThat(result.enabled()).isFalse(); // sparse-state default
    }

    // ── 4. soft-deleted feature → doesn't resolve ─────────────────────────────
    //
    // This proves the JPQL WHERE deletedAt IS NULL clause actually works
    // against the real database. Mockito cannot catch a missing WHERE clause.

    @Test
    void evaluate_whenFeatureIsSoftDeleted_throws() {
        Feature deletedFeature = activeFeature(projectA, "legacy");
        deletedFeature.setDeletedAt(OffsetDateTime.now());
        featureRepository.save(deletedFeature);
        featureRepository.flush(); // ensure the UPDATE reaches the DB before SELECT

        assertThatThrownBy(() -> evaluationService.evaluate(envA.getId(), "legacy")).isInstanceOf(
            ResourceNotFoundException.class
        );
    }

    // ── 5. missing FeatureState → false ──────────────────────────────────────

    @Test
    void evaluate_whenStateRowIsAbsent_defaultsToFalse() {
        activeFeature(projectA, "beta-checkout");
        // deliberately no stateFor(...) call

        EvaluationResult result = evaluationService.evaluate(envA.getId(), "beta-checkout");

        assertThat(result.enabled()).isFalse();
    }

    // ── 6. existing FeatureState → actual stored value returned ───────────────

    @Test
    void evaluate_whenStateIsEnabled_returnsTrue() {
        Feature f = activeFeature(projectA, "new-ui");
        stateFor(f, envA, true);

        assertThat(evaluationService.evaluate(envA.getId(), "new-ui").enabled()).isTrue();
    }

    @Test
    void evaluate_whenStateIsDisabled_returnsFalse() {
        Feature f = activeFeature(projectA, "new-ui-disabled");
        stateFor(f, envA, false);

        assertThat(evaluationService.evaluate(envA.getId(), "new-ui-disabled").enabled()).isFalse();
    }

    @Test
    void evaluate_whenEnvironmentDoesNotExist_throws() {
        assertThatThrownBy(() -> evaluationService.evaluate(UUID.randomUUID(), "anything")).isInstanceOf(
            ResourceNotFoundException.class
        );
    }

    // ── 8. cache expiry ──────────────────────────────────────────────────────

    @Test
    void evaluate_afterCacheExpiry_readsUpdatedDatabaseValue() throws InterruptedException {
        Feature checkout = activeFeature(projectA, "checkout");
        FeatureState state = stateFor(checkout, envA, true);

        // First evaluation populates Redis with TRUE.
        EvaluationResult first = evaluationService.evaluate(envA.getId(), "checkout");

        assertThat(first.enabled()).isTrue();

        String redisKey = "evaluation:" + envA.getId() + ":checkout";

        assertThat(evaluationRedisTemplate.hasKey(redisKey)).isTrue();

        // Change PostgreSQL to FALSE.
        state.setEnabled(false);
        featureStateRepository.saveAndFlush(state);

        // Cache is still valid, so we should still get TRUE.
        EvaluationResult cached = evaluationService.evaluate(envA.getId(), "checkout");

        assertThat(cached.enabled()).isTrue();

        // Wait for the 1-second test TTL to expire.
        Thread.sleep(1_500);

        assertThat(evaluationRedisTemplate.hasKey(redisKey)).isFalse();

        // Cache MISS -> PostgreSQL -> FALSE -> Redis PUT.
        EvaluationResult refreshed = evaluationService.evaluate(envA.getId(), "checkout");

        assertThat(refreshed.enabled()).isFalse();

        // The new FALSE result should now be cached.
        assertThat(evaluationRedisTemplate.hasKey(redisKey)).isTrue();
    }

    @Test
    void evaluate_cachesTrueAndFalseAsDistinctValues() {
        Feature enabledFeature = activeFeature(projectA, "enabled-feature");
        Feature disabledFeature = activeFeature(projectA, "disabled-feature");

        stateFor(enabledFeature, envA, true);
        stateFor(disabledFeature, envA, false);

        EvaluationResult enabled = evaluationService.evaluate(envA.getId(), "enabled-feature");
        EvaluationResult disabled = evaluationService.evaluate(envA.getId(), "disabled-feature");

        assertThat(enabled.enabled()).isTrue();
        assertThat(disabled.enabled()).isFalse();

        String enabledKey = "evaluation:" + envA.getId() + ":enabled-feature";
        String disabledKey = "evaluation:" + envA.getId() + ":disabled-feature";

        assertThat(evaluationRedisTemplate.hasKey(enabledKey)).isTrue();
        assertThat(evaluationRedisTemplate.hasKey(disabledKey)).isTrue();

        EvaluationResult cachedEnabled = evaluationService.evaluate(envA.getId(), "enabled-feature");
        EvaluationResult cachedDisabled = evaluationService.evaluate(envA.getId(), "disabled-feature");

        assertThat(cachedEnabled.enabled()).isTrue();
        assertThat(cachedDisabled.enabled()).isFalse();
    }

    @Test
    void evaluateBulk_firstRequestReadsDatabaseAndSecondRequestUsesCache() {
        Feature checkout = activeFeature(projectA, "checkout");
        Feature payments = activeFeature(projectA, "payments");
        Feature search = activeFeature(projectA, "search");

        stateFor(checkout, envA, true);
        stateFor(payments, envA, false);
        stateFor(search, envA, true);

        BulkEvaluationRequest request = new BulkEvaluationRequest(List.of("checkout", "payments", "search"));

        // First request:
        // Redis MISS -> PostgreSQL -> Redis PUT
        BulkEvaluationResponse first = evaluationService.evaluateBulk(envA.getId(), request);

        assertThat(first.results()).containsExactly(
            new EvaluationResult("checkout", true),
            new EvaluationResult("payments", false),
            new EvaluationResult("search", true)
        );

        assertThat(evaluationRedisTemplate.hasKey("evaluation:" + envA.getId() + ":checkout")).isTrue();
        assertThat(evaluationRedisTemplate.hasKey("evaluation:" + envA.getId() + ":payments")).isTrue();
        assertThat(evaluationRedisTemplate.hasKey("evaluation:" + envA.getId() + ":search")).isTrue();

        // Change PostgreSQL after the values have been cached.
        FeatureState checkoutState = featureStateRepository
            .findByFeatureIdAndEnvironmentId(checkout.getId(), envA.getId())
            .orElseThrow();
        checkoutState.setEnabled(false);

        FeatureState paymentsState = featureStateRepository
            .findByFeatureIdAndEnvironmentId(payments.getId(), envA.getId())
            .orElseThrow();
        paymentsState.setEnabled(true);

        FeatureState searchState = featureStateRepository
            .findByFeatureIdAndEnvironmentId(search.getId(), envA.getId())
            .orElseThrow();
        searchState.setEnabled(false);

        featureStateRepository.saveAll(List.of(checkoutState, paymentsState, searchState));
        featureStateRepository.flush();

        // Second request:
        // Redis HIT -> should return the ORIGINAL cached values.
        BulkEvaluationResponse second = evaluationService.evaluateBulk(envA.getId(), request);

        assertThat(second.results()).containsExactly(
            new EvaluationResult("checkout", true),
            new EvaluationResult("payments", false),
            new EvaluationResult("search", true)
        );
    }

    @Test
    void evaluateBulk_mixedCacheHitsAndMisses_resolvesOnlyMissingValues() {
        Feature checkout = activeFeature(projectA, "checkout");
        Feature payments = activeFeature(projectA, "payments");
        Feature search = activeFeature(projectA, "search");

        stateFor(checkout, envA, true);
        stateFor(payments, envA, false);
        stateFor(search, envA, false);

        // Pre-populate Redis for checkout and search.
        evaluationRedisTemplate
            .opsForValue()
            .set(
                "evaluation:" + envA.getId() + ":checkout",
                new EvaluationResult("checkout", true),
                1,
                java.util.concurrent.TimeUnit.MINUTES
            );

        evaluationRedisTemplate
            .opsForValue()
            .set(
                "evaluation:" + envA.getId() + ":search",
                new EvaluationResult("search", false),
                1,
                java.util.concurrent.TimeUnit.MINUTES
            );

        BulkEvaluationRequest request = new BulkEvaluationRequest(List.of("checkout", "payments", "search"));

        BulkEvaluationResponse response = evaluationService.evaluateBulk(envA.getId(), request);

        assertThat(response.results()).containsExactly(
            new EvaluationResult("checkout", true),
            new EvaluationResult("payments", false),
            new EvaluationResult("search", false)
        );

        // Only payments should have required database resolution.
        assertThat(evaluationRedisTemplate.hasKey("evaluation:" + envA.getId() + ":checkout")).isTrue();
        assertThat(evaluationRedisTemplate.hasKey("evaluation:" + envA.getId() + ":search")).isTrue();
        assertThat(evaluationRedisTemplate.hasKey("evaluation:" + envA.getId() + ":payments")).isTrue();

        // Verify the newly resolved MISS was cached correctly.
        EvaluationResult cachedPayments = evaluationRedisTemplate
            .opsForValue()
            .get("evaluation:" + envA.getId() + ":payments");

        assertThat(cachedPayments).isEqualTo(new EvaluationResult("payments", false));
    }
}
