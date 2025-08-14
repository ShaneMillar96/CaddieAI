-- CaddieAI Database Migration V1.9.0
-- Create HoleScores table for simple hole score tracking

-- HoleScores table - Simple hole scoring for user-driven course management
CREATE TABLE hole_scores (
    id SERIAL PRIMARY KEY,
    round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    hole_id INTEGER NOT NULL REFERENCES holes(id) ON DELETE CASCADE,
    hole_number INTEGER NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
    score INTEGER CHECK (score >= 1),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX idx_holescores_user_id ON hole_scores(user_id);
CREATE INDEX idx_holescores_hole_number ON hole_scores(hole_number);
CREATE INDEX idx_holescores_score ON hole_scores(score);
CREATE INDEX idx_holescores_round_hole ON hole_scores(round_id, hole_number);

-- Add comments for documentation
COMMENT ON TABLE hole_scores IS 'Simple hole scoring for user-driven course management';
COMMENT ON COLUMN hole_scores.round_id IS 'Reference to the golf round this hole score belongs to';
COMMENT ON COLUMN hole_scores.hole_id IS 'Reference to the specific hole being scored';
COMMENT ON COLUMN hole_scores.hole_number IS 'Hole number (1-18) for quick reference and validation';
COMMENT ON COLUMN hole_scores.score IS 'Total strokes taken on this hole';
COMMENT ON COLUMN hole_scores.user_id IS 'Reference to the user who recorded this score';

-- Ultra-simplified schema - removing complex view and function for basic scoring only
-- 
-- REMOVED FOR SIMPLIFICATION:
-- - hole_score_details view (complex joins with multiple tables)
-- - create_default_hole_scores function (auto-population complexity)
-- 
-- REASONING: 
-- Ultra-simplified approach uses basic hole_scores table only.
-- Applications can query directly or create simple joins as needed.
-- No complex stored procedures or views needed for basic score tracking.