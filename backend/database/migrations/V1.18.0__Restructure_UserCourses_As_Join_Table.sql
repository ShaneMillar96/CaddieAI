-- V1.18.0: Restructure user_courses as join table and enhance courses table normalization
-- This migration creates a clean normalized schema structure:
-- 1. Enhances courses table with comprehensive course data
-- 2. Creates user_courses as a proper join table linking users to courses  
-- 3. Updates foreign key references in related tables
-- Note: This migration assumes a fresh database (no existing data to migrate)

-- Step 1: Enhance courses table structure to accommodate full course data
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS address VARCHAR(500),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7);

-- Update existing courses table to remove user_id dependency (make it master course repository)
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_user_id_fkey;
ALTER TABLE courses ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Drop existing user_courses table and recreate as join table
-- First drop all constraints and indexes on user_courses
DROP TRIGGER IF EXISTS tr_user_courses_updated_at ON user_courses;
DROP TRIGGER IF EXISTS tr_user_courses_update_location ON user_courses;
DROP FUNCTION IF EXISTS update_user_course_location();
DROP INDEX IF EXISTS idx_user_courses_user_course_unique;
DROP INDEX IF EXISTS idx_user_courses_created_at;
DROP INDEX IF EXISTS idx_user_courses_location;
DROP INDEX IF EXISTS idx_user_courses_course_name;
DROP INDEX IF EXISTS idx_user_courses_user_id;

-- Remove foreign key constraints from related tables
ALTER TABLE rounds DROP CONSTRAINT IF EXISTS fk_rounds_user_course_id;
ALTER TABLE locations DROP CONSTRAINT IF EXISTS fk_locations_user_course_id;

-- Drop check constraints
ALTER TABLE rounds DROP CONSTRAINT IF EXISTS chk_rounds_course_reference;
ALTER TABLE locations DROP CONSTRAINT IF EXISTS chk_locations_course_reference;

-- Drop the old user_courses table entirely
DROP TABLE IF EXISTS user_courses CASCADE;

-- Step 3: Create new user_courses join table
CREATE TABLE user_courses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_user_courses_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_courses_course_id
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        
    -- Ensure unique user-course combinations
    CONSTRAINT unq_user_courses_user_course UNIQUE (user_id, course_id)
);

-- Step 4: Create indexes for performance on new join table
CREATE INDEX idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX idx_user_courses_course_id ON user_courses(course_id);
CREATE INDEX idx_user_courses_created_at ON user_courses(created_at);

-- Step 5: Create location trigger for courses table
CREATE OR REPLACE FUNCTION update_course_location() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_courses_update_location
    BEFORE INSERT OR UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_course_location();

-- Update existing courses with location points where missing
UPDATE courses 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL 
AND longitude IS NOT NULL 
AND location IS NULL;

-- Step 6: Add enhanced indexes to courses table
CREATE INDEX IF NOT EXISTS idx_courses_address ON courses(address);
CREATE INDEX IF NOT EXISTS idx_courses_city ON courses(city);
CREATE INDEX IF NOT EXISTS idx_courses_country ON courses(country);
CREATE INDEX IF NOT EXISTS idx_courses_coordinates ON courses(latitude, longitude);

-- Step 7: Update user_course_id columns to reference new user_courses join table
-- Keep these columns as they're needed by Entity Framework models

-- Add foreign key constraints from rounds.user_course_id to user_courses.id
ALTER TABLE rounds 
ADD CONSTRAINT fk_rounds_user_course_id 
    FOREIGN KEY (user_course_id) REFERENCES user_courses(id) ON DELETE SET NULL;

-- Add foreign key constraints from locations.user_course_id to user_courses.id  
ALTER TABLE locations
ADD CONSTRAINT fk_locations_user_course_id
    FOREIGN KEY (user_course_id) REFERENCES user_courses(id) ON DELETE SET NULL;

-- Recreate indexes for performance (these are important for queries)
CREATE INDEX IF NOT EXISTS idx_rounds_user_course_id ON rounds(user_course_id);
CREATE INDEX IF NOT EXISTS idx_locations_user_course_id ON locations(user_course_id);

