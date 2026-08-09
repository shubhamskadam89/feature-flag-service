package com.shubhamkadam.feature_flag_service.modules.environment.environment;

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EnvironmentIntegrationTest {

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
        
        adminUser = userRepository.save(User.builder().id(UUID.randomUUID()).name("Admin").email("admin@test.com").passwordHash("hash").build());
        memberUser = userRepository.save(User.builder().id(UUID.randomUUID()).name("Member").email("member@test.com").passwordHash("hash").build());
        
        myOrg = organizationRepository.save(Organization.builder().id(UUID.randomUUID()).name("My Org").build());
        otherOrg = organizationRepository.save(Organization.builder().id(UUID.randomUUID()).name("Other Org").build());
        
        membershipRepository.save(Membership.builder().id(new MembershipId(myOrg.getId(), adminUser.getId())).organization(myOrg).user(adminUser).role(MembershipRole.ADMIN).build());
        membershipRepository.save(Membership.builder().id(new MembershipId(myOrg.getId(), memberUser.getId())).organization(myOrg).user(memberUser).role(MembershipRole.MEMBER).build());
        
        myProject = projectRepository.save(Project.builder().id(UUID.randomUUID()).organization(myOrg).name("My Project").build());
        otherProject = projectRepository.save(Project.builder().id(UUID.randomUUID()).organization(otherOrg).name("Other Project").build());
        
        adminToken = jwtService.generateToken(adminUser);
        memberToken = jwtService.generateToken(memberUser);
    }

    @Test
    void testCreateEnvironmentAsAdmin() throws Exception {
        EnvironmentRequestDto request = new EnvironmentRequestDto("Production");
        
        mockMvc.perform(post("/api/v1/projects/{projectId}/environments", myProject.getId())
                .header("Authorization", "Bearer " + adminToken)
                .header("organization-id", myOrg.getId().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Production"))
                .andExpect(jsonPath("$.data.plaintextApiKey").exists())
                .andExpect(jsonPath("$.data.apiKeyPrefix").exists());
                
        assertThat(environmentRepository.findAll()).hasSize(1);
    }

    @Test
    void testCreateEnvironmentAsMember_Forbidden() throws Exception {
        EnvironmentRequestDto request = new EnvironmentRequestDto("Staging");
        
        mockMvc.perform(post("/api/v1/projects/{projectId}/environments", myProject.getId())
                .header("Authorization", "Bearer " + memberToken)
                .header("organization-id", myOrg.getId().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testTenantIsolation_CannotCreateInOtherProject() throws Exception {
        EnvironmentRequestDto request = new EnvironmentRequestDto("Staging");
        
        mockMvc.perform(post("/api/v1/projects/{projectId}/environments", otherProject.getId())
                .header("Authorization", "Bearer " + adminToken)
                .header("organization-id", myOrg.getId().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound()); // Project not found for this org context
    }

    @Test
    void testEnvironmentCrudAndKeyRotation() throws Exception {
        // Create
        EnvironmentRequestDto createReq = new EnvironmentRequestDto("Dev");
        MvcResult createResult = mockMvc.perform(post("/api/v1/projects/{projectId}/environments", myProject.getId())
                .header("Authorization", "Bearer " + adminToken)
                .header("organization-id", myOrg.getId().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andReturn();
                
        String envId = objectMapper.readTree(createResult.getResponse().getContentAsString()).path("data").path("id").asText();
        String originalKey = objectMapper.readTree(createResult.getResponse().getContentAsString()).path("data").path("plaintextApiKey").asText();
        
        // Read List
        mockMvc.perform(get("/api/v1/projects/{projectId}/environments", myProject.getId())
                .header("Authorization", "Bearer " + adminToken)
                .header("organization-id", myOrg.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Dev"))
                .andExpect(jsonPath("$.data[0].plaintextApiKey").doesNotExist()); // Ensure plaintext key isn't returned on normal reads

        // Update
        EnvironmentRequestDto updateReq = new EnvironmentRequestDto("Development");
        mockMvc.perform(patch("/api/v1/projects/{projectId}/environments/{envId}", myProject.getId(), envId)
                .header("Authorization", "Bearer " + adminToken)
                .header("organization-id", myOrg.getId().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Development"));
                
        // Rotate Key
        MvcResult rotateResult = mockMvc.perform(post("/api/v1/projects/{projectId}/environments/{envId}/rotate-key", myProject.getId(), envId)
                .header("Authorization", "Bearer " + adminToken)
                .header("organization-id", myOrg.getId().toString()))
                .andExpect(status().isOk())
                .andReturn();
                
        String newKey = objectMapper.readTree(rotateResult.getResponse().getContentAsString()).path("data").path("plaintextApiKey").asText();
        assertThat(newKey).isNotEqualTo(originalKey);
        
        // Delete
        mockMvc.perform(delete("/api/v1/projects/{projectId}/environments/{envId}", myProject.getId(), envId)
                .header("Authorization", "Bearer " + adminToken)
                .header("organization-id", myOrg.getId().toString()))
                .andExpect(status().isOk());
                
        // Ensure soft deleted
        Environment deletedEnv = environmentRepository.findById(UUID.fromString(envId)).orElseThrow();
        assertThat(deletedEnv.getDeletedAt()).isNotNull();
        
        // Get should return 404
        mockMvc.perform(get("/api/v1/projects/{projectId}/environments/{envId}", myProject.getId(), envId)
                .header("Authorization", "Bearer " + adminToken)
                .header("organization-id", myOrg.getId().toString()))
                .andExpect(status().isNotFound());
    }
}
