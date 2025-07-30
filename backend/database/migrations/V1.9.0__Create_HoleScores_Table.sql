-- CaddieAI Database Migration V1.9.0
-- Create HoleScores table for individual hole performance tracking

-- HoleScores table - Individual hole scoring and performance metrics
CREATE TABLE hole_scores (
    id SERIAL PRIMARY KEY,
    round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    hole_id INTEGER NOT NULL REFERENCES holes(id) ON DELETE CASCADE,
    hole_number INTEGER NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
    score INTEGER CHECK (score >= 1),
    putts INTEGER CHECK (putts >= 0),
    fairway_hit BOOLEAN DEFAULT NULL,
    green_in_regulation BOOLEAN DEFAULT NULL,
    up_and_down BOOLEAN DEFAULT NULL,
    sand_save BOOLEAN DEFAULT NULL,
    penalty_strokes INTEGER DEFAULT 0 CHECK (penalty_strokes >= 0),
    distance_to_pin_yards INTEGER CHECK (distance_to_pin_yards >= 0),
    club_used VARCHAR(50),
    lie_position VARCHAR(20) CHECK (lie_position IN ('tee', 'fairway', 'rough', 'sand', 'water', 'trees', 'cart_path')),
    shot_notes TEXT,
    performance_notes TEXT,
    hole_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(round_id, hole_number)
);

-- Apply updated_at trigger to HoleScores table
CREATE TRIGGER update_holescores_updated_at 
    BEFORE UPDATE ON hole_scores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_holescores_round_id ON hole_scores(round_id);
CREATE INDEX idx_holescores_hole_id ON hole_scores(hole_id);
CREATE INDEX idx_holescores_hole_number ON hole_scores(hole_number);
CREATE INDEX idx_holescores_score ON hole_scores(score);
CREATE INDEX idx_holescores_putts ON hole_scores(putts);
CREATE INDEX idx_holescores_fairway_hit ON hole_scores(fairway_hit);
CREATE INDEX idx_holescores_green_in_regulation ON hole_scores(green_in_regulation);
CREATE INDEX idx_holescores_round_hole ON hole_scores(round_id, hole_number);
CREATE INDEX idx_holescores_club_used ON hole_scores(club_used);
CREATE INDEX idx_holescores_lie_position ON hole_scores(lie_position);
CREATE INDEX idx_holescores_metadata ON hole_scores USING GIN(hole_metadata);

-- Add comments for documentation
COMMENT ON TABLE hole_scores IS 'Individual hole scoring and performance metrics for detailed round analysis';
COMMENT ON COLUMN hole_scores.round_id IS 'Reference to the golf round this hole score belongs to';
COMMENT ON COLUMN hole_scores.hole_id IS 'Reference to the specific hole being scored';
COMMENT ON COLUMN hole_scores.hole_number IS 'Hole number (1-18) for quick reference and validation';
COMMENT ON COLUMN hole_scores.score IS 'Total strokes taken on this hole';
COMMENT ON COLUMN hole_scores.putts IS 'Number of putts taken on the green';
COMMENT ON COLUMN hole_scores.fairway_hit IS 'Whether the fairway was hit in regulation (par 4/5 holes only)';
COMMENT ON COLUMN hole_scores.green_in_regulation IS 'Whether the green was reached in regulation strokes';
COMMENT ON COLUMN hole_scores.up_and_down IS 'Successfully got up and down when missing green in regulation';
COMMENT ON COLUMN hole_scores.sand_save IS 'Successfully saved par or better from a sand bunker';
COMMENT ON COLUMN hole_scores.penalty_strokes IS 'Number of penalty strokes incurred on this hole';
COMMENT ON COLUMN hole_scores.distance_to_pin_yards IS 'Final approach shot distance to pin in yards';
COMMENT ON COLUMN hole_scores.club_used IS 'Primary club used for approach shot or tee shot';
COMMENT ON COLUMN hole_scores.lie_position IS 'Lie position for the approach shot';
COMMENT ON COLUMN hole_scores.shot_notes IS 'Notes about specific shots taken on this hole';
COMMENT ON COLUMN hole_scores.performance_notes IS 'General performance notes and observations';
COMMENT ON COLUMN hole_scores.hole_metadata IS 'Additional hole-specific data stored as JSON';

-- Create a view for easier hole score queries with course information
CREATE VIEW hole_score_details AS
SELECT 
    hs.id,
    hs.round_id,
    hs.hole_id,
    hs.hole_number,
    hs.score,
    hs.putts,
    hs.fairway_hit,
    hs.green_in_regulation,
    hs.up_and_down,
    hs.sand_save,
    hs.penalty_strokes,
    hs.distance_to_pin_yards,
    hs.club_used,
    hs.lie_position,
    hs.shot_notes,
    hs.performance_notes,
    hs.hole_metadata,
    hs.created_at,
    hs.updated_at,
    h.par,
    h.yardage_white,
    h.stroke_index,
    h.hole_type,
    (hs.score - h.par) AS score_to_par,
    c.name AS course_name,
    r.round_date
FROM hole_scores hs
    INNER JOIN holes h ON hs.hole_id = h.id
    INNER JOIN courses c ON h.course_id = c.id
    INNER JOIN rounds r ON hs.round_id = r.id;

COMMENT ON VIEW hole_score_details IS 'Comprehensive view combining hole scores with course and round information for analysis';

-- Create a function to automatically populate hole scores when a round is started
CREATE OR REPLACE FUNCTION create_default_hole_scores(p_round_id INTEGER, p_course_id INTEGER)
RETURNS VOID AS $$
DECLARE
    hole_record RECORD;
BEGIN
    -- Insert default hole score records for all holes in the course
    FOR hole_record IN 
        SELECT id, hole_number 
        FROM holes 
        WHERE course_id = p_course_id 
        ORDER BY hole_number
    LOOP
        INSERT INTO hole_scores (round_id, hole_id, hole_number)
        VALUES (p_round_id, hole_record.id, hole_record.hole_number)
        ON CONFLICT (round_id, hole_number) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_default_hole_scores IS 'Creates default hole score records for all holes when a round is started';