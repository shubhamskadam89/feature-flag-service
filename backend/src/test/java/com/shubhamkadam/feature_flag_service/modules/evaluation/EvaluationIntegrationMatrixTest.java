package com.shubhamkadam.feature_flag_service.modules.evaluation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import com.shubhamkadam.feature_flag_service.security.ApiKeyGenerator;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
class EvaluationIntegrationMatrixTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

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
    private ApiKeyGenerator apiKeyGenerator;

    private Organization orgA;
    private Organization orgB;

    private Project projectA;
    private Project projectB;

    private Environment envA;
    private Environment envB;

    private String plaintextKeyA;
    private String plaintextKeyB;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();

        User owner = userRepository.save(
            User.builder()
                .id(UUID.randomUUID())
                .name("Owner")
                .email("matrix-test@test.com")
                .passwordHash("hash")
                .build()
        );

        orgA = organizationRepository.save(
            Organization.builder().id(UUID.randomUUID()).name("Org A").createdBy(owner.getId()).build()
        );

        orgB = organizationRepository.save(
            Organization.builder().id(UUID.randomUUID()).name("Org B").createdBy(owner.getId()).build()
        );

        projectA = projectRepository.save(
            Project.builder()
                .id(UUID.randomUUID())
                .organization(orgA)
                .name("Project A")
                .createdBy(owner)
                .isDeleted(false)
                .build()
        );

        projectB = projectRepository.save(
            Project.builder()
                .id(UUID.randomUUID())
                .organization(orgB)
                .name("Project B")
                .createdBy(owner)
                .isDeleted(false)
                .build()
        );

        ApiKeyGenerator.ApiKeyResult keyResultA = apiKeyGenerator.generateApiKey("production-a");
        plaintextKeyA = keyResultA.getPlaintextKey();

        ApiKeyGenerator.ApiKeyResult keyResultB = apiKeyGenerator.generateApiKey("production-b");
        plaintextKeyB = keyResultB.getPlaintextKey();

        envA = environmentRepository.save(
            Environment.builder()
                .id(UUID.randomUUID())
                .project(projectA)
                .organization(orgA)
                .name("Env A")
                .apiKeyPrefix(keyResultA.getPrefix())
                .apiKeyHash(keyResultA.getHash())
                .build()
        );

        envB = environmentRepository.save(
            Environment.builder()
                .id(UUID.randomUUID())
                .project(projectB)
                .organization(orgB)
                .name("Env B")
                .apiKeyPrefix(keyResultB.getPrefix())
                .apiKeyHash(keyResultB.getHash())
                .build()
        );
    }

    @AfterEach
    void tearDown() {
        featureStateRepository.deleteAll();
        featureRepository.deleteAll();
        environmentRepository.deleteAll();
        projectRepository.deleteAll();
        organizationRepository.deleteAll();
        userRepository.deleteAll();
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

    private void enableFeature(Feature feature, Environment env) {
        featureStateRepository.save(
            FeatureState.builder()
                .id(UUID.randomUUID())
                .feature(feature)
                .environment(env)
                .organization(env.getOrganization())
                .enabled(true)
                .build()
        );
    }

    @Test
    void evaluate_withDeletedEnvironment_returns401() throws Exception {
        Feature checkout = activeFeature(projectA, "checkout");
        enableFeature(checkout, envA);

        // Soft delete environment A
        envA.setDeletedAt(OffsetDateTime.now());
        environmentRepository.save(envA);
        environmentRepository.flush();

        mockMvc
            .perform(
                get("/api/v1/evaluate/environments/" + envA.getId() + "/features/checkout").header(
                    "X-Api-Key",
                    plaintextKeyA
                )
            )
            .andExpect(status().isUnauthorized());
    }

    @Test
    void evaluate_withRotatedApiKey_newKeySucceedsOldKeyFails() throws Exception {
        Feature checkout = activeFeature(projectA, "checkout");
        enableFeature(checkout, envA);

        // Rotate key
        String oldKey = plaintextKeyA;
        ApiKeyGenerator.ApiKeyResult newKeyResult = apiKeyGenerator.generateApiKey("production-a-rotated");
        envA.setApiKeyPrefix(newKeyResult.getPrefix());
        envA.setApiKeyHash(newKeyResult.getHash());
        environmentRepository.save(envA);
        environmentRepository.flush();

        String newKey = newKeyResult.getPlaintextKey();

        // Old key fails
        mockMvc
            .perform(
                get("/api/v1/evaluate/environments/" + envA.getId() + "/features/checkout").header("X-Api-Key", oldKey)
            )
            .andExpect(status().isUnauthorized());

        // New key succeeds
        mockMvc
            .perform(
                get("/api/v1/evaluate/environments/" + envA.getId() + "/features/checkout").header("X-Api-Key", newKey)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.enabled").value(true));
    }

    @Test
    void evaluate_withOtherOrganizationsApiKey_returns401() throws Exception {
        Feature checkout = activeFeature(projectA, "checkout");
        enableFeature(checkout, envA);

        // Request Org A path but with Org B's key
        mockMvc
            .perform(
                get("/api/v1/evaluate/environments/" + envA.getId() + "/features/checkout").header(
                    "X-Api-Key",
                    plaintextKeyB
                )
            )
            .andExpect(status().isUnauthorized());
    }

    @Test
    void evaluate_sameKeyInDifferentProjects_resolvesIndependently() throws Exception {
        // "checkout" in Project A (Org A) is enabled
        Feature checkoutA = activeFeature(projectA, "checkout");
        enableFeature(checkoutA, envA);

        // "checkout" in Project B (Org B) is disabled (no state)
        activeFeature(projectB, "checkout");

        featureRepository.flush();

        // Evaluate A -> should be true
        mockMvc
            .perform(
                get("/api/v1/evaluate/environments/" + envA.getId() + "/features/checkout").header(
                    "X-Api-Key",
                    plaintextKeyA
                )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.enabled").value(true));

        // Evaluate B -> should be false
        mockMvc
            .perform(
                get("/api/v1/evaluate/environments/" + envB.getId() + "/features/checkout").header(
                    "X-Api-Key",
                    plaintextKeyB
                )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.enabled").value(false));
    }

    @Test
    void evaluate_concurrently_returnsConsistentResultsWithoutCorruption() throws Exception {
        Feature checkout = activeFeature(projectA, "checkout");
        enableFeature(checkout, envA);
        featureRepository.flush();

        int threadCount = 10;
        int iterationsPerThread = 50;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(1);
        List<Future<Boolean>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            futures.add(
                executor.submit(() -> {
                    latch.await(); // wait for sync start
                    for (int j = 0; j < iterationsPerThread; j++) {
                        mockMvc
                            .perform(
                                get("/api/v1/evaluate/environments/" + envA.getId() + "/features/checkout").header(
                                    "X-Api-Key",
                                    plaintextKeyA
                                )
                            )
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.data.enabled").value(true));
                    }
                    return true;
                })
            );
        }

        latch.countDown(); // start all threads at once
        for (Future<Boolean> future : futures) {
            assertThat(future.get()).isTrue();
        }
        executor.shutdown();
    }
}
