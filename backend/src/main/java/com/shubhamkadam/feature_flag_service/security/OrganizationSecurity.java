package com.shubhamkadam.feature_flag_service.security;

import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRole;
import org.springframework.stereotype.Component;

@Component("organizationSecurity")
public class OrganizationSecurity {

    public boolean isAdmin() {
        OrganizationContextHolder.OrganizationContext context = OrganizationContextHolder.getContext();
        return context != null && context.getRole() == MembershipRole.ADMIN;
    }

    public boolean isMemberOrAdmin() {
        OrganizationContextHolder.OrganizationContext context = OrganizationContextHolder.getContext();
        return context != null && (context.getRole() == MembershipRole.MEMBER || context.getRole() == MembershipRole.ADMIN);
    }
}
