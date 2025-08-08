-- CaddieAI Database Migration V1.11.0
-- Create Shot Placements table for interactive shot placement mode
-- This table stores user-placed target locations on the golf course for shot planning

-- Shot Placements table - Interactive shot target placement system
CREATE TABLE shot_placements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    hole_id INTEGER REFERENCES holes(id) ON DELETE SET NULL,
    
    -- Target location coordinates (PostGIS Point geometry)
    shot_location GEOMETRY(POINT, 4326) NOT NULL,
    
    -- Optional actual shot landing location
    actual_shot_location GEOMETRY(POINT, 4326),
    
    -- Distance calculations
    distance_to_pin_yards INTEGER,
    distance_from_current_yards INTEGER NOT NULL,
    
    -- GPS accuracy and club information
    accuracy_meters DECIMAL(6,2),
    club_recommendation VARCHAR(50),
    club_used VARCHAR(50),
    
    -- Shot placement status and completion
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional metadata for context and debugging
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apply updated_at trigger
CREATE TRIGGER update_shot_placements_updated_at 
    BEFORE UPDATE ON shot_placements 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create performance indexes
CREATE INDEX idx_shot_placements_user_id ON shot_placements(user_id);
CREATE INDEX idx_shot_placements_round_id ON shot_placements(round_id);
CREATE INDEX idx_shot_placements_hole_id ON shot_placements(hole_id);
CREATE INDEX idx_shot_placements_round_hole ON shot_placements(round_id, hole_id);
CREATE INDEX idx_shot_placements_user_round ON shot_placements(user_id, round_id);
CREATE INDEX idx_shot_placements_shot_location ON shot_placements USING GIST(shot_location);
CREATE INDEX idx_shot_placements_actual_shot_location ON shot_placements USING GIST(actual_shot_location);
CREATE INDEX idx_shot_placements_distance_from_current ON shot_placements(distance_from_current_yards);
CREATE INDEX idx_shot_placements_distance_to_pin ON shot_placements(distance_to_pin_yards);
CREATE INDEX idx_shot_placements_club_recommendation ON shot_placements(club_recommendation);
CREATE INDEX idx_shot_placements_club_used ON shot_placements(club_used);
CREATE INDEX idx_shot_placements_is_completed ON shot_placements(is_completed);
CREATE INDEX idx_shot_placements_completed_at ON shot_placements(completed_at);
CREATE INDEX idx_shot_placements_created_at ON shot_placements(created_at);

-- Composite index for recent shots query
CREATE INDEX idx_shot_placements_user_recent ON shot_placements(user_id, created_at DESC);

-- Add table and column comments for documentation
COMMENT ON TABLE shot_placements IS 'Interactive shot placement system for golf shot planning and targeting';
COMMENT ON COLUMN shot_placements.shot_location IS 'PostGIS Point geometry of the target location selected by user';
COMMENT ON COLUMN shot_placements.actual_shot_location IS 'PostGIS Point geometry where the ball actually landed (optional)';
COMMENT ON COLUMN shot_placements.distance_to_pin_yards IS 'Distance from target location to hole pin in yards';
COMMENT ON COLUMN shot_placements.distance_from_current_yards IS 'Distance from user current location to target in yards';
COMMENT ON COLUMN shot_placements.accuracy_meters IS 'GPS accuracy in meters when shot was placed';
COMMENT ON COLUMN shot_placements.club_recommendation IS 'AI-recommended club for this distance';
COMMENT ON COLUMN shot_placements.club_used IS 'Actual club used by player (user input)';
COMMENT ON COLUMN shot_placements.is_completed IS 'Whether the shot has been taken and completed';
COMMENT ON COLUMN shot_placements.completed_at IS 'Timestamp when shot was marked as completed';
COMMENT ON COLUMN shot_placements.metadata IS 'Additional JSON metadata for context, conditions, and debugging';

-- Create check constraints for data validation
ALTER TABLE shot_placements ADD CONSTRAINT chk_distance_from_current_positive 
    CHECK (distance_from_current_yards >= 0);
    
ALTER TABLE shot_placements ADD CONSTRAINT chk_distance_to_pin_positive 
    CHECK (distance_to_pin_yards IS NULL OR distance_to_pin_yards >= 0);
    
ALTER TABLE shot_placements ADD CONSTRAINT chk_accuracy_positive 
    CHECK (accuracy_meters IS NULL OR accuracy_meters >= 0);

ALTER TABLE shot_placements ADD CONSTRAINT chk_completed_at_logic 
    CHECK (
        (is_completed = TRUE AND completed_at IS NOT NULL) OR 
        (is_completed = FALSE AND completed_at IS NULL) OR
        (is_completed = TRUE AND completed_at IS NULL)
    );