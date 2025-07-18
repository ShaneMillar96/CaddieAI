-- CaddieAI Database Migration V1.3.0
-- Create AI features tables with OpenAI ChatGPT integration

-- Create enum types for AI features
CREATE TYPE message_type AS ENUM ('user_message', 'ai_response', 'system_message', 'error_message');
CREATE TYPE chat_session_status AS ENUM ('active', 'paused', 'completed', 'archived');

-- Chat sessions table - OpenAI ChatGPT conversation sessions with AI caddie personality
CREATE TABLE ChatSessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    round_id INTEGER REFERENCES Rounds(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES Courses(id) ON DELETE SET NULL,
    session_name VARCHAR(255),
    status chat_session_status DEFAULT 'active',
    context_data JSONB DEFAULT '{}',
    openai_model VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
    system_prompt TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0.0 AND temperature <= 2.0),
    max_tokens INTEGER DEFAULT 500 CHECK (max_tokens >= 1 AND max_tokens <= 4000),
    total_messages INTEGER DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE,
    session_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apply updated_at trigger to ChatSessions table
CREATE TRIGGER update_chat_sessions_updated_at 
    BEFORE UPDATE ON ChatSessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Chat messages table - ChatGPT conversation messages with token tracking
CREATE TABLE ChatMessages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES ChatSessions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    message_content TEXT NOT NULL,
    message_type message_type NOT NULL,
    openai_role VARCHAR(20) DEFAULT 'user' CHECK (openai_role IN ('user', 'assistant', 'system')),
    tokens_consumed INTEGER,
    openai_model_used VARCHAR(50),
    context_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apply updated_at trigger to ChatMessages table
CREATE TRIGGER update_chat_messages_updated_at 
    BEFORE UPDATE ON ChatMessages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Club recommendations table - Simplified AI-generated club recommendations via OpenAI ChatGPT
CREATE TABLE ClubRecommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    round_id INTEGER REFERENCES Rounds(id) ON DELETE CASCADE,
    hole_id INTEGER REFERENCES Holes(id) ON DELETE SET NULL,
    location_id INTEGER REFERENCES Locations(id) ON DELETE SET NULL,
    recommended_club VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    distance_to_target DECIMAL(6,2),
    openai_reasoning TEXT,
    context_used JSONB DEFAULT '{}',
    was_accepted BOOLEAN,
    actual_club_used VARCHAR(50),
    recommendation_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apply updated_at trigger to ClubRecommendations table
CREATE TRIGGER update_club_recommendations_updated_at 
    BEFORE UPDATE ON ClubRecommendations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_chat_sessions_user_id ON ChatSessions(user_id);
CREATE INDEX idx_chat_sessions_round_id ON ChatSessions(round_id);
CREATE INDEX idx_chat_sessions_course_id ON ChatSessions(course_id);
CREATE INDEX idx_chat_sessions_status ON ChatSessions(status);
CREATE INDEX idx_chat_sessions_openai_model ON ChatSessions(openai_model);
CREATE INDEX idx_chat_sessions_last_message_at ON ChatSessions(last_message_at);
CREATE INDEX idx_chat_sessions_user_status ON ChatSessions(user_id, status);
CREATE INDEX idx_chat_sessions_context_data ON ChatSessions USING GIN(context_data);

CREATE INDEX idx_chat_messages_session_id ON ChatMessages(session_id);
CREATE INDEX idx_chat_messages_user_id ON ChatMessages(user_id);
CREATE INDEX idx_chat_messages_timestamp ON ChatMessages(timestamp);
CREATE INDEX idx_chat_messages_message_type ON ChatMessages(message_type);
CREATE INDEX idx_chat_messages_openai_role ON ChatMessages(openai_role);
CREATE INDEX idx_chat_messages_tokens_consumed ON ChatMessages(tokens_consumed);
CREATE INDEX idx_chat_messages_session_timestamp ON ChatMessages(session_id, timestamp);

CREATE INDEX idx_club_recommendations_user_id ON ClubRecommendations(user_id);
CREATE INDEX idx_club_recommendations_round_id ON ClubRecommendations(round_id);
CREATE INDEX idx_club_recommendations_hole_id ON ClubRecommendations(hole_id);
CREATE INDEX idx_club_recommendations_location_id ON ClubRecommendations(location_id);
CREATE INDEX idx_club_recommendations_recommended_club ON ClubRecommendations(recommended_club);
CREATE INDEX idx_club_recommendations_confidence_score ON ClubRecommendations(confidence_score);
CREATE INDEX idx_club_recommendations_was_accepted ON ClubRecommendations(was_accepted);
CREATE INDEX idx_club_recommendations_context_used ON ClubRecommendations USING GIN(context_used);

-- Add comments for documentation
COMMENT ON TABLE ChatSessions IS 'OpenAI ChatGPT conversation sessions with AI caddie personality';
COMMENT ON COLUMN ChatSessions.context_data IS 'Conversation context including recent topics, user preferences, and game state';
COMMENT ON COLUMN ChatSessions.openai_model IS 'OpenAI model used for this session (gpt-3.5-turbo, gpt-4)';
COMMENT ON COLUMN ChatSessions.system_prompt IS 'System prompt defining AI caddie personality and context';
COMMENT ON COLUMN ChatSessions.temperature IS 'OpenAI temperature setting for response creativity';
COMMENT ON COLUMN ChatSessions.max_tokens IS 'Token limit management for cost control';
COMMENT ON COLUMN ChatSessions.total_messages IS 'Total number of messages in this session';

COMMENT ON TABLE ChatMessages IS 'ChatGPT conversation messages with token tracking';
COMMENT ON COLUMN ChatMessages.message_content IS 'Message content (text)';
COMMENT ON COLUMN ChatMessages.message_type IS 'Type of message (user_message, ai_response, system_message, error_message)';
COMMENT ON COLUMN ChatMessages.openai_role IS 'OpenAI role (user, assistant, system)';
COMMENT ON COLUMN ChatMessages.tokens_consumed IS 'Number of tokens used by OpenAI for this message';
COMMENT ON COLUMN ChatMessages.openai_model_used IS 'OpenAI model used for this specific message';
COMMENT ON COLUMN ChatMessages.context_data IS 'Additional context data for this message';

COMMENT ON TABLE ClubRecommendations IS 'Simplified AI-generated club recommendations via OpenAI ChatGPT';
COMMENT ON COLUMN ClubRecommendations.recommended_club IS 'Primary club recommendation';
COMMENT ON COLUMN ClubRecommendations.confidence_score IS 'Numerical confidence score (0-1)';
COMMENT ON COLUMN ClubRecommendations.distance_to_target IS 'Distance to target in meters';
COMMENT ON COLUMN ClubRecommendations.openai_reasoning IS 'OpenAI-generated reasoning for the recommendation';
COMMENT ON COLUMN ClubRecommendations.context_used IS 'Context data used for the recommendation';
COMMENT ON COLUMN ClubRecommendations.was_accepted IS 'Whether user accepted the recommendation';
COMMENT ON COLUMN ClubRecommendations.actual_club_used IS 'Club actually used by player (for learning)';