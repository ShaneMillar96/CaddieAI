-- CaddieAI Database Migration V1.15.0
-- Remove unused backend tables and clean up database schema
-- These tables were created but are not used by the application (frontend uses local implementations)

-- ============================================================================
-- Drop shot_placements table (created in V1.11.0)
-- Frontend uses local shot placement service, never calls backend APIs
-- ============================================================================

-- Drop indexes for shot_placements
DROP INDEX IF EXISTS idx_shot_placements_round_id;
DROP INDEX IF EXISTS idx_shot_placements_user_id;
DROP INDEX IF EXISTS idx_shot_placements_hole_id;
DROP INDEX IF EXISTS idx_shot_placements_target_location;
DROP INDEX IF EXISTS idx_shot_placements_is_completed;
DROP INDEX IF EXISTS idx_shot_placements_created_at;
DROP INDEX IF EXISTS idx_shot_placements_round_hole;
DROP INDEX IF EXISTS idx_shot_placements_user_round;

-- Drop trigger
DROP TRIGGER IF EXISTS update_shot_placements_updated_at ON shot_placements;

-- Drop table
DROP TABLE IF EXISTS shot_placements;

-- ============================================================================
-- Drop shot_events table (no API exposure, no frontend usage)
-- ============================================================================

-- Drop indexes for shot_events
DROP INDEX IF EXISTS idx_shot_events_round_id;
DROP INDEX IF EXISTS idx_shot_events_user_id;
DROP INDEX IF EXISTS idx_shot_events_hole_number;
DROP INDEX IF EXISTS idx_shot_events_shot_number;
DROP INDEX IF EXISTS idx_shot_events_round_hole;
DROP INDEX IF EXISTS idx_shot_events_start_location;
DROP INDEX IF EXISTS idx_shot_events_end_location;
DROP INDEX IF EXISTS idx_shot_events_distance;
DROP INDEX IF EXISTS idx_shot_events_estimated_club;
DROP INDEX IF EXISTS idx_shot_events_shot_type;
DROP INDEX IF EXISTS idx_shot_events_auto_detected;
DROP INDEX IF EXISTS idx_shot_events_user_confirmed;
DROP INDEX IF EXISTS idx_shot_events_created_at;

-- Drop trigger
DROP TRIGGER IF EXISTS update_shot_events_updated_at ON shot_events;

-- Drop table
DROP TABLE IF EXISTS shot_events;

-- ============================================================================
-- Drop location_history table (no controller uses it, no API exposure)
-- ============================================================================

-- Drop indexes for location_history
DROP INDEX IF EXISTS idx_location_history_round_id;
DROP INDEX IF EXISTS idx_location_history_user_id;
DROP INDEX IF EXISTS idx_location_history_location;
DROP INDEX IF EXISTS idx_location_history_recorded_at;
DROP INDEX IF EXISTS idx_location_history_detected_hole;
DROP INDEX IF EXISTS idx_location_history_position_on_hole;
DROP INDEX IF EXISTS idx_location_history_within_boundary;
DROP INDEX IF EXISTS idx_location_history_movement_type;
DROP INDEX IF EXISTS idx_location_history_round_recorded;

-- Drop table
DROP TABLE IF EXISTS location_history;

-- ============================================================================
-- Cleanup comments
-- ============================================================================

-- Add comment explaining cleanup
COMMENT ON SCHEMA public IS 'Database schema cleaned up in V1.15.0 - removed unused backend tables (shot_placements, shot_events, location_history) as frontend uses local implementations. This reduces database complexity and maintenance burden.';

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration V1.15.0 completed successfully:';
    RAISE NOTICE '- Dropped shot_placements table (frontend uses local service)';
    RAISE NOTICE '- Dropped shot_events table (no API exposure)';
    RAISE NOTICE '- Dropped location_history table (no controller usage)';
    RAISE NOTICE '- Removed 30+ indexes';
    RAISE NOTICE '- Database schema significantly simplified';
END $$;