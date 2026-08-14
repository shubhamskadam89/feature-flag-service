package com.shubhamkadam.feature_flag_service.modules.project;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shubhamkadam.feature_flag_service.modules.membership.Membership;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipId;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRepository;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRole;
import com.shubhamkadam.feature_flag_service.modules.organization.Organization;
import com.shubhamkadam.feature_flag_service.modules.organization.OrganizationRepository;
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
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ProjectIntegrationTest {

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
    private JwtService jwtService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private User adminUser;
    private Organization myOrg;
    private String adminToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();

        adminUser = userRepository.save(
            User.builder().id(UUID.randomUUID()).name("Admin").email("admin-proj@test.com").passwordHash("hash").build()
        );

        myOrg = organizationRepository.save(
            Organization.builder().id(UUID.randomUUID()).name("My Org").createdBy(adminUser.getId()).build()
        );

        membershipRepository.save(
            Membership.builder()
                .id(new MembershipId(myOrg.getId(), adminUser.getId()))
                .organization(myOrg)
                .user(adminUser)
                .role(MembershipRole.ADMIN)
                .build()
        );

        adminToken = jwtService.generateToken(adminUser);
    }

    @Test
    void testCreateProjectSuccessfully() throws Exception {
        ProjectRequestDto request = new ProjectRequestDto("Valid Project");

        mockMvc
            .perform(
                post("/api/v1/projects")
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.projectName").value("Valid Project"));
    }

    @Test
    void testCreateProjectValidation_BlankName() throws Exception {
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
    void testCreateProjectValidation_NameTooLong() throws Exception {
        String longName = "a".repeat(101);
        ProjectRequestDto request = new ProjectRequestDto(longName);

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
    void testUpdateProjectValidation_NameTooLong() throws Exception {
        Project project = projectRepository.save(
            Project.builder()
                .id(UUID.randomUUID())
                .name("Old Project")
                .organization(myOrg)
                .createdBy(adminUser)
                .isDeleted(false)
                .build()
        );

        String longName = "b".repeat(101);
        ProjectRequestDto request = new ProjectRequestDto(longName);

        mockMvc
            .perform(
                patch("/api/v1/projects/{projectId}", project.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
            )
            .andExpect(status().isBadRequest());
    }
}
