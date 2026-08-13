package com.shubhamkadam.feature_flag_service.modules.feature;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class FeatureIntegrationTest {

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
    private FeatureRepository featureRepository;

    @Autowired
    private JwtService jwtService;

    private User adminUser;
    private User memberUser;
    private Organization myOrg;
    private Organization otherOrg;
    private Project myProject;
    private Project otherProject;
    private String adminToken;
    private String memberToken;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();

        adminUser = userRepository.save(
            User.builder()
                .id(UUID.randomUUID())
                .name("Admin")
                .email("admin-feature@test.com")
                .passwordHash("hash")
                .build()
        );

        memberUser = userRepository.save(
            User.builder()
                .id(UUID.randomUUID())
                .name("Member")
                .email("member-feature@test.com")
                .passwordHash("hash")
                .build()
        );

        myOrg = organizationRepository.save(
            Organization.builder().id(UUID.randomUUID()).name("My Feature Org").createdBy(adminUser.getId()).build()
        );

        otherOrg = organizationRepository.save(
            Organization.builder().id(UUID.randomUUID()).name("Other Feature Org").createdBy(adminUser.getId()).build()
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
                .name("My Feature Project")
                .createdBy(adminUser)
                .isDeleted(false)
                .build()
        );

        otherProject = projectRepository.save(
            Project.builder()
                .id(UUID.randomUUID())
                .organization(otherOrg)
                .name("Other Feature Project")
                .createdBy(adminUser)
                .isDeleted(false)
                .build()
        );

        adminToken = jwtService.generateToken(adminUser);
        memberToken = jwtService.generateToken(memberUser);
    }

    @Test
    void testCreateFeatureAsAdmin() throws Exception {
        CreateFeatureRequest request = new CreateFeatureRequest(
            "new-dashboard",
            "New Dashboard",
            "Controls the new dashboard experience",
            FeatureType.BOOLEAN
        );

        mockMvc
            .perform(
                post("/api/v1/projects/{projectId}/features", myProject.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.key").value("new-dashboard"))
            .andExpect(jsonPath("$.data.name").value("New Dashboard"))
            .andExpect(jsonPath("$.data.description").value("Controls the new dashboard experience"))
            .andExpect(jsonPath("$.data.type").value("BOOLEAN"))
            .andExpect(jsonPath("$.data.projectId").value(myProject.getId().toString()));

        assertThat(featureRepository.findAll()).hasSize(1);
    }

    @Test
    void testCreateFeatureAsMember_Forbidden() throws Exception {
        CreateFeatureRequest request = new CreateFeatureRequest(
            "member-feature",
            "Member Feature",
            null,
            FeatureType.BOOLEAN
        );

        mockMvc
            .perform(
                post("/api/v1/projects/{projectId}/features", myProject.getId())
                    .header("Authorization", "Bearer " + memberToken)
                    .header("organization-id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isForbidden());

        assertThat(featureRepository.findAll()).isEmpty();
    }

    @Test
    void testCreateFeatureInOtherOrganization_ForbiddenByTenantIsolation() throws Exception {
        CreateFeatureRequest request = new CreateFeatureRequest(
            "cross-tenant-feature",
            "Cross Tenant Feature",
            null,
            FeatureType.BOOLEAN
        );

        mockMvc
            .perform(
                post("/api/v1/projects/{projectId}/features", otherProject.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isNotFound());

        assertThat(featureRepository.findAll()).isEmpty();
    }

    @Test
    void testFeatureCrud() throws Exception {
        CreateFeatureRequest createRequest = new CreateFeatureRequest(
            "checkout-v2",
            "Checkout V2",
            "New checkout experience",
            FeatureType.BOOLEAN
        );

        MvcResult createResult = mockMvc
            .perform(
                post("/api/v1/projects/{projectId}/features", myProject.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(createRequest))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.key").value("checkout-v2"))
            .andReturn();

        String featureId = objectMapper
            .readTree(createResult.getResponse().getContentAsString())
            .path("data")
            .path("id")
            .asText();

        // List
        mockMvc
            .perform(
                get("/api/v1/projects/{projectId}/features", myProject.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].key").value("checkout-v2"))
            .andExpect(jsonPath("$.data[0].name").value("Checkout V2"));

        // Get by ID
        mockMvc
            .perform(
                get("/api/v1/projects/{projectId}/features/{featureId}", myProject.getId(), featureId)
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(featureId))
            .andExpect(jsonPath("$.data.key").value("checkout-v2"));

        // Update
        UpdateFeatureRequest updateRequest = new UpdateFeatureRequest(
            "Checkout V2 Updated",
            "Updated checkout experience"
        );

        mockMvc
            .perform(
                patch("/api/v1/projects/{projectId}/features/{featureId}", myProject.getId(), featureId)
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(updateRequest))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("Checkout V2 Updated"))
            .andExpect(jsonPath("$.data.description").value("Updated checkout experience"))
            .andExpect(jsonPath("$.data.key").value("checkout-v2"));

        // Delete
        mockMvc
            .perform(
                delete("/api/v1/projects/{projectId}/features/{featureId}", myProject.getId(), featureId)
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
            )
            .andExpect(status().isOk());

        Feature deletedFeature = featureRepository.findById(UUID.fromString(featureId)).orElseThrow();

        assertThat(deletedFeature.getDeletedAt()).isNotNull();

        // Deleted feature should not be readable
        mockMvc
            .perform(
                get("/api/v1/projects/{projectId}/features/{featureId}", myProject.getId(), featureId)
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
            )
            .andExpect(status().isNotFound());

        // Deleted feature should not appear in list
        mockMvc
            .perform(
                get("/api/v1/projects/{projectId}/features", myProject.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void testMemberCanReadFeatures() throws Exception {
        Feature feature = featureRepository.save(
            Feature.builder()
                .project(myProject)
                .key("read-only")
                .name("Read Only Feature")
                .description("Member can read this")
                .type(FeatureType.BOOLEAN)
                .build()
        );

        mockMvc
            .perform(
                get("/api/v1/projects/{projectId}/features/{featureId}", myProject.getId(), feature.getId())
                    .header("Authorization", "Bearer " + memberToken)
                    .header("organization-id", myOrg.getId().toString())
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.key").value("read-only"));
    }

    @Test
    void testMemberCannotUpdateFeature() throws Exception {
        Feature feature = createFeature("member-update-test");

        UpdateFeatureRequest request = new UpdateFeatureRequest("Updated Name", "Updated Description");

        mockMvc
            .perform(
                patch("/api/v1/projects/{projectId}/features/{featureId}", myProject.getId(), feature.getId())
                    .header("Authorization", "Bearer " + memberToken)
                    .header("organization-id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isForbidden());
    }

    @Test
    void testMemberCannotDeleteFeature() throws Exception {
        Feature feature = createFeature("member-delete-test");

        mockMvc
            .perform(
                delete("/api/v1/projects/{projectId}/features/{featureId}", myProject.getId(), feature.getId())
                    .header("Authorization", "Bearer " + memberToken)
                    .header("organization-id", myOrg.getId().toString())
            )
            .andExpect(status().isForbidden());

        Feature unchanged = featureRepository.findById(feature.getId()).orElseThrow();

        assertThat(unchanged.getDeletedAt()).isNull();
    }

    @Test
    void testDuplicateActiveFeatureKeyRejected() throws Exception {
        createFeature("duplicate-key");

        CreateFeatureRequest duplicateRequest = new CreateFeatureRequest(
            "duplicate-key",
            "Another Feature",
            null,
            FeatureType.BOOLEAN
        );

        mockMvc
            .perform(
                post("/api/v1/projects/{projectId}/features", myProject.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(duplicateRequest))
            )
            .andExpect(status().isConflict());

        assertThat(
            featureRepository.findByProjectIdAndOrganizationIdAndDeletedAtIsNull(myProject.getId(), myOrg.getId())
        ).hasSize(1);
    }

    @Test
    void testDeletedFeatureKeyCanBeReused() throws Exception {
        Feature feature = createFeature("reusable-key");

        feature.setDeletedAt(java.time.OffsetDateTime.now());
        featureRepository.save(feature);

        CreateFeatureRequest request = new CreateFeatureRequest(
            "reusable-key",
            "Recreated Feature",
            null,
            FeatureType.BOOLEAN
        );

        mockMvc
            .perform(
                post("/api/v1/projects/{projectId}/features", myProject.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.key").value("reusable-key"))
            .andExpect(jsonPath("$.data.name").value("Recreated Feature"));

        assertThat(
            featureRepository.findByProjectIdAndOrganizationIdAndDeletedAtIsNull(myProject.getId(), myOrg.getId())
        ).hasSize(1);
    }

    @Test
    void testInvalidFeatureKeyRejected() throws Exception {
        CreateFeatureRequest request = new CreateFeatureRequest(
            "Invalid Feature Key!",
            "Invalid Feature",
            null,
            FeatureType.BOOLEAN
        );

        mockMvc
            .perform(
                post("/api/v1/projects/{projectId}/features", myProject.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isBadRequest());

        assertThat(featureRepository.findAll()).isEmpty();
    }

    @Test
    void testBlankFeatureKeyRejected() throws Exception {
        CreateFeatureRequest request = new CreateFeatureRequest(" ", "Feature", null, FeatureType.BOOLEAN);

        mockMvc
            .perform(
                post("/api/v1/projects/{projectId}/features", myProject.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    void testBlankFeatureNameRejected() throws Exception {
        CreateFeatureRequest request = new CreateFeatureRequest("valid-key", " ", null, FeatureType.BOOLEAN);

        mockMvc
            .perform(
                post("/api/v1/projects/{projectId}/features", myProject.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    void testMissingFeatureTypeRejected() throws Exception {
        String request =
            """
            {
                "key": "missing-type",
                "name": "Missing Type Feature",
                "description": "Type is intentionally missing"
            }
            """;

        mockMvc
            .perform(
                post("/api/v1/projects/{projectId}/features", myProject.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(request)
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    void testInvalidFeatureTypeRejected() throws Exception {
        String request =
            """
            {
                "key": "invalid-type",
                "name": "Invalid Type Feature",
                "description": "Unsupported feature type",
                "type": "STRING"
            }
            """;

        mockMvc
            .perform(
                post("/api/v1/projects/{projectId}/features", myProject.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(request)
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    void testEmptyPatchRejected() throws Exception {
        Feature feature = createFeature("empty-patch");

        UpdateFeatureRequest request = new UpdateFeatureRequest(null, null);

        mockMvc
            .perform(
                patch("/api/v1/projects/{projectId}/features/{featureId}", myProject.getId(), feature.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    void testTenantIsolation_CannotReadFeatureFromOtherOrganization() throws Exception {
        Feature otherFeature = featureRepository.save(
            Feature.builder()
                .project(otherProject)
                .key("other-org-feature")
                .name("Other Organization Feature")
                .type(FeatureType.BOOLEAN)
                .build()
        );

        mockMvc
            .perform(
                get("/api/v1/projects/{projectId}/features/{featureId}", otherProject.getId(), otherFeature.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
            )
            .andExpect(status().isNotFound());
    }

    @Test
    void testTenantIsolation_CannotUpdateFeatureFromOtherOrganization() throws Exception {
        Feature otherFeature = featureRepository.save(
            Feature.builder()
                .project(otherProject)
                .key("other-org-update")
                .name("Other Organization Feature")
                .type(FeatureType.BOOLEAN)
                .build()
        );

        UpdateFeatureRequest request = new UpdateFeatureRequest("Hacked Name", "Should not update");

        mockMvc
            .perform(
                patch("/api/v1/projects/{projectId}/features/{featureId}", otherProject.getId(), otherFeature.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isNotFound());

        Feature unchanged = featureRepository.findById(otherFeature.getId()).orElseThrow();

        assertThat(unchanged.getName()).isEqualTo("Other Organization Feature");
    }

    @Test
    void testTenantIsolation_CannotDeleteFeatureFromOtherOrganization() throws Exception {
        Feature otherFeature = featureRepository.save(
            Feature.builder()
                .project(otherProject)
                .key("other-org-delete")
                .name("Other Organization Feature")
                .type(FeatureType.BOOLEAN)
                .build()
        );

        mockMvc
            .perform(
                delete("/api/v1/projects/{projectId}/features/{featureId}", otherProject.getId(), otherFeature.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
            )
            .andExpect(status().isNotFound());

        Feature unchanged = featureRepository.findById(otherFeature.getId()).orElseThrow();

        assertThat(unchanged.getDeletedAt()).isNull();
    }

    private Feature createFeature(String key) {
        return featureRepository.save(
            Feature.builder()
                .project(myProject)
                .key(key)
                .name("Test Feature")
                .description("Test feature description")
                .type(FeatureType.BOOLEAN)
                .build()
        );
    }
}
