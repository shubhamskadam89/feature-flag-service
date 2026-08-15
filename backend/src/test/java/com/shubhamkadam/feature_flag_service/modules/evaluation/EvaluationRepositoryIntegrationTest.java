package com.shubhamkadam.feature_flag_service.modules.evaluation;

import static org.assertj.core.api.Assertions.assertThat;

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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EvaluationRepositoryIntegrationTest {

    @Autowired
    private EvaluationRepository evaluationRepository;

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

    private Organization org;
    private Project projectA;
    private Project projectB;
    private Environment envA; // belongs to Project A
    private Environment envB; // belongs to Project B
    private User owner;

    @BeforeEach
    void setUp() {
        owner = userRepository.save(
            User.builder()
                .id(UUID.randomUUID())
                .name("Owner")
                .email("owner-eval-repo-it@test.com")
                .passwordHash("hash")
                .build()
        );

        org = organizationRepository.save(
            Organization.builder().id(UUID.randomUUID()).name("Eval Repo Org").createdBy(owner.getId()).build()
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
                .name("Production A")
                .apiKeyPrefix("prod-a-pfx")
                .apiKeyHash("irrelevant-hash-a")
                .build()
        );

        envB = environmentRepository.save(
            Environment.builder()
                .id(UUID.randomUUID())
                .project(projectB)
                .organization(org)
                .name("Production B")
                .apiKeyPrefix("prod-b-pfx")
                .apiKeyHash("irrelevant-hash-b")
                .build()
        );
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
    void findAllEvaluationDataByEnvironmentId_correctlyJoinsAndFilters() {
        // --- Setup Environment A features ---
        Feature checkoutA = activeFeature(projectA, "checkout");
        stateFor(checkoutA, envA, true);

        Feature darkModeA = activeFeature(projectA, "dark-mode");
        stateFor(darkModeA, envA, false);

        Feature newDashboardA = activeFeature(projectA, "new-dashboard");
        // deliberately no state for new-dashboard

        Feature legacyA = activeFeature(projectA, "legacy");
        legacyA.setDeletedAt(OffsetDateTime.now());
        featureRepository.save(legacyA);

        // --- Setup Environment B features ---
        Feature checkoutB = activeFeature(projectB, "checkout");
        stateFor(checkoutB, envB, true);

        // Ensure everything is flushed to DB
        featureRepository.flush();
        featureStateRepository.flush();

        // --- Execute for Env A ---
        List<FeatureEvaluationData> dataA = evaluationRepository.findAllEvaluationDataByEnvironmentId(envA.getId());

        // --- Assertions for Env A ---
        assertThat(dataA)
            .hasSize(3)
            .extracting(FeatureEvaluationData::key)
            .containsExactlyInAnyOrder("checkout", "dark-mode", "new-dashboard");

        FeatureEvaluationData checkoutData = dataA
            .stream()
            .filter(d -> d.key().equals("checkout"))
            .findFirst()
            .orElseThrow();
        assertThat(checkoutData.enabled()).isTrue();
        assertThat(checkoutData.featureId()).isEqualTo(checkoutA.getId());

        FeatureEvaluationData darkModeData = dataA
            .stream()
            .filter(d -> d.key().equals("dark-mode"))
            .findFirst()
            .orElseThrow();
        assertThat(darkModeData.enabled()).isFalse();
        assertThat(darkModeData.featureId()).isEqualTo(darkModeA.getId());

        FeatureEvaluationData newDashboardData = dataA
            .stream()
            .filter(d -> d.key().equals("new-dashboard"))
            .findFirst()
            .orElseThrow();
        assertThat(newDashboardData.enabled()).isNull();
        assertThat(newDashboardData.featureId()).isEqualTo(newDashboardA.getId());

        // --- Execute for Env B ---
        List<FeatureEvaluationData> dataB = evaluationRepository.findAllEvaluationDataByEnvironmentId(envB.getId());

        // --- Assertions for Env B ---
        assertThat(dataB).hasSize(1).extracting(FeatureEvaluationData::key).containsExactly("checkout");

        FeatureEvaluationData checkoutDataB = dataB.get(0);
        assertThat(checkoutDataB.enabled()).isTrue();
        assertThat(checkoutDataB.featureId()).isEqualTo(checkoutB.getId());
    }
}
