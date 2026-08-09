-- Flyway Migration: V2__add_created_by_to_projects.sql
-- Add created_by column to projects table to track the user who created the project

-- Note: We are setting it to NOT NULL. Since this is early development, 
-- if there are existing records, you will need to either truncate the table 
-- or provide a default value. If you need to support existing records, 
-- you can remove NOT NULL here or set a default.
ALTER TABLE projects 
    ADD COLUMN created_by UUID NOT NULL;

ALTER TABLE projects
    ADD CONSTRAINT fk_projects_created_by
    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE RESTRICT;
