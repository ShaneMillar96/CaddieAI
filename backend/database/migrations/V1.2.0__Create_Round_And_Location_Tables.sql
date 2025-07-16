-- CaddieAI Database Migration V1.2.0
-- Create Round and Location tables with enhanced real-time tracking capabilities

-- Create enum types for round and location data
CREATE TYPE round_status AS ENUM ('not_started', 'in_progress', 'paused', 'completed', 'abandoned');
CREATE TYPE weather_condition AS ENUM ('sunny', 'cloudy', 'overcast', 'light_rain', 'heavy_rain', 'windy', 'stormy');

-- Rounds table - Individual golf round tracking
CREATE TABLE rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    round_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    current_hole INTEGER CHECK (current_hole >= 1 AND current_hole <= 18),
    status round_status DEFAULT 'not_started',
    total_score INTEGER,
    total_putts INTEGER,
    fairways_hit INTEGER DEFAULT 0 CHECK (fairways_hit >= 0 AND fairways_hit <= 18),
    greens_in_regulation INTEGER DEFAULT 0 CHECK (greens_in_regulation >= 0 AND greens_in_regulation <= 18),
    weather_condition weather_condition,
    temperature_celsius DECIMAL(4,1),
    wind_speed_kmh DECIMAL(4,1),
    notes TEXT,
    round_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apply updated_at trigger to rounds table
CREATE TRIGGER update_rounds_updated_at 
    BEFORE UPDATE ON rounds 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Locations table - Enhanced real-time GPS tracking with distance calculations and course position awareness
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    altitude_meters DECIMAL(6,2),
    accuracy_meters DECIMAL(6,2),
    heading_degrees DECIMAL(5,2) CHECK (heading_degrees >= 0 AND heading_degrees < 360),
    speed_mps DECIMAL(5,2),
    current_hole_detected INTEGER CHECK (current_hole_detected >= 1 AND current_hole_detected <= 18),
    distance_to_tee_meters DECIMAL(6,2),
    distance_to_pin_meters DECIMAL(6,2),
    position_on_hole VARCHAR(20) CHECK (position_on_hole IN ('tee', 'fairway', 'rough', 'green', 'hazard', 'unknown')),
    movement_speed_mps DECIMAL(4,2),
    course_boundary_status BOOLEAN DEFAULT FALSE,
    last_shot_location GEOMETRY(POINT, 4326),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apply updated_at trigger to locations table
CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON locations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_rounds_user_id ON rounds(user_id);
CREATE INDEX idx_rounds_course_id ON rounds(course_id);
CREATE INDEX idx_rounds_round_date ON rounds(round_date);
CREATE INDEX idx_rounds_status ON rounds(status);
CREATE INDEX idx_rounds_current_hole ON rounds(current_hole);
CREATE INDEX idx_rounds_weather_condition ON rounds(weather_condition);
CREATE INDEX idx_rounds_user_date ON rounds(user_id, round_date);

CREATE INDEX idx_locations_user_id ON locations(user_id);
CREATE INDEX idx_locations_round_id ON locations(round_id);
CREATE INDEX idx_locations_course_id ON locations(course_id);
CREATE INDEX idx_locations_timestamp ON locations(timestamp);
CREATE INDEX idx_locations_current_hole_detected ON locations(current_hole_detected);
CREATE INDEX idx_locations_distance_to_tee ON locations(distance_to_tee_meters);
CREATE INDEX idx_locations_distance_to_pin ON locations(distance_to_pin_meters);
CREATE INDEX idx_locations_position_on_hole ON locations(position_on_hole);
CREATE INDEX idx_locations_course_boundary_status ON locations(course_boundary_status);
CREATE INDEX idx_locations_last_shot_location ON locations USING GIST(last_shot_location);
CREATE INDEX idx_locations_round_timestamp ON locations(round_id, timestamp);

-- Add comments for documentation
COMMENT ON TABLE rounds IS 'Individual golf round tracking with status and performance metrics';
COMMENT ON COLUMN rounds.current_hole IS 'Current hole being played (1-18)';
COMMENT ON COLUMN rounds.fairways_hit IS 'Number of fairways hit in regulation';
COMMENT ON COLUMN rounds.greens_in_regulation IS 'Number of greens reached in regulation strokes';
COMMENT ON COLUMN rounds.weather_condition IS 'Weather during the round affecting play';
COMMENT ON COLUMN rounds.round_metadata IS 'Additional round information and settings';

COMMENT ON TABLE locations IS 'Enhanced real-time GPS tracking with distance calculations and course position awareness';
COMMENT ON COLUMN locations.latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN locations.longitude IS 'GPS longitude coordinate';
COMMENT ON COLUMN locations.accuracy_meters IS 'GPS accuracy in meters';
COMMENT ON COLUMN locations.current_hole_detected IS 'Auto-detected current hole based on GPS position';
COMMENT ON COLUMN locations.distance_to_tee_meters IS 'Real-time calculated distance to current hole tee';
COMMENT ON COLUMN locations.distance_to_pin_meters IS 'Real-time calculated distance to current hole pin';
COMMENT ON COLUMN locations.position_on_hole IS 'Current position on hole (tee, fairway, rough, green, hazard)';
COMMENT ON COLUMN locations.movement_speed_mps IS 'Player movement speed in meters per second';
COMMENT ON COLUMN locations.course_boundary_status IS 'Whether player is currently within course boundaries';
COMMENT ON COLUMN locations.last_shot_location IS 'Previous shot position for context';
COMMENT ON COLUMN locations.timestamp IS 'When the location was recorded';