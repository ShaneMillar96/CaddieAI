-- CaddieAI Database Migration V1.1.0
-- Create Course and Hole tables with enhanced features and simplified structure

-- Create enum types for course and hole data
CREATE TYPE course_difficulty AS ENUM ('easy', 'moderate', 'difficult', 'championship');
CREATE TYPE hole_type AS ENUM ('par3', 'par4', 'par5');

-- Courses table - Golf course information with geospatial data
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(255),
    email VARCHAR(255),
    par_total INTEGER NOT NULL CHECK (par_total >= 54 AND par_total <= 90),
    total_holes INTEGER NOT NULL DEFAULT 18 CHECK (total_holes IN (9, 18, 27, 36)),
    yardage_total INTEGER CHECK (yardage_total > 0),
    course_rating DECIMAL(3,1) CHECK (course_rating >= 60 AND course_rating <= 80),
    slope_rating INTEGER CHECK (slope_rating >= 55 AND slope_rating <= 155),
    difficulty course_difficulty DEFAULT 'moderate',
    location GEOMETRY(POINT, 4326),
    boundary GEOMETRY(POLYGON, 4326),
    timezone VARCHAR(50) DEFAULT 'UTC',
    green_fee_range JSONB DEFAULT '{}',
    amenities JSONB DEFAULT '{}',
    course_metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apply updated_at trigger to courses table
CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Holes table - Individual hole information with enhanced data and simplified hazards
CREATE TABLE holes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    hole_number INTEGER NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
    name VARCHAR(100),
    par INTEGER NOT NULL CHECK (par >= 3 AND par <= 5),
    hole_type hole_type NOT NULL,
    yardage_black INTEGER CHECK (yardage_black > 0),
    yardage_blue INTEGER CHECK (yardage_blue > 0),
    yardage_white INTEGER CHECK (yardage_white > 0),
    yardage_red INTEGER CHECK (yardage_red > 0),
    stroke_index INTEGER CHECK (stroke_index >= 1 AND stroke_index <= 18),
    ladies_yardage INTEGER CHECK (ladies_yardage > 0),
    ladies_par INTEGER CHECK (ladies_par >= 3 AND ladies_par <= 5),
    ladies_stroke_index INTEGER CHECK (ladies_stroke_index >= 1 AND ladies_stroke_index <= 18),
    tee_location GEOMETRY(POINT, 4326),
    pin_location GEOMETRY(POINT, 4326),
    hole_layout GEOMETRY(POLYGON, 4326),
    fairway_center_line GEOMETRY(LINESTRING, 4326),
    hole_description TEXT,
    hole_tips TEXT,
    simple_hazards JSONB DEFAULT '[]',
    playing_tips TEXT,
    hole_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, hole_number)
);

-- Apply updated_at trigger to holes table
CREATE TRIGGER update_holes_updated_at 
    BEFORE UPDATE ON holes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_courses_name ON courses(name);
CREATE INDEX idx_courses_location ON courses USING GIST(location);
CREATE INDEX idx_courses_boundary ON courses USING GIST(boundary);
CREATE INDEX idx_courses_difficulty ON courses(difficulty);
CREATE INDEX idx_courses_par_total ON courses(par_total);
CREATE INDEX idx_courses_is_active ON courses(is_active);
CREATE INDEX idx_courses_amenities ON courses USING GIN(amenities);

CREATE INDEX idx_holes_course_id ON holes(course_id);
CREATE INDEX idx_holes_hole_number ON holes(hole_number);
CREATE INDEX idx_holes_par ON holes(par);
CREATE INDEX idx_holes_hole_type ON holes(hole_type);
CREATE INDEX idx_holes_stroke_index ON holes(stroke_index);
CREATE INDEX idx_holes_ladies_par ON holes(ladies_par);
CREATE INDEX idx_holes_tee_location ON holes USING GIST(tee_location);
CREATE INDEX idx_holes_pin_location ON holes USING GIST(pin_location);
CREATE INDEX idx_holes_hole_layout ON holes USING GIST(hole_layout);
CREATE INDEX idx_holes_fairway_center_line ON holes USING GIST(fairway_center_line);
CREATE INDEX idx_holes_simple_hazards ON holes USING GIN(simple_hazards);

-- Add comments for documentation
COMMENT ON TABLE courses IS 'Golf course information with geospatial data and metadata';
COMMENT ON COLUMN courses.location IS 'Primary course location point (clubhouse/pro shop)';
COMMENT ON COLUMN courses.boundary IS 'Course boundary polygon for geofencing';
COMMENT ON COLUMN courses.course_rating IS 'USGA course rating for scratch golfer';
COMMENT ON COLUMN courses.slope_rating IS 'USGA slope rating (55-155 range)';
COMMENT ON COLUMN courses.green_fee_range IS 'Pricing information stored as JSON';
COMMENT ON COLUMN courses.amenities IS 'Available amenities and facilities';

COMMENT ON TABLE holes IS 'Individual hole information with enhanced data and playing tips';
COMMENT ON COLUMN holes.hole_type IS 'Par classification for the hole';
COMMENT ON COLUMN holes.stroke_index IS 'Hole difficulty ranking (1-18) for handicap calculations';
COMMENT ON COLUMN holes.ladies_yardage IS 'Yardage from ladies tees';
COMMENT ON COLUMN holes.ladies_par IS 'Par for ladies tees';
COMMENT ON COLUMN holes.ladies_stroke_index IS 'Ladies tee difficulty ranking (1-18)';
COMMENT ON COLUMN holes.tee_location IS 'Tee box center point';
COMMENT ON COLUMN holes.pin_location IS 'Green/pin location point';
COMMENT ON COLUMN holes.hole_layout IS 'Complete hole boundary including fairway, rough, and green';
COMMENT ON COLUMN holes.fairway_center_line IS 'Optimal playing line from tee to green';
COMMENT ON COLUMN holes.hole_tips IS 'Official playing tips and strategy advice for the hole';
COMMENT ON COLUMN holes.simple_hazards IS 'Simplified hazard information stored as JSON array';
COMMENT ON COLUMN holes.playing_tips IS 'Additional strategic advice for playing the hole';