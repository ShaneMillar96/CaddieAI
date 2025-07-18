-- CaddieAI Database Migration V1.0.0
-- Create initial foundation tables and enable PostGIS for geospatial capabilities

-- Enable PostGIS extension for geospatial data support
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create enum types for better data consistency
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'professional');

-- Users table - Core user information with golf-specific data
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    handicap DECIMAL(4,1) CHECK (handicap >= -10 AND handicap <= 54),
    skill_level skill_level DEFAULT 'beginner',
    preferences JSONB DEFAULT '{}',
    playing_style JSONB DEFAULT '{}',
    status user_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create updated_at trigger function for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to Users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON Users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_status ON Users(status);
CREATE INDEX idx_users_skill_level ON Users(skill_level);
CREATE INDEX idx_users_handicap ON Users(handicap);
CREATE INDEX idx_users_preferences ON Users USING GIN(preferences);
CREATE INDEX idx_users_playing_style ON Users USING GIN(playing_style);

-- Add comments for documentation
COMMENT ON TABLE Users IS 'Core user information including golf-specific data and preferences';
COMMENT ON COLUMN Users.handicap IS 'Golf handicap index, typically between -10 and 54';
COMMENT ON COLUMN Users.preferences IS 'User preferences stored as JSON (club preferences, notifications, etc.)';
COMMENT ON COLUMN Users.playing_style IS 'Playing style characteristics stored as JSON (aggressive, conservative, etc.)';
COMMENT ON COLUMN Users.skill_level IS 'General skill level assessment for AI context';