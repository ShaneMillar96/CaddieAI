-- CaddieAI Database Migration V1.13.0
-- Add user_id to courses and holes tables for user-driven course management

-- MIGRATION MADE OBSOLETE BY SCHEMA REFACTORING
-- This migration was originally created to add user_id columns to courses and holes tables.
-- However, during schema simplification, these columns were added directly to V1.1.0__Create_Course_And_Hole_Tables.sql
-- 
-- The following changes are already implemented in V1.1.0:
-- 1. courses.user_id column with foreign key constraint
-- 2. holes.user_id column with foreign key constraint  
-- 3. idx_courses_user_id and idx_holes_user_id indexes
-- 4. Column comments for documentation
--
-- This migration is kept empty to maintain Flyway version continuity.
-- No changes needed - user_id functionality is already available.

-- No SQL statements required - changes already present in V1.1.0