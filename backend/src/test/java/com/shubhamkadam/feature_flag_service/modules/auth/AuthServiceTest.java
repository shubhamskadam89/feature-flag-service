package com.shubhamkadam.feature_flag_service.modules.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.shubhamkadam.feature_flag_service.exceptions.ResourceAlreadyExistsException;
import com.shubhamkadam.feature_flag_service.exceptions.UnauthorizedException;
import com.shubhamkadam.feature_flag_service.modules.auth.dto.AuthResponse;
import com.shubhamkadam.feature_flag_service.modules.auth.dto.LoginRequest;
import com.shubhamkadam.feature_flag_service.modules.auth.dto.RegisterRequest;
import com.shubhamkadam.feature_flag_service.modules.membership.Membership;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRepository;
import com.shubhamkadam.feature_flag_service.modules.organization.Organization;
import com.shubhamkadam.feature_flag_service.modules.organization.OrganizationRepository;
import com.shubhamkadam.feature_flag_service.modules.user.User;
import com.shubhamkadam.feature_flag_service.modules.user.UserRepository;
import com.shubhamkadam.feature_flag_service.security.JwtService;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private MembershipRepository membershipRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User mockUser;
    private Organization mockOrganization;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequest.builder()
            .name("Shubham Kadam")
            .email("shubham@example.com")
            .password("password123")
            .build();

        loginRequest = LoginRequest.builder().email("shubham@example.com").password("password123").build();

        mockUser = User.builder()
            .id(UUID.randomUUID())
            .name("Shubham Kadam")
            .email("shubham@example.com")
            .passwordHash("hashed_password")
            .build();

        mockOrganization = Organization.builder().id(UUID.randomUUID()).name("Acme Corp").build();
    }

    @Test
    @DisplayName("Should successfully register user and return JWT token")
    void register_Success() {
        when(userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull(registerRequest.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken(any(User.class))).thenReturn("mock_jwt_token");

        AuthResponse response = authService.register(registerRequest);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mock_jwt_token");
        assertThat(response.getEmail()).isEqualTo("shubham@example.com");
        assertThat(response.getName()).isEqualTo("Shubham Kadam");

        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw ResourceAlreadyExistsException when registering with an existing email")
    void register_DuplicateEmail_ThrowsException() {
        when(userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull(registerRequest.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
            .isInstanceOf(ResourceAlreadyExistsException.class)
            .hasMessageContaining("User already exists with email");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should successfully authenticate and issue JWT token on valid login")
    void login_Success() {
        when(userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(loginRequest.getEmail())).thenReturn(
            Optional.of(mockUser)
        );
        when(membershipRepository.findByIdUserId(mockUser.getId())).thenReturn(
            List.of(Membership.builder().organization(mockOrganization).user(mockUser).build())
        );
        when(jwtService.generateToken(mockUser)).thenReturn("mock_jwt_token");

        AuthResponse response = authService.login(loginRequest);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mock_jwt_token");
        assertThat(response.getEmail()).isEqualTo("shubham@example.com");
        assertThat(response.getOrganizationId()).isEqualTo(mockOrganization.getId());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when login credentials are invalid")
    void login_InvalidCredentials_ThrowsException() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenThrow(
            new BadCredentialsException("Bad credentials")
        );

        assertThatThrownBy(() -> authService.login(loginRequest))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessageContaining("Invalid email or password");
    }
}
