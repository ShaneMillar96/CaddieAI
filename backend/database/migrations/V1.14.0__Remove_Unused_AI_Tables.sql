-- CaddieAI Database Migration V1.14.0
-- Remove unused AI Integration tables to simplify database schema
-- These tables were created but are not used by the application

-- Drop unused AI tables and their indexes/constraints
-- Note: shot_events and location_history are kept as they may be used in future features

-- Drop ai_conversations table (no DAL model, no controller usage)
DROP INDEX IF EXISTS idx_ai_conversations_round_id;
DROP INDEX IF EXISTS idx_ai_conversations_conversation_type;
DROP INDEX IF EXISTS idx_ai_conversations_created_at;
DROP INDEX IF EXISTS idx_ai_conversations_requires_confirmation;
DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON ai_conversations;
DROP TABLE IF EXISTS ai_conversations;

-- Drop ai_context_updates table (no DAL model, no controller usage)
DROP INDEX IF EXISTS idx_ai_context_updates_round_id;
DROP INDEX IF EXISTS idx_ai_context_updates_user_id;
DROP INDEX IF EXISTS idx_ai_context_updates_context_type;
DROP INDEX IF EXISTS idx_ai_context_updates_created_at;
DROP TABLE IF EXISTS ai_context_updates;

-- Drop hole_completion_commentary table (DAL model exists but unused by controllers)
DROP INDEX IF EXISTS idx_hole_completion_commentary_round_id;
DROP INDEX IF EXISTS idx_hole_completion_commentary_user_id;
DROP INDEX IF EXISTS idx_hole_completion_commentary_hole_number;
DROP INDEX IF EXISTS idx_hole_completion_commentary_score;
DROP INDEX IF EXISTS idx_hole_completion_commentary_encouragement_level;
DROP TABLE IF EXISTS hole_completion_commentary;

-- Keep shot_events and location_history tables for potential future use
-- These tables have some service layer references and may be needed for shot tracking features

-- Add comment explaining cleanup
COMMENT ON SCHEMA public IS 'Database schema cleaned up in V1.14.0 - removed unused AI tables to reduce complexity and improve maintainability';