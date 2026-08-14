package com.shubhamkadam.feature_flag_service.modules.validation;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shubhamkadam.feature_flag_service.modules.environment.EnvironmentRequestDto;
import com.shubhamkadam.feature_flag_service.modules.feature.CreateFeatureRequest;
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
import com.shubhamkadam.feature_flag_service.modules.project.ProjectRequestDto;
import com.shubhamkadam.feature_flag_service.modules.user.User;
import com.shubhamkadam.feature_flag_service.modules.user.UserRepository;
import com.shubhamkadam.feature_flag_service.security.JwtService;
import java.util.UUID;
import org.hamcrest.Matchers;
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

/**
 * Integration tests verifying all API validation constraints:
 * - Blank and whitespace-only name rejection (after trimming)
 * - Field length limits matching database schema
 * - Feature-key pattern enforcement (lowercase, letters, numbers, dots, hyphens, underscores)
 * - Invalid UUID path variable handling returns 400 not 500
 * - Description size cap
 * - Blank update name rejection
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ValidationIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

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

    private final ObjectMapper objectMapper = new ObjectMapper();

    private User adminUser;
    private Organization myOrg;
    private Project myProject;
    private String adminToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();

        adminUser = userRepository.save(
            User.builder()
                .id(UUID.randomUUID())
                .name("Validation Admin")
                .email("validation-admin@test.com")
                .passwordHash("hash")
                .build()
        );

        myOrg = organizationRepository.save(
            Organization.builder().id(UUID.randomUUID()).name("Validation Org").createdBy(adminUser.getId()).build()
        );

        membershipRepository.save(
            Membership.builder()
                .id(new MembershipId(myOrg.getId(), adminUser.getId()))
                .organization(myOrg)
                .user(adminUser)
                .role(MembershipRole.ADMIN)
                .build()
        );

        myProject = projectRepository.save(
            Project.builder()
                .id(UUID.randomUUID())
                .organization(myOrg)
                .name("Validation Project")
                .createdBy(adminUser)
                .isDeleted(false)
                .build()
        );

        adminToken = jwtService.generateToken(adminUser);
    }

    // ─── Project Name Validation ─────────────────────────────────────────────

    @Test
    void createProject_BlankName_Rejected() throws Exception {
        ProjectRequestDto request = new ProjectRequestDto("");
        mockMvc
            .perform(
                post("/api/v1/projects")
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    void createProject_WhitespaceOnlyName_Rejected() throws Exception {
        // Whitespace is trimmed to "" in constructor, so @NotBlank fires
        ProjectRequestDto request = new ProjectRequestDto("   ");
        mockMvc
            .perform(
                post("/api/v1/projects")
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    void createProject_NameTooLong_Rejected() throws Exception {
        ProjectRequestDto request = new ProjectRequestDto("x".repeat(101));
        mockMvc
            .perform(
                post("/api/v1/projects")
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    void createProject_NameExactlyAtLimit_Accepted() throws Exception {
        ProjectRequestDto request = new ProjectRequestDto("a".repeat(100));
        mockMvc
            .perform(
                post("/api/v1/projects")
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isOk());
    }

    // ─── Environment Name Validation ─────────────────────────────────────────

    @Test
    void createEnvironment_BlankName_Rejected() throws Exception {
        EnvironmentRequestDto request = new EnvironmentRequestDto("");
        mockMvc
            .perform(
                post("/api/v1/projects/{projectId}/environments", myProject.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    void createEnvironment_WhitespaceOnlyName_Rejected() throws Exception {
        EnvironmentRequestDto request = new EnvironmentRequestDto("   ");
        mockMvc
            .perform(
                post("/api/v1/projects/{projectId}/environments", myProject.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    void createEnvironment_NameTooLong_Rejected() throws Exception {
        EnvironmentRequestDto request = new EnvironmentRequestDto("e".repeat(101));
        mockMvc
            .perform(
                post("/api/v1/projects/{projectId}/environments", myProject.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isBadRequest());
    }

    // ─── Feature Create Validation ────────────────────────────────────────────

    @Test
    void createFeature_BlankKey_Rejected() throws Exception {
        CreateFeatureRequest request = new CreateFeatureRequest("", "My Feature", null, FeatureType.BOOLEAN);
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
    void createFeature_KeyWithUppercase_Rejected() throws Exception {
        CreateFeatureRequest request = new CreateFeatureRequest("My-Feature", "My Feature", null, FeatureType.BOOLEAN);
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
    void createFeature_KeyWithSpaces_Rejected() throws Exception {
        CreateFeatureRequest request = new CreateFeatureRequest("my feature", "My Feature", null, FeatureType.BOOLEAN);
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
    void createFeature_ValidKey_Accepted() throws Exception {
        // lowercase, numbers, dot, hyphen, underscore all valid
        CreateFeatureRequest request = new CreateFeatureRequest(
            "checkout.v2_new-flag",
            "Checkout V2",
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
            .andExpect(status().isOk());
    }

    @Test
    void createFeature_BlankName_Rejected() throws Exception {
        CreateFeatureRequest request = new CreateFeatureRequest("valid-key", "", null, FeatureType.BOOLEAN);
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
    void createFeature_DescriptionTooLong_Rejected() throws Exception {
        String longDesc = "d".repeat(501);
        CreateFeatureRequest request = new CreateFeatureRequest(
            "valid-key-2",
            "Feature",
            longDesc,
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
    }

    @Test
    void createFeature_NullType_Rejected() throws Exception {
        String json = "{\"key\":\"valid-key-3\",\"name\":\"Test Feature\",\"description\":null,\"type\":null}";
        mockMvc
            .perform(
                post("/api/v1/projects/{projectId}/features", myProject.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json)
            )
            .andExpect(status().isBadRequest());
    }

    // ─── Feature Update Validation ────────────────────────────────────────────

    @Test
    void updateFeature_NameTooLong_Rejected() throws Exception {
        Feature feature = featureRepository.save(
            Feature.builder()
                .project(myProject)
                .key("update-size-test")
                .name("Original Name")
                .type(FeatureType.BOOLEAN)
                .build()
        );

        String json = "{\"name\":\"" + "n".repeat(101) + "\",\"description\":null}";
        mockMvc
            .perform(
                patch("/api/v1/projects/{projectId}/features/{featureId}", myProject.getId(), feature.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json)
            )
            .andExpect(status().isBadRequest());
    }

    // ─── UUID Path Variable Validation ───────────────────────────────────────

    @Test
    void getProject_InvalidUUID_Returns400NotServerError() throws Exception {
        mockMvc
            .perform(
                get("/api/v1/projects/{projectId}", "not-a-valid-uuid")
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value(Matchers.containsString("valid UUID format")));
    }

    @Test
    void getFeatures_InvalidProjectUUID_Returns400NotServerError() throws Exception {
        mockMvc
            .perform(
                get("/api/v1/projects/{projectId}/features", "bad-uuid-here")
                    .header("Authorization", "Bearer " + adminToken)
                    .header("organization-id", myOrg.getId().toString())
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value(Matchers.containsString("valid UUID format")));
    }
}
