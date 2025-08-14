-- CaddieAI Database Migration V1.2.0
-- Create simplified Round and Location tables for basic golf score tracking

-- Create enum types for round data only
CREATE TYPE round_status AS ENUM ('not_started', 'in_progress', 'paused', 'completed', 'abandoned');

-- Rounds table - Simplified golf round tracking
CREATE TABLE rounds (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    round_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    current_hole INTEGER CHECK (current_hole >= 1 AND current_hole <= 18),
    status round_status DEFAULT 'not_started',
    total_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apply updated_at trigger to Rounds table
CREATE TRIGGER update_rounds_updated_at 
    BEFORE UPDATE ON rounds 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Locations table - Basic GPS location tracking
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    round_id INTEGER REFERENCES rounds(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apply updated_at trigger to Locations table
CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON locations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create essential indexes only
CREATE INDEX idx_rounds_user_id ON rounds(user_id);
CREATE INDEX idx_rounds_course_id ON rounds(course_id);
CREATE INDEX idx_rounds_round_date ON rounds(round_date);
CREATE INDEX idx_rounds_status ON rounds(status);
CREATE INDEX idx_rounds_current_hole ON rounds(current_hole);
CREATE INDEX idx_rounds_user_date ON rounds(user_id, round_date);

CREATE INDEX idx_locations_user_id ON locations(user_id);
CREATE INDEX idx_locations_round_id ON locations(round_id);
CREATE INDEX idx_locations_course_id ON locations(course_id);
CREATE INDEX idx_locations_timestamp ON locations(timestamp);
CREATE INDEX idx_locations_round_timestamp ON locations(round_id, timestamp);

-- Add comments for simplified schema
COMMENT ON TABLE rounds IS 'Simplified golf round tracking for basic score management';
COMMENT ON COLUMN rounds.user_id IS 'Reference to the user playing this round';
COMMENT ON COLUMN rounds.course_id IS 'Reference to the golf course being played';
COMMENT ON COLUMN rounds.round_date IS 'Date when the round was played';
COMMENT ON COLUMN rounds.start_time IS 'When the round started';
COMMENT ON COLUMN rounds.end_time IS 'When the round finished';
COMMENT ON COLUMN rounds.current_hole IS 'Current hole being played (1-18)';
COMMENT ON COLUMN rounds.status IS 'Current status of the round';
COMMENT ON COLUMN rounds.total_score IS 'Total score for completed rounds';

COMMENT ON TABLE locations IS 'Basic GPS location tracking during rounds';
COMMENT ON COLUMN locations.user_id IS 'Reference to the user who recorded this location';
COMMENT ON COLUMN locations.round_id IS 'Reference to the round when this location was recorded';
COMMENT ON COLUMN locations.course_id IS 'Reference to the course where this location was recorded';
COMMENT ON COLUMN locations.latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN locations.longitude IS 'GPS longitude coordinate';
COMMENT ON COLUMN locations.timestamp IS 'When the location was recorded';