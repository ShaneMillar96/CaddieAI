-- CaddieAI Database Migration V1.1.0
-- Create Course and Hole tables with enhanced features and simplified structure

-- Create enum type for hole data (removed course_difficulty as no longer needed)
CREATE TYPE hole_type AS ENUM ('par3', 'par4', 'par5');

-- Courses table - Simplified user-driven course information
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    location GEOMETRY(POINT, 4326),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apply updated_at trigger to Courses table
CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Holes table - Simplified user-driven hole information
CREATE TABLE holes (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    hole_number INTEGER NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
    par INTEGER CHECK (par >= 3 AND par <= 5),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, hole_number)
);

-- Apply updated_at trigger to Holes table
CREATE TRIGGER update_holes_updated_at 
    BEFORE UPDATE ON holes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_courses_name ON courses(name);
CREATE INDEX idx_courses_location ON courses USING GIST(location);
CREATE INDEX idx_courses_user_id ON courses(user_id);

CREATE INDEX idx_holes_course_id ON holes(course_id);
CREATE INDEX idx_holes_hole_number ON holes(hole_number);
CREATE INDEX idx_holes_par ON holes(par);
CREATE INDEX idx_holes_user_id ON holes(user_id);

-- Add comments for documentation
COMMENT ON TABLE courses IS 'User-driven golf course information with basic location data';
COMMENT ON COLUMN courses.location IS 'Course location point (user-provided)';
COMMENT ON COLUMN courses.user_id IS 'User who created/owns this course';

COMMENT ON TABLE holes IS 'User-driven hole information with progressive data capture';
COMMENT ON COLUMN holes.par IS 'Par value for hole (captured during gameplay)';
COMMENT ON COLUMN holes.user_id IS 'User who created/owns this hole';