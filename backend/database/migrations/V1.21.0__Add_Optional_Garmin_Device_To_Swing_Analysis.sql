-- V1.21.0__Add_Optional_Garmin_Device_To_Swing_Analysis.sql
-- Adds optional foreign key link between swing analyses and Garmin devices
-- 
-- Purpose: Links swing analyses to specific Garmin devices when detection_source = 'garmin'
-- The column remains NULL for mobile sensor detections (detection_source = 'mobile')
-- 
-- Rollback Instructions:
-- ALTER TABLE swing_analyses DROP COLUMN garmin_device_id;

-- Add optional foreign key column to link swing analyses with Garmin devices
ALTER TABLE swing_analyses 
ADD COLUMN garmin_device_id INTEGER REFERENCES garmin_devices(id) ON DELETE SET NULL;

-- Create index for performance when querying by Garmin device
CREATE INDEX idx_swing_analyses_garmin_device_id ON swing_analyses(garmin_device_id);

-- Add table comment explaining the new relationship
COMMENT ON COLUMN swing_analyses.garmin_device_id IS 'Foreign key to garmin_devices table, only populated when detection_source is garmin, NULL for mobile detections';