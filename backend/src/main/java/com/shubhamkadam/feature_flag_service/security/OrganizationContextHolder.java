package com.shubhamkadam.feature_flag_service.security;

import com.shubhamkadam.feature_flag_service.modules.membership.MembershipRole;
import java.util.UUID;

public class OrganizationContextHolder {

    private static final ThreadLocal<OrganizationContext> contextHolder = new ThreadLocal<>();

    public static void setContext(OrganizationContext context) {
        contextHolder.set(context);
    }

    public static OrganizationContext getContext() {
        return contextHolder.get();
    }

    public static void clearContext() {
        contextHolder.remove();
    }

    public static UUID getCurrentOrganizationId() {
        OrganizationContext context = getContext();
        return context != null ? context.getOrganizationId() : null;
    }

    public static class OrganizationContext {

        private final UUID organizationId;
        private final MembershipRole role;

        public OrganizationContext(UUID organizationId, MembershipRole role) {
            this.organizationId = organizationId;
            this.role = role;
        }

        public UUID getOrganizationId() {
            return organizationId;
        }

        public MembershipRole getRole() {
            return role;
        }
    }
}
