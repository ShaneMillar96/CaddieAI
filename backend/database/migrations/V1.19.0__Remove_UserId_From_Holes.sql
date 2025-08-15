-- Remove user_id from holes table to prevent duplicate hole data
-- Holes should be course-specific, not user-specific, to allow sharing par information

-- Step 1: Remove NOT NULL constraint first (safer approach)
ALTER TABLE holes 
ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Update all existing holes to have NULL user_id
UPDATE holes SET user_id = NULL;

-- Step 3: Drop the foreign key constraint
ALTER TABLE holes 
DROP CONSTRAINT IF EXISTS holes_user_id_fkey;

-- Step 4: Drop the user_id column entirely
ALTER TABLE holes 
DROP COLUMN user_id;

-- Step 5: Add comment explaining the change
COMMENT ON TABLE holes IS 'Golf hole information shared across all users for each course. Par values are entered by first user to play each hole and can be updated by subsequent users if incorrect.';

-- Verify the constraint is gone by checking table structure
-- This query can be used to confirm the migration worked:
-- SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'holes' AND table_schema = 'public';