package com.shubhamkadam.feature_flag_service.modules.featurestate;

import static org.assertj.core.api.Assertions.assertThat;

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
import com.shubhamkadam.feature_flag_service.security.OrganizationContextHolder;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class FeatureStateConcurrencyTest {

    @Autowired
    private FeatureStateService featureStateService;

    @Autowired
    private FeatureStateRepository featureStateRepository;

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

    private User adminUser;
    private Organization myOrg;
    private Project myProject;
    private Environment myEnvironment;
    private Feature myFeature;

    @BeforeEach
    void setUp() {
        featureStateRepository.deleteAllInBatch();
        featureRepository.deleteAllInBatch();
        environmentRepository.deleteAllInBatch();
        projectRepository.deleteAllInBatch();
        membershipRepository.deleteAllInBatch();
        organizationRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();

        adminUser = userRepository.save(
            User.builder()
                .id(UUID.randomUUID())
                .name("Concurrency Admin")
                .email("concurrency-admin@test.com")
                .passwordHash("hash")
                .build()
        );

        myOrg = organizationRepository.save(
            Organization.builder().id(UUID.randomUUID()).name("Concurrency Org").createdBy(adminUser.getId()).build()
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
                .name("Concurrency Project")
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
                .apiKeyPrefix("env_conc_")
                .apiKeyHash("conc_hash")
                .build()
        );

        myFeature = featureRepository.save(
            Feature.builder()
                .id(UUID.randomUUID())
                .project(myProject)
                .key("concurrency-key")
                .name("Concurrency Feature")
                .description("Concurrency testing flag")
                .type(FeatureType.BOOLEAN)
                .build()
        );
    }

    @AfterEach
    void tearDown() {
        featureStateRepository.deleteAllInBatch();
        featureRepository.deleteAllInBatch();
        environmentRepository.deleteAllInBatch();
        projectRepository.deleteAllInBatch();
        membershipRepository.deleteAllInBatch();
        organizationRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    @Test
    void testConcurrentStateInitializationCreatesOnlyOneRow() throws InterruptedException {
        int threads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(threads);

        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                try {
                    SecurityContextHolder.getContext()
                        .setAuthentication(
                            new UsernamePasswordAuthenticationToken(adminUser, null, adminUser.getAuthorities())
                        );
                    OrganizationContextHolder.setContext(
                        new OrganizationContextHolder.OrganizationContext(myOrg.getId(), MembershipRole.ADMIN)
                    );

                    startLatch.await();

                    featureStateService.toggleFeatureState(
                        myEnvironment.getId(),
                        myFeature.getKey(),
                        new FeatureStateRequest(true)
                    );
                } catch (Exception ignored) {} finally {
                    OrganizationContextHolder.clearContext();
                    SecurityContextHolder.clearContext();
                    endLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        endLatch.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(featureStateRepository.findAll()).hasSize(1);
    }
}
