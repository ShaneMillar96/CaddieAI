-- CaddieAI Database Migration V1.3.0
-- Create AI features tables with OpenAI ChatGPT integration

-- Create enum types for AI features
CREATE TYPE message_type AS ENUM ('user_message', 'ai_response', 'system_message', 'error_message');
CREATE TYPE chat_session_status AS ENUM ('active', 'paused', 'completed', 'archived');

-- Chat sessions table - OpenAI ChatGPT conversation sessions with AI caddie personality
CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    round_id INTEGER REFERENCES rounds(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
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
    BEFORE UPDATE ON chat_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Chat messages table - ChatGPT conversation messages with token tracking
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    BEFORE UPDATE ON chat_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Club recommendations table - Simplified AI-generated club recommendations via OpenAI ChatGPT
CREATE TABLE club_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    round_id INTEGER REFERENCES rounds(id) ON DELETE CASCADE,
    hole_id INTEGER REFERENCES holes(id) ON DELETE SET NULL,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
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
    BEFORE UPDATE ON club_recommendations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_round_id ON chat_sessions(round_id);
CREATE INDEX idx_chat_sessions_course_id ON chat_sessions(course_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_sessions_openai_model ON chat_sessions(openai_model);
CREATE INDEX idx_chat_sessions_last_message_at ON chat_sessions(last_message_at);
CREATE INDEX idx_chat_sessions_user_status ON chat_sessions(user_id, status);
CREATE INDEX idx_chat_sessions_context_data ON chat_sessions USING GIN(context_data);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX idx_chat_messages_message_type ON chat_messages(message_type);
CREATE INDEX idx_chat_messages_openai_role ON chat_messages(openai_role);
CREATE INDEX idx_chat_messages_tokens_consumed ON chat_messages(tokens_consumed);
CREATE INDEX idx_chat_messages_session_timestamp ON chat_messages(session_id, timestamp);

CREATE INDEX idx_club_recommendations_user_id ON club_recommendations(user_id);
CREATE INDEX idx_club_recommendations_round_id ON club_recommendations(round_id);
CREATE INDEX idx_club_recommendations_hole_id ON club_recommendations(hole_id);
CREATE INDEX idx_club_recommendations_location_id ON club_recommendations(location_id);
CREATE INDEX idx_club_recommendations_recommended_club ON club_recommendations(recommended_club);
CREATE INDEX idx_club_recommendations_confidence_score ON club_recommendations(confidence_score);
CREATE INDEX idx_club_recommendations_was_accepted ON club_recommendations(was_accepted);
CREATE INDEX idx_club_recommendations_context_used ON club_recommendations USING GIN(context_used);

-- Add comments for documentation
COMMENT ON TABLE chat_sessions IS 'OpenAI ChatGPT conversation sessions with AI caddie personality';
COMMENT ON COLUMN chat_sessions.context_data IS 'Conversation context including recent topics, user preferences, and game state';
COMMENT ON COLUMN chat_sessions.openai_model IS 'OpenAI model used for this session (gpt-3.5-turbo, gpt-4)';
COMMENT ON COLUMN chat_sessions.system_prompt IS 'System prompt defining AI caddie personality and context';
COMMENT ON COLUMN chat_sessions.temperature IS 'OpenAI temperature setting for response creativity';
COMMENT ON COLUMN chat_sessions.max_tokens IS 'Token limit management for cost control';
COMMENT ON COLUMN chat_sessions.total_messages IS 'Total number of messages in this session';

COMMENT ON TABLE chat_messages IS 'ChatGPT conversation messages with token tracking';
COMMENT ON COLUMN chat_messages.message_content IS 'Message content (text)';
COMMENT ON COLUMN chat_messages.message_type IS 'Type of message (user_message, ai_response, system_message, error_message)';
COMMENT ON COLUMN chat_messages.openai_role IS 'OpenAI role (user, assistant, system)';
COMMENT ON COLUMN chat_messages.tokens_consumed IS 'Number of tokens used by OpenAI for this message';
COMMENT ON COLUMN chat_messages.openai_model_used IS 'OpenAI model used for this specific message';
COMMENT ON COLUMN chat_messages.context_data IS 'Additional context data for this message';

COMMENT ON TABLE club_recommendations IS 'Simplified AI-generated club recommendations via OpenAI ChatGPT';
COMMENT ON COLUMN club_recommendations.recommended_club IS 'Primary club recommendation';
COMMENT ON COLUMN club_recommendations.confidence_score IS 'Numerical confidence score (0-1)';
COMMENT ON COLUMN club_recommendations.distance_to_target IS 'Distance to target in meters';
COMMENT ON COLUMN club_recommendations.openai_reasoning IS 'OpenAI-generated reasoning for the recommendation';
COMMENT ON COLUMN club_recommendations.context_used IS 'Context data used for the recommendation';
COMMENT ON COLUMN club_recommendations.was_accepted IS 'Whether user accepted the recommendation';
COMMENT ON COLUMN club_recommendations.actual_club_used IS 'Club actually used by player (for learning)';