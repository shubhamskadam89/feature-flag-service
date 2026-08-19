package com.shubhamkadam.feature_flag_service.modules.evaluation;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.shubhamkadam.feature_flag_service.modules.environment.Environment;
import com.shubhamkadam.feature_flag_service.modules.environment.EnvironmentRepository;
import com.shubhamkadam.feature_flag_service.modules.evaluation.common.BulkEvaluationRequest;
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
import java.util.List;
import java.util.UUID;
import org.hamcrest.Matchers;
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
class EvaluationControllerIntegrationTest {

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

    private Environment envA;
    private Environment envB;
    private Project projectA;
    private Project projectB;
    private Organization org;

    /** Plaintext API keys — only available at creation time. */
    private String plaintextKeyA;
    private String plaintextKeyB;

    @AfterEach
    void tearDown() {
        featureStateRepository.deleteAll();
        featureRepository.deleteAll();
        environmentRepository.deleteAll();
        projectRepository.deleteAll();
        organizationRepository.deleteAll();
        userRepository.deleteAll();
    }

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();

        User owner = userRepository.save(
            User.builder()
                .id(UUID.randomUUID())
                .name("Owner")
                .email("eval-ctrl-it@test.com")
                .passwordHash("hash")
                .build()
        );

        org = organizationRepository.save(
            Organization.builder().id(UUID.randomUUID()).name("Ctrl Test Org").createdBy(owner.getId()).build()
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

        // Generate real API keys (same flow as EnvironmentService uses)
        ApiKeyGenerator.ApiKeyResult keyResultA = apiKeyGenerator.generateApiKey("production");
        plaintextKeyA = keyResultA.getPlaintextKey();

        ApiKeyGenerator.ApiKeyResult keyResultB = apiKeyGenerator.generateApiKey("staging");
        plaintextKeyB = keyResultB.getPlaintextKey();

        envA = environmentRepository.save(
            Environment.builder()
                .id(UUID.randomUUID())
                .project(projectA)
                .organization(org)
                .name("Production")
                .apiKeyPrefix(keyResultA.getPrefix())
                .apiKeyHash(keyResultA.getHash())
                .build()
        );

        envB = environmentRepository.save(
            Environment.builder()
                .id(UUID.randomUUID())
                .project(projectB)
                .organization(org)
                .name("Staging")
                .apiKeyPrefix(keyResultB.getPrefix())
                .apiKeyHash(keyResultB.getHash())
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

    private void enableFeature(Feature feature, Environment env) {
        featureStateRepository.save(
            FeatureState.builder()
                .id(UUID.randomUUID())
                .feature(feature)
                .environment(env)
                .organization(org)
                .enabled(true)
                .build()
        );
    }

    private String evaluateUrl(Environment env, String featureKey) {
        return "/api/v1/evaluate/environments/" + env.getId() + "/features/" + featureKey;
    }

    // ── 1. valid key + enabled state → 200 true ───────────────────────────────

    @Test
    void evaluate_withValidKeyAndEnabledFeature_returns200True() throws Exception {
        Feature checkout = activeFeature(projectA, "checkout");
        enableFeature(checkout, envA);

        mockMvc
            .perform(get(evaluateUrl(envA, "checkout")).header("X-Api-Key", plaintextKeyA))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.key").value("checkout"))
            .andExpect(jsonPath("$.data.enabled").value(true))
            .andExpect(jsonPath("$.status").value(200));
    }

    // ── 2. valid key + no FeatureState → 200 false (sparse default) ───────────

    @Test
    void evaluate_withValidKeyAndNoState_returns200False() throws Exception {
        activeFeature(projectA, "dark-mode");

        mockMvc
            .perform(get(evaluateUrl(envA, "dark-mode")).header("X-Api-Key", plaintextKeyA))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.key").value("dark-mode"))
            .andExpect(jsonPath("$.data.enabled").value(false));
    }

    // ── 3. valid key + disabled state → 200 false ─────────────────────────────

    @Test
    void evaluate_withValidKeyAndDisabledState_returns200False() throws Exception {
        Feature f = activeFeature(projectA, "beta");
        featureStateRepository.save(
            FeatureState.builder()
                .id(UUID.randomUUID())
                .feature(f)
                .environment(envA)
                .organization(org)
                .enabled(false)
                .build()
        );

        mockMvc
            .perform(get(evaluateUrl(envA, "beta")).header("X-Api-Key", plaintextKeyA))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.enabled").value(false));
    }

    // ── 4. missing X-Api-Key header → 401 ─────────────────────────────────────

    @Test
    void evaluate_withoutApiKey_returns401() throws Exception {
        activeFeature(projectA, "checkout");

        mockMvc.perform(get(evaluateUrl(envA, "checkout"))).andExpect(status().isUnauthorized());
    }

    // ── 5. invalid/unknown API key → 401 ──────────────────────────────────────

    @Test
    void evaluate_withInvalidApiKey_returns401() throws Exception {
        mockMvc
            .perform(get(evaluateUrl(envA, "checkout")).header("X-Api-Key", "env_production_thiskeyiscompleteFAKE"))
            .andExpect(status().isUnauthorized());
    }

    // ── 6. cross-environment key use → 401 ────────────────────────────────────
    //
    // Env B's key is valid, but the path points to Env A's UUID.
    // The filter must reject this — a key is only valid for its own environment.

    @Test
    void evaluate_withKeyFromDifferentEnvironment_returns401() throws Exception {
        activeFeature(projectA, "checkout");

        mockMvc
            .perform(
                // envA's UUID in path, but envB's key in header
                get(evaluateUrl(envA, "checkout")).header("X-Api-Key", plaintextKeyB)
            )
            .andExpect(status().isUnauthorized());
    }

    // ── 7. feature not in this project → 404 ──────────────────────────────────

    @Test
    void evaluate_withValidKeyAndUnknownFeature_returns404() throws Exception {
        // No feature "nonexistent" exists in Project A
        mockMvc
            .perform(get(evaluateUrl(envA, "nonexistent")).header("X-Api-Key", plaintextKeyA))
            .andExpect(status().isNotFound());
    }

    // ── 8. soft-deleted feature → 404 ─────────────────────────────────────────

    @Test
    void evaluate_withSoftDeletedFeature_returns404() throws Exception {
        Feature f = activeFeature(projectA, "old-feature");
        f.setDeletedAt(OffsetDateTime.now());
        featureRepository.save(f);
        featureRepository.flush();

        mockMvc
            .perform(get(evaluateUrl(envA, "old-feature")).header("X-Api-Key", plaintextKeyA))
            .andExpect(status().isNotFound());
    }

    // ── 9. feature exists in env B's project but not env A's → 404 ────────────
    //
    // Proves project-scoped isolation at the HTTP layer.

    @Test
    void evaluate_withFeatureFromOtherProject_returns404() throws Exception {
        // "checkout" lives in Project B only
        activeFeature(projectB, "checkout");

        // Env A's key → Project A → "checkout" not found there
        mockMvc
            .perform(get(evaluateUrl(envA, "checkout")).header("X-Api-Key", plaintextKeyA))
            .andExpect(status().isNotFound());
    }

    private String bulkEvaluateUrl(Environment env) {
        return "/api/v1/evaluate/environments/" + env.getId() + "/bulk";
    }

    @Test
    void evaluateBulk_withValidKeyAndMultipleFeatures_returns200AndPreservesOrder() throws Exception {
        Feature checkout = activeFeature(projectA, "checkout");
        enableFeature(checkout, envA);

        Feature darkMode = activeFeature(projectA, "dark-mode");
        // disabled by default

        Feature newDashboard = activeFeature(projectA, "new-dashboard");
        // unconfigured (missing state)

        BulkEvaluationRequest requestBody = new BulkEvaluationRequest(
            List.of("new-dashboard", "checkout", "dark-mode")
        );

        mockMvc
            .perform(
                post(bulkEvaluateUrl(envA))
                    .header("X-Api-Key", plaintextKeyA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(requestBody))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.results", Matchers.hasSize(3)))
            .andExpect(jsonPath("$.data.results[0].key").value("new-dashboard"))
            .andExpect(jsonPath("$.data.results[0].enabled").value(false))
            .andExpect(jsonPath("$.data.results[1].key").value("checkout"))
            .andExpect(jsonPath("$.data.results[1].enabled").value(true))
            .andExpect(jsonPath("$.data.results[2].key").value("dark-mode"))
            .andExpect(jsonPath("$.data.results[2].enabled").value(false));
    }

    @Test
    void evaluateBulk_withUnknownKey_returns404() throws Exception {
        activeFeature(projectA, "checkout");
        BulkEvaluationRequest requestBody = new BulkEvaluationRequest(List.of("checkout", "nonexistent"));

        mockMvc
            .perform(
                post(bulkEvaluateUrl(envA))
                    .header("X-Api-Key", plaintextKeyA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(requestBody))
            )
            .andExpect(status().isNotFound());
    }

    @Test
    void evaluateBulk_withDuplicateKeys_returns400() throws Exception {
        BulkEvaluationRequest requestBody = new BulkEvaluationRequest(List.of("checkout", "checkout"));

        mockMvc
            .perform(
                post(bulkEvaluateUrl(envA))
                    .header("X-Api-Key", plaintextKeyA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(requestBody))
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value(Matchers.containsString("Duplicate")));
    }

    @Test
    void evaluateBulk_withTooManyKeys_returns400() throws Exception {
        java.util.List<String> keys = new java.util.ArrayList<>();
        for (int i = 0; i < 101; i++) {
            keys.add("key-" + i);
        }
        BulkEvaluationRequest requestBody = new BulkEvaluationRequest(keys);

        mockMvc
            .perform(
                post(bulkEvaluateUrl(envA))
                    .header("X-Api-Key", plaintextKeyA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(requestBody))
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value(Matchers.containsString("100 keys")));
    }

    @Test
    void evaluateBulk_withEmptyKeys_returns400() throws Exception {
        BulkEvaluationRequest requestBody = new BulkEvaluationRequest(List.of());

        mockMvc
            .perform(
                post(bulkEvaluateUrl(envA))
                    .header("X-Api-Key", plaintextKeyA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(requestBody))
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value(Matchers.containsString("empty")));
    }

    @Test
    void evaluateBulk_withMalformedRequest_returns400() throws Exception {
        mockMvc
            .perform(
                post(bulkEvaluateUrl(envA))
                    .header("X-Api-Key", plaintextKeyA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"keys\": [\"checkout\", invalid-json]}")
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value(Matchers.containsString("Malformed JSON")));
    }

    @Test
    void evaluateBulk_withoutApiKey_returns401() throws Exception {
        BulkEvaluationRequest requestBody = new BulkEvaluationRequest(List.of("checkout"));

        mockMvc
            .perform(
                post(bulkEvaluateUrl(envA))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(requestBody))
            )
            .andExpect(status().isUnauthorized());
    }

    @Test
    void evaluateBulk_withInvalidApiKey_returns401() throws Exception {
        BulkEvaluationRequest requestBody = new BulkEvaluationRequest(List.of("checkout"));

        mockMvc
            .perform(
                post(bulkEvaluateUrl(envA))
                    .header("X-Api-Key", "invalid-key")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(requestBody))
            )
            .andExpect(status().isUnauthorized());
    }

    @Test
    void evaluateBulk_withKeyFromDifferentEnvironment_returns401() throws Exception {
        BulkEvaluationRequest requestBody = new BulkEvaluationRequest(List.of("checkout"));

        mockMvc
            .perform(
                post(bulkEvaluateUrl(envA))
                    .header("X-Api-Key", plaintextKeyB) // Key for Env B, path points to Env A
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(requestBody))
            )
            .andExpect(status().isUnauthorized());
    }
}