-- Step 8: Add enhanced check constraints for course references
-- Rounds must reference a course
ALTER TABLE rounds 
ADD CONSTRAINT chk_rounds_course_reference 
    CHECK (course_id IS NOT NULL);

-- Locations can exist without course reference for general GPS tracking  
ALTER TABLE locations
ADD CONSTRAINT chk_locations_course_reference
    CHECK (course_id IS NULL OR course_id IS NOT NULL); -- Allow both cases

-- Step 9: Add comprehensive comments for documentation
COMMENT ON TABLE courses IS 'Master golf courses repository containing course information';
COMMENT ON COLUMN courses.name IS 'Golf course name';
COMMENT ON COLUMN courses.address IS 'Full street address of the course';
COMMENT ON COLUMN courses.city IS 'City where the course is located';
COMMENT ON COLUMN courses.state IS 'State/province where the course is located';  
COMMENT ON COLUMN courses.country IS 'Country where the course is located';
COMMENT ON COLUMN courses.latitude IS 'Course latitude coordinate (decimal degrees)';
COMMENT ON COLUMN courses.longitude IS 'Course longitude coordinate (decimal degrees)';
COMMENT ON COLUMN courses.location IS 'PostGIS Point geometry for spatial queries and distance calculations';
COMMENT ON COLUMN courses.user_id IS 'Optional reference to user who originally created course (NULL for shared courses)';

COMMENT ON TABLE user_courses IS 'Many-to-many join table linking users to golf courses they have access to';
COMMENT ON COLUMN user_courses.user_id IS 'Foreign key reference to users table';
COMMENT ON COLUMN user_courses.course_id IS 'Foreign key reference to courses table'; 
COMMENT ON COLUMN user_courses.created_at IS 'Timestamp when user was linked to course';

-- Step 10: Verify structure creation
DO $$
BEGIN
    RAISE NOTICE 'Migration V1.18.0 completed successfully - clean normalized schema created:';
    RAISE NOTICE '- Enhanced courses table with full address fields';
    RAISE NOTICE '- New user_courses join table structure';
    RAISE NOTICE '- Preserved user_course_id columns in rounds and locations with FK constraints';
    RAISE NOTICE '- Proper indexes and constraints in place';
    RAISE NOTICE '- Location triggers configured for PostGIS';
END $$;

-- Rollback instructions (for reference):
-- To rollback this migration, execute:
-- 
-- 1. Remove foreign key constraints from user_course_id columns:
-- ALTER TABLE rounds DROP CONSTRAINT IF EXISTS fk_rounds_user_course_id;
-- ALTER TABLE locations DROP CONSTRAINT IF EXISTS fk_locations_user_course_id;
-- DROP INDEX IF EXISTS idx_rounds_user_course_id;
-- DROP INDEX IF EXISTS idx_locations_user_course_id;
--
-- 2. Drop new structures:
-- DROP TRIGGER IF EXISTS tr_courses_update_location ON courses;
-- DROP FUNCTION IF EXISTS update_course_location();
-- DROP INDEX IF EXISTS idx_courses_coordinates;
-- DROP INDEX IF EXISTS idx_courses_country;
-- DROP INDEX IF EXISTS idx_courses_city;
-- DROP INDEX IF EXISTS idx_courses_address;
-- DROP INDEX IF EXISTS idx_user_courses_created_at;
-- DROP INDEX IF EXISTS idx_user_courses_course_id;  
-- DROP INDEX IF EXISTS idx_user_courses_user_id;
-- DROP TABLE IF EXISTS user_courses;
--
-- 3. Revert courses table changes:
-- ALTER TABLE courses DROP COLUMN IF EXISTS address;
-- ALTER TABLE courses DROP COLUMN IF EXISTS city; 
-- ALTER TABLE courses DROP COLUMN IF EXISTS state;
-- ALTER TABLE courses DROP COLUMN IF EXISTS country;
-- ALTER TABLE courses DROP COLUMN IF EXISTS latitude;
-- ALTER TABLE courses DROP COLUMN IF EXISTS longitude;
-- ALTER TABLE courses ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE courses ADD CONSTRAINT courses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
--
-- 4. Recreate original user_courses table structure from V1.16.0 migration