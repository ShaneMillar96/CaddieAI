-- CaddieAI Database Migration V1.10.0
-- Create AI Integration tables for voice AI and shot tracking functionality

-- AI Conversations table - Store voice AI conversations for context and history
CREATE TABLE ai_conversations (
    id SERIAL PRIMARY KEY,
    round_id INTEGER REFERENCES rounds(id) ON DELETE CASCADE,
    user_input TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    context_data JSONB DEFAULT '{}',
    response_time_ms INTEGER,
    token_usage INTEGER,
    confidence_score DECIMAL(3,2) DEFAULT 0.8,
    conversation_type VARCHAR(50) DEFAULT 'voice' CHECK (conversation_type IN ('voice', 'text', 'auto')),
    requires_confirmation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apply updated_at trigger
CREATE TRIGGER update_ai_conversations_updated_at 
    BEFORE UPDATE ON ai_conversations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Shot Events table - Track individual golf shots with GPS data
CREATE TABLE shot_events (
    id SERIAL PRIMARY KEY,
    round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hole_number INTEGER NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
    shot_number INTEGER NOT NULL CHECK (shot_number >= 1),
    start_location GEOMETRY(POINT, 4326) NOT NULL,
    end_location GEOMETRY(POINT, 4326) NOT NULL,
    distance_meters DECIMAL(6,2) NOT NULL CHECK (distance_meters >= 0),
    estimated_club VARCHAR(50),
    shot_type VARCHAR(30) CHECK (shot_type IN ('tee_shot', 'approach', 'chip', 'putt', 'recovery', 'penalty')),
    lie_condition VARCHAR(30) CHECK (lie_condition IN ('tee', 'fairway', 'rough', 'sand', 'water', 'penalty')),
    shot_accuracy VARCHAR(20) CHECK (shot_accuracy IN ('perfect', 'good', 'average', 'poor', 'mishit')),
    movement_duration_seconds DECIMAL(5,2),
    detection_confidence DECIMAL(3,2) DEFAULT 0.8,
    auto_detected BOOLEAN DEFAULT TRUE,
    user_confirmed BOOLEAN DEFAULT FALSE,
    shot_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(round_id, hole_number, shot_number)
);

-- Apply updated_at trigger
CREATE TRIGGER update_shot_events_updated_at 
    BEFORE UPDATE ON shot_events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Location History table - Enhanced location tracking for shot detection
CREATE TABLE location_history (
    id SERIAL PRIMARY KEY,
    round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location GEOMETRY(POINT, 4326) NOT NULL,
    accuracy_meters DECIMAL(6,2),
    altitude_meters DECIMAL(7,2),
    heading_degrees DECIMAL(5,2) CHECK (heading_degrees >= 0 AND heading_degrees < 360),
    speed_mps DECIMAL(5,2),
    detected_hole INTEGER CHECK (detected_hole >= 1 AND detected_hole <= 18),
    distance_to_pin_meters DECIMAL(6,2),
    distance_to_tee_meters DECIMAL(6,2),
    position_on_hole VARCHAR(20) CHECK (position_on_hole IN ('tee', 'fairway', 'rough', 'green', 'hazard', 'unknown')),
    within_course_boundary BOOLEAN DEFAULT TRUE,
    movement_type VARCHAR(20) CHECK (movement_type IN ('walking', 'running', 'stationary', 'driving', 'unknown')) DEFAULT 'unknown',
    location_metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Context Updates table - Track AI context changes for debugging and optimization
CREATE TABLE ai_context_updates (
    id SERIAL PRIMARY KEY,
    round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    context_type VARCHAR(50) NOT NULL CHECK (context_type IN ('location', 'score', 'weather', 'course', 'performance')),
    previous_context JSONB,
    new_context JSONB NOT NULL,
    trigger_event VARCHAR(100),
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hole Completion Commentary table - Store AI-generated hole performance commentary
CREATE TABLE hole_completion_commentary (
    id SERIAL PRIMARY KEY,
    round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hole_number INTEGER NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 15),
    par INTEGER NOT NULL CHECK (par >= 3 AND par <= 5),
    commentary TEXT NOT NULL,
    performance_summary VARCHAR(100),
    score_description VARCHAR(50),
    encouragement_level INTEGER CHECK (encouragement_level >= 1 AND encouragement_level <= 5) DEFAULT 3,
    shot_count INTEGER,
    auto_generated BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(round_id, hole_number)
);

-- Create indexes for performance
CREATE INDEX idx_ai_conversations_round_id ON ai_conversations(round_id);
CREATE INDEX idx_ai_conversations_conversation_type ON ai_conversations(conversation_type);
CREATE INDEX idx_ai_conversations_created_at ON ai_conversations(created_at);
CREATE INDEX idx_ai_conversations_requires_confirmation ON ai_conversations(requires_confirmation);

CREATE INDEX idx_shot_events_round_id ON shot_events(round_id);
CREATE INDEX idx_shot_events_user_id ON shot_events(user_id);
CREATE INDEX idx_shot_events_hole_number ON shot_events(hole_number);
CREATE INDEX idx_shot_events_shot_number ON shot_events(shot_number);
CREATE INDEX idx_shot_events_round_hole ON shot_events(round_id, hole_number);
CREATE INDEX idx_shot_events_start_location ON shot_events USING GIST(start_location);
CREATE INDEX idx_shot_events_end_location ON shot_events USING GIST(end_location);
CREATE INDEX idx_shot_events_distance ON shot_events(distance_meters);
CREATE INDEX idx_shot_events_estimated_club ON shot_events(estimated_club);
CREATE INDEX idx_shot_events_shot_type ON shot_events(shot_type);
CREATE INDEX idx_shot_events_auto_detected ON shot_events(auto_detected);
CREATE INDEX idx_shot_events_user_confirmed ON shot_events(user_confirmed);
CREATE INDEX idx_shot_events_created_at ON shot_events(created_at);

CREATE INDEX idx_location_history_round_id ON location_history(round_id);
CREATE INDEX idx_location_history_user_id ON location_history(user_id);
CREATE INDEX idx_location_history_location ON location_history USING GIST(location);
CREATE INDEX idx_location_history_recorded_at ON location_history(recorded_at);
CREATE INDEX idx_location_history_detected_hole ON location_history(detected_hole);
CREATE INDEX idx_location_history_position_on_hole ON location_history(position_on_hole);
CREATE INDEX idx_location_history_within_boundary ON location_history(within_course_boundary);
CREATE INDEX idx_location_history_movement_type ON location_history(movement_type);
CREATE INDEX idx_location_history_round_recorded ON location_history(round_id, recorded_at);

CREATE INDEX idx_ai_context_updates_round_id ON ai_context_updates(round_id);
CREATE INDEX idx_ai_context_updates_user_id ON ai_context_updates(user_id);
CREATE INDEX idx_ai_context_updates_context_type ON ai_context_updates(context_type);
CREATE INDEX idx_ai_context_updates_created_at ON ai_context_updates(created_at);

CREATE INDEX idx_hole_completion_commentary_round_id ON hole_completion_commentary(round_id);
CREATE INDEX idx_hole_completion_commentary_user_id ON hole_completion_commentary(user_id);
CREATE INDEX idx_hole_completion_commentary_hole_number ON hole_completion_commentary(hole_number);
CREATE INDEX idx_hole_completion_commentary_score ON hole_completion_commentary(score);
CREATE INDEX idx_hole_completion_commentary_encouragement_level ON hole_completion_commentary(encouragement_level);

-- Add comments for documentation
COMMENT ON TABLE ai_conversations IS 'Voice AI conversations and responses during golf rounds';
COMMENT ON COLUMN ai_conversations.context_data IS 'JSON context data including location, course info, and player state';
COMMENT ON COLUMN ai_conversations.response_time_ms IS 'AI response generation time in milliseconds';
COMMENT ON COLUMN ai_conversations.confidence_score IS 'AI confidence in response accuracy (0.0-1.0)';
COMMENT ON COLUMN ai_conversations.conversation_type IS 'Type of conversation: voice, text, or auto-generated';

COMMENT ON TABLE shot_events IS 'Individual golf shots tracked via GPS movement analysis';
COMMENT ON COLUMN shot_events.start_location IS 'GPS location where shot was initiated';
COMMENT ON COLUMN shot_events.end_location IS 'GPS location where ball came to rest';
COMMENT ON COLUMN shot_events.detection_confidence IS 'Confidence level of automatic shot detection (0.0-1.0)';
COMMENT ON COLUMN shot_events.auto_detected IS 'Whether shot was automatically detected or manually entered';
COMMENT ON COLUMN shot_events.user_confirmed IS 'Whether user has confirmed the detected shot';

COMMENT ON TABLE location_history IS 'Detailed GPS location history for shot detection and course analysis';
COMMENT ON COLUMN location_history.recorded_at IS 'When the GPS location was recorded by device';
COMMENT ON COLUMN location_history.movement_type IS 'Type of movement detected at this location';
COMMENT ON COLUMN location_history.within_course_boundary IS 'Whether location is within course boundaries';

COMMENT ON TABLE ai_context_updates IS 'Track AI context changes for debugging and performance optimization';
COMMENT ON COLUMN ai_context_updates.trigger_event IS 'Event that triggered the context update';
COMMENT ON COLUMN ai_context_updates.processing_time_ms IS 'Time taken to process context update';

COMMENT ON TABLE hole_completion_commentary IS 'AI-generated commentary for completed holes';
COMMENT ON COLUMN hole_completion_commentary.encouragement_level IS 'Level of encouragement in commentary (1=most supportive, 5=celebratory)';
COMMENT ON COLUMN hole_completion_commentary.auto_generated IS 'Whether commentary was automatically generated or manually created';