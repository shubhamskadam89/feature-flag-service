package com.shubhamkadam.feature_flag_service.security;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.shubhamkadam.feature_flag_service.exceptions.BadRequestException;
import com.shubhamkadam.feature_flag_service.exceptions.ForbiddenException;
import com.shubhamkadam.feature_flag_service.exceptions.UnauthorizedException;
import com.shubhamkadam.feature_flag_service.modules.membership.Membership;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRepository;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRole;
import com.shubhamkadam.feature_flag_service.modules.organization.Organization;
import com.shubhamkadam.feature_flag_service.modules.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class OrganizationContextInterceptorTest {

    @Mock
    private MembershipRepository membershipRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @InjectMocks
    private OrganizationContextInterceptor interceptor;

    private User testUser;
    private Organization testOrg;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(UUID.randomUUID()).email("test@example.com").build();
        testOrg = Organization.builder().id(UUID.randomUUID()).name("Test Org").build();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        OrganizationContextHolder.clearContext();
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldSkipAuthEndpoints() {
        when(request.getRequestURI()).thenReturn("/api/v1/auth/login");
        assertTrue(interceptor.preHandle(request, response, new Object()));
        assertNull(OrganizationContextHolder.getContext());
    }

    @Test
    void shouldThrowUnauthorizedIfNoAuthentication() {
        when(request.getRequestURI()).thenReturn("/api/v1/projects");
        assertThrows(UnauthorizedException.class, () -> interceptor.preHandle(request, response, new Object()));
    }

    @Test
    void shouldSetContextWithValidHeader() {
        when(request.getRequestURI()).thenReturn("/api/v1/projects");
        when(request.getHeader("X-Organization-Id")).thenReturn(testOrg.getId().toString());

        SecurityContextHolder.getContext()
            .setAuthentication(new UsernamePasswordAuthenticationToken(testUser, null, Collections.emptyList()));

        Membership membership = Membership.builder().role(MembershipRole.ADMIN).build();
        when(membershipRepository.findByIdOrganizationIdAndIdUserId(testOrg.getId(), testUser.getId())).thenReturn(
            Optional.of(membership)
        );

        assertTrue(interceptor.preHandle(request, response, new Object()));

        assertNotNull(OrganizationContextHolder.getContext());
        assertEquals(testOrg.getId(), OrganizationContextHolder.getContext().getOrganizationId());
        assertEquals(MembershipRole.ADMIN, OrganizationContextHolder.getContext().getRole());
    }

    @Test
    void shouldThrowForbiddenIfMembershipNotFoundForHeader() {
        when(request.getRequestURI()).thenReturn("/api/v1/projects");
        when(request.getHeader("X-Organization-Id")).thenReturn(testOrg.getId().toString());

        SecurityContextHolder.getContext()
            .setAuthentication(new UsernamePasswordAuthenticationToken(testUser, null, Collections.emptyList()));

        when(membershipRepository.findByIdOrganizationIdAndIdUserId(testOrg.getId(), testUser.getId())).thenReturn(
            Optional.empty()
        );

        assertThrows(ForbiddenException.class, () -> interceptor.preHandle(request, response, new Object()));
    }
}
