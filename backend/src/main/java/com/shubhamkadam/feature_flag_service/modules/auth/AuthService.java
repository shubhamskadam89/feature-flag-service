package com.shubhamkadam.feature_flag_service.modules.auth;

import com.shubhamkadam.feature_flag_service.exceptions.ResourceAlreadyExistsException;
import com.shubhamkadam.feature_flag_service.exceptions.UnauthorizedException;
import com.shubhamkadam.feature_flag_service.modules.auth.dto.AuthResponse;
import com.shubhamkadam.feature_flag_service.modules.auth.dto.LoginRequest;
import com.shubhamkadam.feature_flag_service.modules.auth.dto.RegisterRequest;
import com.shubhamkadam.feature_flag_service.modules.membership.Membership;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipId;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRepository;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRole;
import com.shubhamkadam.feature_flag_service.modules.organization.Organization;
import com.shubhamkadam.feature_flag_service.modules.organization.OrganizationRepository;
import com.shubhamkadam.feature_flag_service.modules.user.User;
import com.shubhamkadam.feature_flag_service.modules.user.UserRepository;
import com.shubhamkadam.feature_flag_service.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final MembershipRepository membershipRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Attempting to register user with email: {}", request.getEmail());
        if (userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull(request.getEmail())) {
            log.warn("Registration failed: User with email {} already exists", request.getEmail());
            throw new ResourceAlreadyExistsException("User", "email", request.getEmail());
        }

        User user = User.builder()
                .id(UUID.randomUUID())
                .name(request.getName())
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();
        userRepository.save(user);

        Organization organization = Organization.builder()
                .id(UUID.randomUUID())
                .name(request.getOrganizationName())
                .build();
        organizationRepository.save(organization);

        MembershipId membershipId = MembershipId.builder()
                .organizationId(organization.getId())
                .userId(user.getId())
                .build();

        Membership membership = Membership.builder()
                .id(membershipId)
                .organization(organization)
                .user(user)
                .role(MembershipRole.ADMIN)
                .build();
        membershipRepository.save(membership);

        log.debug("Successfully created user {} and organization {}", user.getId(), organization.getId());

        String jwtToken = jwtService.generateToken(user);
        log.info("User {} registered successfully", request.getEmail());

        return AuthResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .organizationId(organization.getId())
                .organizationName(organization.getName())
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        log.info("Attempting login for user with email: {}", request.getEmail());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail().toLowerCase(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException ex) {
            log.warn("Login failed: Invalid credentials for email {}", request.getEmail());
            throw new UnauthorizedException("Invalid email or password");
        }

        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        List<Membership> memberships = membershipRepository.findByIdUserId(user.getId());
        Organization primaryOrganization = memberships.isEmpty() ? null : memberships.get(0).getOrganization();

        log.debug("Generating JWT token for user {}", user.getId());
        String jwtToken = jwtService.generateToken(user);
        
        log.info("User {} logged in successfully", request.getEmail());

        return AuthResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .organizationId(primaryOrganization != null ? primaryOrganization.getId() : null)
                .organizationName(primaryOrganization != null ? primaryOrganization.getName() : null)
                .build();
    }
}
