-- V1.17.0: Add user_course_id columns to rounds and locations tables
-- This allows rounds and locations to reference user_courses table in addition to existing courses table

-- Add user_course_id column to rounds table
ALTER TABLE rounds 
ADD COLUMN user_course_id INTEGER,
ADD CONSTRAINT fk_rounds_user_course_id 
    FOREIGN KEY (user_course_id) REFERENCES user_courses(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_rounds_user_course_id ON rounds(user_course_id);

-- Add user_course_id column to locations table  
ALTER TABLE locations
ADD COLUMN user_course_id INTEGER,
ADD CONSTRAINT fk_locations_user_course_id
    FOREIGN KEY (user_course_id) REFERENCES user_courses(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_locations_user_course_id ON locations(user_course_id);

-- Add comments for documentation
COMMENT ON COLUMN rounds.user_course_id IS 'Optional foreign key reference to user_courses table for user-defined courses';
COMMENT ON COLUMN locations.user_course_id IS 'Optional foreign key reference to user_courses table for user-defined courses';

-- Add check constraints to ensure either course_id or user_course_id is set (but not both)
-- For rounds table
ALTER TABLE rounds 
ADD CONSTRAINT chk_rounds_course_reference 
    CHECK (
        (course_id IS NOT NULL AND user_course_id IS NULL) OR 
        (course_id IS NULL AND user_course_id IS NOT NULL)
    );

-- For locations table (locations can exist without course reference for general GPS tracking)
ALTER TABLE locations
ADD CONSTRAINT chk_locations_course_reference
    CHECK (
        (course_id IS NULL AND user_course_id IS NULL) OR
        (course_id IS NOT NULL AND user_course_id IS NULL) OR
        (course_id IS NULL AND user_course_id IS NOT NULL)
    );

-- Rollback instructions (for reference):
-- To rollback this migration, execute:
-- ALTER TABLE locations DROP CONSTRAINT IF EXISTS chk_locations_course_reference;
-- ALTER TABLE rounds DROP CONSTRAINT IF EXISTS chk_rounds_course_reference;
-- DROP INDEX IF EXISTS idx_locations_user_course_id;
-- ALTER TABLE locations DROP CONSTRAINT IF EXISTS fk_locations_user_course_id;
-- ALTER TABLE locations DROP COLUMN IF EXISTS user_course_id;
-- DROP INDEX IF EXISTS idx_rounds_user_course_id; 
-- ALTER TABLE rounds DROP CONSTRAINT IF EXISTS fk_rounds_user_course_id;
-- ALTER TABLE rounds DROP COLUMN IF EXISTS user_course_id;