package com.shubhamkadam.feature_flag_service.modules.featurestate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shubhamkadam.feature_flag_service.modules.environment.Environment;
import com.shubhamkadam.feature_flag_service.modules.environment.EnvironmentRepository;
import com.shubhamkadam.feature_flag_service.modules.feature.Feature;
import com.shubhamkadam.feature_flag_service.modules.feature.FeatureRepository;
import com.shubhamkadam.feature_flag_service.modules.feature.FeatureType;
import com.shubhamkadam.feature_flag_service.modules.membership.Membership;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipId;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRepository;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRole;
import com.shubhamkadam.feature_flag_service.modules.organization.Organization;
import com.shubhamkadam.feature_flag_service.modules.organization.OrganizationRepository;
import com.shubhamkadam.feature_flag_service.modules.project.Project;
import com.shubhamkadam.feature_flag_service.modules.project.ProjectRepository;
import com.shubhamkadam.feature_flag_service.modules.user.User;
import com.shubhamkadam.feature_flag_service.modules.user.UserRepository;
import com.shubhamkadam.feature_flag_service.security.JwtService;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class FeatureStateIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private EnvironmentRepository environmentRepository;

    @Autowired
    private FeatureRepository featureRepository;

    @Autowired
    private FeatureStateRepository featureStateRepository;

    @Autowired
    private JwtService jwtService;

    private User adminUser;
    private User memberUser;

    private Organization myOrg;
    private Organization otherOrg;

    private Project myProject;
    private Project otherProject;

    private Environment myEnvironment;
    private Environment otherEnvironment;

    private Feature myFeature;
    private Feature otherFeature;

    private String adminToken;
    private String memberToken;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

        // Clean up feature states from any prior runs to ensure data isolation
        featureStateRepository.deleteAll();

        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();

        adminUser = userRepository.save(
            User.builder()
                .id(UUID.randomUUID())
                .name("Feature State Admin")
                .email("admin-feature-state@test.com")
                .passwordHash("hash")
                .build()
        );

        memberUser = userRepository.save(
            User.builder()
                .id(UUID.randomUUID())
                .name("Feature State Member")
                .email("member-feature-state@test.com")
                .passwordHash("hash")
                .build()
        );

        myOrg = organizationRepository.save(
            Organization.builder().id(UUID.randomUUID()).name("Feature State Org").createdBy(adminUser.getId()).build()
        );

        otherOrg = organizationRepository.save(
            Organization.builder()
                .id(UUID.randomUUID())
                .name("Other Feature State Org")
                .createdBy(adminUser.getId())
                .build()
        );

        membershipRepository.save(
            Membership.builder()
                .id(new MembershipId(myOrg.getId(), adminUser.getId()))
                .organization(myOrg)
                .user(adminUser)
                .role(MembershipRole.ADMIN)
                .build()
        );

        membershipRepository.save(
            Membership.builder()
                .id(new MembershipId(myOrg.getId(), memberUser.getId()))
                .organization(myOrg)
                .user(memberUser)
                .role(MembershipRole.MEMBER)
                .build()
        );

        myProject = projectRepository.save(
            Project.builder()
                .id(UUID.randomUUID())
                .organization(myOrg)
                .name("Feature State Project")
                .createdBy(adminUser)
                .isDeleted(false)
                .build()
        );

        otherProject = projectRepository.save(
            Project.builder()
                .id(UUID.randomUUID())
                .organization(otherOrg)
                .name("Other Feature State Project")
                .createdBy(adminUser)
                .isDeleted(false)
                .build()
        );

        myEnvironment = environmentRepository.save(
            Environment.builder()
                .id(UUID.randomUUID())
                .project(myProject)
                .organization(myOrg)
                .name("Production")
                .apiKeyPrefix("env_prod_1")
                .apiKeyHash("dummy_hash_1")
                .build()
        );

        otherEnvironment = environmentRepository.save(
            Environment.builder()
                .id(UUID.randomUUID())
                .project(otherProject)
                .organization(otherOrg)
                .name("Production")
                .apiKeyPrefix("env_other_2")
                .apiKeyHash("dummy_hash_2")
                .build()
        );

        myFeature = featureRepository.save(
            Feature.builder()
                .id(UUID.randomUUID())
                .project(myProject)
                .key("checkout-v2")
                .name("Checkout V2")
                .description("Checkout feature")
                .type(FeatureType.BOOLEAN)
                .build()
        );

        otherFeature = featureRepository.save(
            Feature.builder()
                .id(UUID.randomUUID())
                .project(otherProject)
                .key("other-checkout-v2")
                .name("Other Checkout V2")
                .description("Other organization feature")
                .type(FeatureType.BOOLEAN)
                .build()
        );

        adminToken = jwtService.generateToken(adminUser);
        memberToken = jwtService.generateToken(memberUser);
    }

    @Test
    void testCreateFeatureStateAsAdmin() throws Exception {
        FeatureStateRequest request = new FeatureStateRequest(true);

        mockMvc
            .perform(
                patch(
                    "/api/v1/environments/{environmentId}/features/{featureKey}",
                    myEnvironment.getId(),
                    myFeature.getKey()
                )
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.featureId").value(myFeature.getId().toString()))
            .andExpect(jsonPath("$.data.environmentId").value(myEnvironment.getId().toString()))
            .andExpect(jsonPath("$.data.enabled").value(true))
            .andExpect(jsonPath("$.data.updatedBy").value(adminUser.getId().toString()))
            .andExpect(jsonPath("$.data.updatedAt").exists());

        assertThat(featureStateRepository.findAll()).hasSize(1);

        FeatureState state = featureStateRepository
            .findByFeatureIdAndEnvironmentIdAndOrganizationId(myFeature.getId(), myEnvironment.getId(), myOrg.getId())
            .orElseThrow();

        assertThat(state.getEnabled()).isTrue();
        assertThat(state.getUpdatedBy().getId()).isEqualTo(adminUser.getId());
    }

    @Test
    void testExistingFeatureStateIsUpdatedInsteadOfDuplicated() throws Exception {
        FeatureState existingState = featureStateRepository.save(
            FeatureState.builder()
                .feature(myFeature)
                .environment(myEnvironment)
                .organization(myOrg)
                .enabled(false)
                .updatedBy(adminUser)
                .build()
        );

        FeatureStateRequest request = new FeatureStateRequest(true);

        mockMvc
            .perform(
                patch(
                    "/api/v1/environments/{environmentId}/features/{featureKey}",
                    myEnvironment.getId(),
                    myFeature.getKey()
                )
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.enabled").value(true))
            .andExpect(jsonPath("$.data.id").value(existingState.getId().toString()));

        assertThat(featureStateRepository.findAll()).hasSize(1);

        FeatureState updatedState = featureStateRepository.findById(existingState.getId()).orElseThrow();

        assertThat(updatedState.getEnabled()).isTrue();
        assertThat(updatedState.getUpdatedBy().getId()).isEqualTo(adminUser.getId());
    }

    @Test
    void testToggleFromTrueToFalse() throws Exception {
        featureStateRepository.save(
            FeatureState.builder()
                .feature(myFeature)
                .environment(myEnvironment)
                .organization(myOrg)
                .enabled(true)
                .updatedBy(adminUser)
                .build()
        );

        FeatureStateRequest request = new FeatureStateRequest(false);

        mockMvc
            .perform(
                patch(
                    "/api/v1/environments/{environmentId}/features/{featureKey}",
                    myEnvironment.getId(),
                    myFeature.getKey()
                )
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.enabled").value(false));
    }

    @Test
    void testMemberCannotToggleFeatureState() throws Exception {
        FeatureStateRequest request = new FeatureStateRequest(true);

        mockMvc
            .perform(
                patch(
                    "/api/v1/environments/{environmentId}/features/{featureKey}",
                    myEnvironment.getId(),
                    myFeature.getKey()
                )
                    .header("Authorization", "Bearer " + memberToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isForbidden());

        assertThat(featureStateRepository.findAll()).isEmpty();
    }

    @Test
    void testTenantIsolation_CannotToggleOtherOrganizationEnvironment() throws Exception {
        FeatureStateRequest request = new FeatureStateRequest(true);

        mockMvc
            .perform(
                patch(
                    "/api/v1/environments/{environmentId}/features/{featureKey}",
                    otherEnvironment.getId(),
                    otherFeature.getKey()
                )
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isNotFound());

        assertThat(featureStateRepository.findAll()).isEmpty();
    }

    @Test
    void testTenantIsolation_CannotToggleOtherOrganizationFeatureUsingMyEnvironment() throws Exception {
        FeatureStateRequest request = new FeatureStateRequest(true);

        mockMvc
            .perform(
                patch(
                    "/api/v1/environments/{environmentId}/features/{featureKey}",
                    myEnvironment.getId(),
                    otherFeature.getKey()
                )
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isNotFound());

        assertThat(featureStateRepository.findAll()).isEmpty();
    }

    @Test
    void testMissingFeatureReturnsNotFound() throws Exception {
        FeatureStateRequest request = new FeatureStateRequest(true);

        mockMvc
            .perform(
                patch(
                    "/api/v1/environments/{environmentId}/features/{featureKey}",
                    myEnvironment.getId(),
                    "does-not-exist"
                )
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isNotFound());
    }

    @Test
    void testDeletedFeatureCannotBeToggled() throws Exception {
        myFeature.setDeletedAt(OffsetDateTime.now());
        featureRepository.save(myFeature);

        FeatureStateRequest request = new FeatureStateRequest(true);

        mockMvc
            .perform(
                patch(
                    "/api/v1/environments/{environmentId}/features/{featureKey}",
                    myEnvironment.getId(),
                    myFeature.getKey()
                )
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isNotFound());

        assertThat(featureStateRepository.findAll()).isEmpty();
    }

    @Test
    void testDeletedEnvironmentCannotBeToggled() throws Exception {
        myEnvironment.setDeletedAt(OffsetDateTime.now());
        environmentRepository.save(myEnvironment);

        FeatureStateRequest request = new FeatureStateRequest(true);

        mockMvc
            .perform(
                patch(
                    "/api/v1/environments/{environmentId}/features/{featureKey}",
                    myEnvironment.getId(),
                    myFeature.getKey()
                )
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isNotFound());

        assertThat(featureStateRepository.findAll()).isEmpty();
    }

    @Test
    void testMissingEnabledValueIsRejected() throws Exception {
        String request =
            """
            {
            }
            """;

        mockMvc
            .perform(
                patch(
                    "/api/v1/environments/{environmentId}/features/{featureKey}",
                    myEnvironment.getId(),
                    myFeature.getKey()
                )
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(request)
            )
            .andExpect(status().isBadRequest());

        assertThat(featureStateRepository.findAll()).isEmpty();
    }

    @Test
    void testUpdatedByChangesToAuthenticatedUser() throws Exception {
        FeatureState existingState = featureStateRepository.save(
            FeatureState.builder()
                .feature(myFeature)
                .environment(myEnvironment)
                .organization(myOrg)
                .enabled(false)
                .updatedBy(memberUser)
                .build()
        );

        /*
         * The member is intentionally not used for the mutation because
         * only ADMIN users can toggle state.
         *
         * This verifies that a successful mutation records the actual
         * authenticated user.
         */
        FeatureStateRequest request = new FeatureStateRequest(true);

        mockMvc
            .perform(
                patch(
                    "/api/v1/environments/{environmentId}/features/{featureKey}",
                    myEnvironment.getId(),
                    myFeature.getKey()
                )
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.updatedBy").value(adminUser.getId().toString()));

        FeatureState updatedState = featureStateRepository.findById(existingState.getId()).orElseThrow();

        assertThat(updatedState.getUpdatedBy().getId()).isEqualTo(adminUser.getId());
    }

    @Test
    void testFeatureStateUniquenessIsPreserved() {
        FeatureState first = featureStateRepository.save(
            FeatureState.builder()
                .feature(myFeature)
                .environment(myEnvironment)
                .organization(myOrg)
                .enabled(true)
                .updatedBy(adminUser)
                .build()
        );

        assertThat(
            featureStateRepository.findByFeatureIdAndEnvironmentIdAndOrganizationId(
                myFeature.getId(),
                myEnvironment.getId(),
                myOrg.getId()
            )
        )
            .isPresent()
            .contains(first);
    }
}
