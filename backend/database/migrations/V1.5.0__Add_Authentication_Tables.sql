-- CaddieAI Database Migration V1.5.0
-- Add authentication and user management tables

-- Create enum types for authentication
CREATE TYPE token_type AS ENUM ('refresh', 'email_verification', 'password_reset');

-- Refresh tokens table for JWT token management
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    is_revoked BOOLEAN DEFAULT FALSE,
    device_info JSONB DEFAULT '{}',
    ip_address INET
);

-- User sessions table for active session tracking
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Password reset tokens table for password reset functionality
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT FALSE
);

-- Add authentication-related columns to users table
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN email_verification_token VARCHAR(255),
ADD COLUMN email_verification_expires TIMESTAMP WITH TIME ZONE,
ADD COLUMN password_reset_token VARCHAR(255),
ADD COLUMN password_reset_expires TIMESTAMP WITH TIME ZONE,
ADD COLUMN failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN two_factor_secret VARCHAR(255);

-- Apply updated_at trigger to new tables
CREATE TRIGGER update_refresh_tokens_updated_at 
    BEFORE UPDATE ON refresh_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at 
    BEFORE UPDATE ON user_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_password_reset_tokens_updated_at 
    BEFORE UPDATE ON password_reset_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX idx_password_reset_tokens_is_used ON password_reset_tokens(is_used);

CREATE INDEX idx_users_email_verified ON users(email_verified);
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX idx_users_failed_login_attempts ON users(failed_login_attempts);
CREATE INDEX idx_users_locked_until ON users(locked_until);
CREATE INDEX idx_users_two_factor_enabled ON users(two_factor_enabled);

-- Add comments for documentation
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for maintaining user sessions';
COMMENT ON TABLE user_sessions IS 'Active user sessions for tracking and management';
COMMENT ON TABLE password_reset_tokens IS 'Password reset tokens for secure password recovery';

COMMENT ON COLUMN refresh_tokens.device_info IS 'Device information stored as JSON (device type, OS, etc.)';
COMMENT ON COLUMN refresh_tokens.ip_address IS 'IP address where token was issued';
COMMENT ON COLUMN refresh_tokens.is_revoked IS 'Flag indicating if token has been revoked';

COMMENT ON COLUMN user_sessions.device_info IS 'Device information stored as JSON';
COMMENT ON COLUMN user_sessions.user_agent IS 'User agent string from the request';
COMMENT ON COLUMN user_sessions.last_activity IS 'Last activity timestamp for session management';

COMMENT ON COLUMN users.email_verified IS 'Flag indicating if email address has been verified';
COMMENT ON COLUMN users.failed_login_attempts IS 'Counter for failed login attempts (for account locking)';
COMMENT ON COLUMN users.locked_until IS 'Timestamp until which account is locked due to failed attempts';
COMMENT ON COLUMN users.two_factor_enabled IS 'Flag indicating if 2FA is enabled for the user';

-- Create function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Clean up expired refresh tokens
    DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up expired user sessions
    DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Clean up expired password reset tokens
    DELETE FROM password_reset_tokens WHERE expires_at < CURRENT_TIMESTAMP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to revoke all user tokens
CREATE OR REPLACE FUNCTION revoke_all_user_tokens(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    revoked_count INTEGER;
BEGIN
    -- Revoke all refresh tokens for the user
    UPDATE refresh_tokens 
    SET is_revoked = TRUE, revoked_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id AND is_revoked = FALSE;
    GET DIAGNOSTICS revoked_count = ROW_COUNT;
    
    -- Deactivate all user sessions
    UPDATE user_sessions 
    SET is_active = FALSE
    WHERE user_id = p_user_id AND is_active = TRUE;
    
    RETURN revoked_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle failed login attempts
CREATE OR REPLACE FUNCTION handle_failed_login(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    current_attempts INTEGER;
    max_attempts INTEGER := 5;
    lockout_duration INTERVAL := '15 minutes';
BEGIN
    -- Increment failed login attempts
    UPDATE users 
    SET failed_login_attempts = failed_login_attempts + 1
    WHERE id = p_user_id;
    
    -- Get current attempts
    SELECT failed_login_attempts INTO current_attempts
    FROM users WHERE id = p_user_id;
    
    -- Lock account if max attempts reached
    IF current_attempts >= max_attempts THEN
        UPDATE users 
        SET locked_until = CURRENT_TIMESTAMP + lockout_duration
        WHERE id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to reset failed login attempts on successful login
CREATE OR REPLACE FUNCTION reset_failed_login_attempts(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET failed_login_attempts = 0, locked_until = NULL
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;