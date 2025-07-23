-- CaddieAI Database Migration V1.8.0
-- Add missing updated_at column to RefreshTokens table

-- Add updated_at column to RefreshTokens table
ALTER TABLE RefreshTokens 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have the current timestamp
UPDATE RefreshTokens SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN RefreshTokens.updated_at IS 'Timestamp of last update to the refresh token record';

-- Create index for better performance on updated_at queries
CREATE INDEX idx_refresh_tokens_updated_at ON RefreshTokens(updated_at);