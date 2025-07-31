-- V1.7.0: Create round status lookup table
-- Replace round_status enum with foreign key relationship

-- Create round_statuses lookup table
CREATE TABLE round_statuses (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Insert round status data
INSERT INTO round_statuses (id, name, description) VALUES 
(1, 'not_started', 'Round has not been started yet'),
(2, 'in_progress', 'Round is currently being played'),
(3, 'paused', 'Round is temporarily paused'),
(4, 'completed', 'Round has been completed'),
(5, 'abandoned', 'Round was abandoned before completion');

-- Add new foreign key column to Rounds table
ALTER TABLE rounds 
ADD COLUMN status_id INTEGER DEFAULT 1;

-- Update existing data - map enum values to integer IDs
UPDATE rounds SET 
    status_id = CASE 
        WHEN status::text = 'not_started' THEN 1
        WHEN status::text = 'in_progress' THEN 2
        WHEN status::text = 'paused' THEN 3
        WHEN status::text = 'completed' THEN 4
        WHEN status::text = 'abandoned' THEN 5
        ELSE 1
    END
WHERE status IS NOT NULL;

-- Add foreign key constraint
ALTER TABLE rounds 
ADD CONSTRAINT fk_rounds_status 
    FOREIGN KEY (status_id) REFERENCES round_statuses(id);

-- Make the new column NOT NULL
ALTER TABLE rounds 
ALTER COLUMN status_id SET NOT NULL;

-- Drop old enum column
ALTER TABLE rounds DROP COLUMN status;

-- Create indexes for better performance
CREATE INDEX idx_round_statuses_name ON round_statuses(name);
CREATE INDEX idx_rounds_status_id ON rounds(status_id);

-- Drop old enum type
DROP TYPE round_status CASCADE;