package com.shubhamkadam.feature_flag_service.modules.audit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.shubhamkadam.feature_flag_service.modules.environment.Environment;
import com.shubhamkadam.feature_flag_service.modules.environment.EnvironmentRepository;
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
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuditLogIntegrationTest {

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
    private EnvironmentRepository environmentRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private com.shubhamkadam.feature_flag_service.modules.project.ProjectService projectService;

    @Autowired
    private JwtService jwtService;

    private User adminUser;
    private Organization myOrg;
    private Organization otherOrg;
    private Project myProject;
    private Environment myEnv;
    private Environment otherEnv;
    private String adminToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();

        adminUser = userRepository.save(
            User.builder().id(UUID.randomUUID()).name("Admin User").email("admin@test.com").passwordHash("hash").build()
        );

        myOrg = organizationRepository.save(
            Organization.builder().id(UUID.randomUUID()).name("My Organization").createdBy(adminUser.getId()).build()
        );
        otherOrg = organizationRepository.save(
            Organization.builder().id(UUID.randomUUID()).name("Other Organization").createdBy(adminUser.getId()).build()
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
                .name("My Project")
                .createdBy(adminUser)
                .isDeleted(false)
                .build()
        );

        myEnv = environmentRepository.save(
            Environment.builder()
                .id(UUID.randomUUID())
                .project(myProject)
                .organization(myOrg)
                .name("Development")
                .apiKeyPrefix("prefix")
                .apiKeyHash("hash")
                .build()
        );

        otherEnv = environmentRepository.save(
            Environment.builder()
                .id(UUID.randomUUID())
                .project(myProject)
                .organization(otherOrg)
                .name("Production")
                .apiKeyPrefix("prefix2")
                .apiKeyHash("hash2")
                .build()
        );

        adminToken = jwtService.generateToken(adminUser);
    }

    @Test
    void testRecordEventAndFetchLogs() {
        String jsonOld = "{\"key\": \"old-val\"}";
        String jsonNew = "{\"key\": \"new-val\"}";

        auditLogService.recordEvent(myOrg, myEnv, null, adminUser, AuditAction.ENVIRONMENT_CREATED, jsonOld, jsonNew);

        List<AuditLog> logs = auditLogRepository.findAll();
        assertThat(logs).isNotEmpty();
        AuditLog savedLog = logs
            .stream()
            .filter(l -> l.getEnvironment() != null && l.getEnvironment().getId().equals(myEnv.getId()))
            .findFirst()
            .orElse(null);

        assertThat(savedLog).isNotNull();
        assertThat(savedLog.getAction()).isEqualTo(AuditAction.ENVIRONMENT_CREATED.name());
        assertThat(savedLog.getOldValue()).isEqualTo(jsonOld);
        assertThat(savedLog.getNewValue()).isEqualTo(jsonNew);
        assertThat(savedLog.getUser().getId()).isEqualTo(adminUser.getId());
    }

    @Test
    void testGetAuditLogsForEnvironment() throws Exception {
        String jsonOld = "{\"enabled\": false}";
        String jsonNew = "{\"enabled\": true}";

        auditLogService.recordEvent(myOrg, myEnv, null, adminUser, AuditAction.FEATURE_TOGGLED, jsonOld, jsonNew);

        mockMvc
            .perform(
                get("/api/v1/environments/{environmentId}/audit-log", myEnv.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content[0].action").value(AuditAction.FEATURE_TOGGLED.name()))
            .andExpect(jsonPath("$.data.content[0].oldValue").value(jsonOld))
            .andExpect(jsonPath("$.data.content[0].newValue").value(jsonNew))
            .andExpect(jsonPath("$.data.content[0].userName").value(adminUser.getName()))
            .andExpect(jsonPath("$.data.content[0].userEmail").value(adminUser.getEmail()));
    }

    @Test
    void testTenantIsolation_CannotAccessOtherOrgAuditLog() throws Exception {
        mockMvc
            .perform(
                get("/api/v1/environments/{environmentId}/audit-log", otherEnv.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
            )
            .andExpect(status().isNotFound());
    }

    @Test
    void testAuditLogsSortedByCreatedAtDesc() throws Exception {
        auditLogService.recordEvent(myOrg, myEnv, null, adminUser, AuditAction.PROJECT_CREATED, null, null);
        Thread.sleep(10); // Ensure distinct timestamps
        auditLogService.recordEvent(myOrg, myEnv, null, adminUser, AuditAction.FEATURE_CREATED, null, null);

        mockMvc
            .perform(
                get("/api/v1/environments/{environmentId}/audit-log", myEnv.getId())
                    .header("Authorization", "Bearer " + adminToken)
                    .header("X-Organization-Id", myOrg.getId().toString())
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content[0].action").value(AuditAction.FEATURE_CREATED.name()))
            .andExpect(jsonPath("$.data.content[1].action").value(AuditAction.PROJECT_CREATED.name()));
    }

    @Test
    void testTransactionalRollbackOnMutationError() {
        long initialAuditLogs = auditLogRepository.count();
        long initialProjects = projectRepository.count();

        com.shubhamkadam.feature_flag_service.modules.project.ProjectRequestDto duplicateRequest =
            new com.shubhamkadam.feature_flag_service.modules.project.ProjectRequestDto("My Project");

        com.shubhamkadam.feature_flag_service.security.OrganizationContextHolder.setContext(
            new com.shubhamkadam.feature_flag_service.security.OrganizationContextHolder.OrganizationContext(
                myOrg.getId(),
                MembershipRole.ADMIN
            )
        );

        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> {
            projectService.createProjectWithinOrganization(duplicateRequest);
        });

        assertThat(projectRepository.count()).isEqualTo(initialProjects);
        assertThat(auditLogRepository.count()).isEqualTo(initialAuditLogs);

        com.shubhamkadam.feature_flag_service.security.OrganizationContextHolder.clearContext();
    }
}
