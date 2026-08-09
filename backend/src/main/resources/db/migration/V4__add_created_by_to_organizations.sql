-- Flyway Migration: V4__add_created_by_to_organizations.sql
-- Add created_by column to organizations table to track the user who created the organization

ALTER TABLE organizations 
    ADD COLUMN created_by UUID;

-- Since there might be existing organizations from registration, we don't enforce NOT NULL yet at the DB level,
-- or you can update existing rows and then add NOT NULL if needed. 

ALTER TABLE organizations
    ADD CONSTRAINT fk_organizations_created_by
    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE RESTRICT;
