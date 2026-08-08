-- Flyway Migration: V1__create_core_domain.sql
-- Core Domain Schema for Feature Flag Service

-- -----------------------------------------------------------------------------
-- Global Trigger Function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. Users Table
-- -----------------------------------------------------------------------------
CREATE TABLE users
(
    id            UUID PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(320) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_users_email_active
    ON users (LOWER(email))
    WHERE deleted_at IS NULL;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 2. Organizations Table
-- -----------------------------------------------------------------------------
CREATE TABLE organizations
(
    id         UUID PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3. Organization Memberships Table
-- -----------------------------------------------------------------------------
CREATE TABLE organization_memberships
(
    organization_id UUID        NOT NULL,
    user_id         UUID        NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_organization_memberships
        PRIMARY KEY (organization_id, user_id),

    CONSTRAINT fk_membership_organization
        FOREIGN KEY (organization_id)
            REFERENCES organizations(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_membership_user
        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE,

    CONSTRAINT chk_membership_role
        CHECK (role IN ('ADMIN', 'MEMBER'))
);

CREATE INDEX idx_organization_memberships_user
    ON organization_memberships(user_id);

-- -----------------------------------------------------------------------------
-- 4. Projects Table
-- -----------------------------------------------------------------------------
CREATE TABLE projects
(
    id              UUID PRIMARY KEY,
    organization_id UUID         NOT NULL,
    name            VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMPTZ,

    CONSTRAINT fk_projects_organization
        FOREIGN KEY (organization_id)
            REFERENCES organizations(id)
            ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_projects_organization_name_active
    ON projects (organization_id, name)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_projects_organization
    ON projects(organization_id);

CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 5. Environments Table
-- -----------------------------------------------------------------------------
CREATE TABLE environments
(
    id              UUID PRIMARY KEY,
    project_id      UUID         NOT NULL,
    organization_id UUID         NOT NULL,
    name            VARCHAR(100) NOT NULL,
    api_key_prefix  VARCHAR(16)  NOT NULL,
    api_key_hash    VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMPTZ,

    CONSTRAINT fk_environments_project
        FOREIGN KEY (project_id)
            REFERENCES projects(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_environments_organization
        FOREIGN KEY (organization_id)
            REFERENCES organizations(id)
            ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_environments_project_name_active
    ON environments (project_id, name)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_environments_api_key_hash_active
    ON environments (api_key_hash)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_environments_project
    ON environments(project_id);

CREATE INDEX idx_environments_organization
    ON environments(organization_id);

CREATE TRIGGER trg_environments_updated_at
    BEFORE UPDATE ON environments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 6. Features Table
-- -----------------------------------------------------------------------------
CREATE TABLE features
(
    id          UUID PRIMARY KEY,
    project_id  UUID         NOT NULL,
    key         VARCHAR(100) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    type        VARCHAR(20)  NOT NULL DEFAULT 'BOOLEAN',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMPTZ,

    CONSTRAINT fk_features_project
        FOREIGN KEY (project_id)
            REFERENCES projects(id)
            ON DELETE CASCADE,

    CONSTRAINT chk_features_type
        CHECK (type IN ('BOOLEAN'))
);

CREATE UNIQUE INDEX uq_features_project_key_active
    ON features (project_id, key)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_features_project
    ON features(project_id);

CREATE TRIGGER trg_features_updated_at
    BEFORE UPDATE ON features
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 7. Feature States Table
-- -----------------------------------------------------------------------------
CREATE TABLE feature_states
(
    id                 UUID PRIMARY KEY,
    feature_id         UUID         NOT NULL,
    environment_id     UUID         NOT NULL,
    organization_id    UUID         NOT NULL,
    enabled            BOOLEAN      NOT NULL DEFAULT FALSE,
    value              JSONB,
    rollout_percentage NUMERIC(5,2),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by         UUID,

    CONSTRAINT fk_feature_states_feature
        FOREIGN KEY (feature_id)
            REFERENCES features(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_feature_states_environment
        FOREIGN KEY (environment_id)
            REFERENCES environments(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_feature_states_organization
        FOREIGN KEY (organization_id)
            REFERENCES organizations(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_feature_states_updated_by
        FOREIGN KEY (updated_by)
            REFERENCES users(id)
            ON DELETE SET NULL,

    CONSTRAINT uq_feature_states_feature_environment
        UNIQUE (feature_id, environment_id),

    CONSTRAINT chk_feature_states_rollout_percentage
        CHECK (
            rollout_percentage IS NULL
            OR (rollout_percentage >= 0 AND rollout_percentage <= 100)
        )
);

CREATE INDEX idx_feature_states_feature
    ON feature_states(feature_id);

CREATE INDEX idx_feature_states_environment
    ON feature_states(environment_id);

CREATE INDEX idx_feature_states_organization
    ON feature_states(organization_id);

CREATE TRIGGER trg_feature_states_updated_at
    BEFORE UPDATE ON feature_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 8. Audit Logs Table (Preserves audit history across resource deletions)
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs
(
    id              UUID PRIMARY KEY,
    organization_id UUID         NOT NULL,
    environment_id  UUID,
    feature_id      UUID,
    user_id         UUID,
    action          VARCHAR(50)  NOT NULL,
    old_value       JSONB,
    new_value       JSONB,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_logs_organization
        FOREIGN KEY (organization_id)
            REFERENCES organizations(id)
            ON DELETE RESTRICT,

    CONSTRAINT fk_audit_logs_environment
        FOREIGN KEY (environment_id)
            REFERENCES environments(id)
            ON DELETE SET NULL,

    CONSTRAINT fk_audit_logs_feature
        FOREIGN KEY (feature_id)
            REFERENCES features(id)
            ON DELETE SET NULL,

    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_organization_created
    ON audit_logs(organization_id, created_at DESC);

CREATE INDEX idx_audit_logs_feature_created
    ON audit_logs(feature_id, created_at DESC);

CREATE INDEX idx_audit_logs_environment_created
    ON audit_logs(environment_id, created_at DESC);

CREATE INDEX idx_audit_logs_user_created
    ON audit_logs(user_id, created_at DESC);