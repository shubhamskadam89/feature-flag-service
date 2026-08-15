package com.shubhamkadam.feature_flag_service.security;

import com.shubhamkadam.feature_flag_service.exceptions.BadRequestException;
import com.shubhamkadam.feature_flag_service.exceptions.ForbiddenException;
import com.shubhamkadam.feature_flag_service.exceptions.UnauthorizedException;
import com.shubhamkadam.feature_flag_service.modules.membership.Membership;
import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRepository;
import com.shubhamkadam.feature_flag_service.modules.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrganizationContextInterceptor implements HandlerInterceptor {

    private final MembershipRepository membershipRepository;
    private static final String ORG_HEADER = "X-Organization-Id";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String path = request.getRequestURI();

        // Skip for auth, evaluation, and organization endpoints
        if (path.startsWith("/api/v1/auth") || path.startsWith("/api/v1/evaluate") || path.startsWith("/api/v1/org")) {
            return true;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            throw new UnauthorizedException("User not authenticated");
        }

        User user = (User) authentication.getPrincipal();
        String orgIdHeader = request.getHeader(ORG_HEADER);
        UUID organizationId = null;

        if (StringUtils.hasText(orgIdHeader)) {
            try {
                organizationId = UUID.fromString(orgIdHeader);
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid Organization ID format");
            }

            Membership membership = membershipRepository
                .findByIdOrganizationIdAndIdUserId(organizationId, user.getId())
                .orElseThrow(() -> new ForbiddenException("User does not have access to this organization"));

            OrganizationContextHolder.setContext(
                new OrganizationContextHolder.OrganizationContext(organizationId, membership.getRole())
            );
        } else {
            // Fallback to primary organization if exactly one exists, else throw BadRequest
            List<Membership> memberships = membershipRepository.findByIdUserId(user.getId());
            if (memberships.isEmpty()) {
                throw new ForbiddenException("User does not belong to any organization");
            } else if (memberships.size() == 1) {
                Membership membership = memberships.get(0);
                OrganizationContextHolder.setContext(
                    new OrganizationContextHolder.OrganizationContext(
                        membership.getOrganization().getId(),
                        membership.getRole()
                    )
                );
            } else {
                throw new BadRequestException(
                    "Multiple organizations found. Please specify " + ORG_HEADER + " header."
                );
            }
        }

        return true;
    }

    @Override
    public void afterCompletion(
        HttpServletRequest request,
        HttpServletResponse response,
        Object handler,
        Exception ex
    ) {
        OrganizationContextHolder.clearContext();
    }
}
