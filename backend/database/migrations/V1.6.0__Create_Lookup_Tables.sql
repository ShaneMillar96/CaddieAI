-- V1.6.0: Create lookup tables for skill levels and user statuses
-- Replace enum columns with foreign key relationships

-- Create skill_levels lookup table
CREATE TABLE SkillLevels (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Insert skill level data
INSERT INTO SkillLevels (id, name, description) VALUES 
(1, 'Beginner', 'New to golf'),
(2, 'Intermediate', 'Some experience'),
(3, 'Advanced', 'Skilled player'),
(4, 'Professional', 'Expert level');

-- Create user_statuses lookup table
CREATE TABLE UserStatuses (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Insert user status data
INSERT INTO UserStatuses (id, name, description) VALUES 
(1, 'Active', 'Active user account'),
(2, 'Inactive', 'Inactive user account'),
(3, 'Suspended', 'Suspended user account');

-- Add new foreign key columns to Users table
ALTER TABLE Users 
ADD COLUMN skill_level_id INTEGER DEFAULT 1,
ADD COLUMN status_id INTEGER DEFAULT 1;

-- Update existing data (if any) - map enum values to integer IDs
-- PostgreSQL enum values are referenced directly, not as strings
UPDATE Users SET 
    skill_level_id = CASE 
        WHEN skill_level::text = 'Beginner' THEN 1
        WHEN skill_level::text = 'Intermediate' THEN 2
        WHEN skill_level::text = 'Advanced' THEN 3
        WHEN skill_level::text = 'Professional' THEN 4
        ELSE 1
    END,
    status_id = CASE 
        WHEN status::text = 'Active' THEN 1
        WHEN status::text = 'Inactive' THEN 2
        WHEN status::text = 'Suspended' THEN 3
        ELSE 1
    END
WHERE skill_level IS NOT NULL OR status IS NOT NULL;

-- Add foreign key constraints
ALTER TABLE Users 
ADD CONSTRAINT fk_users_skill_level 
    FOREIGN KEY (skill_level_id) REFERENCES SkillLevels(id),
ADD CONSTRAINT fk_users_status 
    FOREIGN KEY (status_id) REFERENCES UserStatuses(id);

-- Make the new columns NOT NULL
ALTER TABLE Users 
ALTER COLUMN skill_level_id SET NOT NULL,
ALTER COLUMN status_id SET NOT NULL;

-- Drop old enum columns (if they exist)
-- Note: Only drop if they exist to avoid errors
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'skill_level') THEN
        ALTER TABLE Users DROP COLUMN skill_level;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'status') THEN
        ALTER TABLE Users DROP COLUMN status;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX idx_skill_levels_name ON SkillLevels(name);
CREATE INDEX idx_user_statuses_name ON UserStatuses(name);
CREATE INDEX idx_users_skill_level_id ON Users(skill_level_id);
CREATE INDEX idx_users_status_id ON Users(status_id);

-- Drop old enum types (if they exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'skill_level') THEN
        DROP TYPE skill_level CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        DROP TYPE user_status CASCADE;
    END IF;
END $$;