-- V1.16.0: Create user_courses table for user-driven course management
-- This table allows users to add courses they detect via Mapbox Places API without needing pre-existing courses table

-- Create user_courses table
CREATE TABLE user_courses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    city VARCHAR(100), 
    state VARCHAR(100),
    country VARCHAR(100),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    location geometry(Point,4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_user_courses_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX idx_user_courses_course_name ON user_courses(course_name);
CREATE INDEX idx_user_courses_location ON user_courses USING GIST(location);
CREATE INDEX idx_user_courses_created_at ON user_courses(created_at);

-- Create composite unique index to prevent duplicate course names per user
CREATE UNIQUE INDEX idx_user_courses_user_course_unique ON user_courses(user_id, course_name);

-- Create trigger to automatically update location point from latitude/longitude
CREATE OR REPLACE FUNCTION update_user_course_location() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_user_courses_update_location
    BEFORE INSERT OR UPDATE ON user_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_user_course_location();

-- Create trigger for automatic updated_at timestamp
CREATE TRIGGER tr_user_courses_updated_at
    BEFORE UPDATE ON user_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add table comment for documentation
COMMENT ON TABLE user_courses IS 'User-specific golf courses added through Mapbox Places API detection, independent of the main courses table';
COMMENT ON COLUMN user_courses.user_id IS 'Foreign key reference to users table';
COMMENT ON COLUMN user_courses.course_name IS 'Name of the golf course as entered by user or detected via Mapbox';
COMMENT ON COLUMN user_courses.address IS 'Full street address of the course';
COMMENT ON COLUMN user_courses.city IS 'City where the course is located';
COMMENT ON COLUMN user_courses.state IS 'State/province where the course is located';
COMMENT ON COLUMN user_courses.country IS 'Country where the course is located';
COMMENT ON COLUMN user_courses.latitude IS 'Course latitude coordinate (decimal degrees)';
COMMENT ON COLUMN user_courses.longitude IS 'Course longitude coordinate (decimal degrees)';
COMMENT ON COLUMN user_courses.location IS 'PostGIS Point geometry for spatial queries and distance calculations';

-- Rollback instructions (for reference):
-- To rollback this migration, execute:
-- DROP TRIGGER IF EXISTS tr_user_courses_updated_at ON user_courses;
-- DROP TRIGGER IF EXISTS tr_user_courses_update_location ON user_courses;
-- DROP FUNCTION IF EXISTS update_user_course_location();
-- DROP INDEX IF EXISTS idx_user_courses_user_course_unique;
-- DROP INDEX IF EXISTS idx_user_courses_created_at;
-- DROP INDEX IF EXISTS idx_user_courses_location;
-- DROP INDEX IF EXISTS idx_user_courses_course_name;
-- DROP INDEX IF EXISTS idx_user_courses_user_id;
-- DROP TABLE IF EXISTS user_courses;