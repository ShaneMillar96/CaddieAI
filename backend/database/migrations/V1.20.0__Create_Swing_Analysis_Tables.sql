-- V1.20.0__Create_Swing_Analysis_Tables.sql
-- Creates tables for Garmin swing analysis feature:
-- 1. swing_analyses - Main table to store swing analysis data from Garmin devices
-- 2. garmin_devices - Table to manage Garmin device connections and settings
--
-- Rollback: DROP TABLE swing_analyses; DROP TABLE garmin_devices;

-- Main swing analysis data table
CREATE TABLE swing_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    hole_id INTEGER REFERENCES holes(id) ON DELETE SET NULL,
    
    -- Swing metrics from Garmin/mobile sensors
    swing_speed_mph DECIMAL(5,2) CHECK (swing_speed_mph >= 20 AND swing_speed_mph <= 200),
    swing_angle_degrees DECIMAL(6,2) CHECK (swing_angle_degrees >= -180 AND swing_angle_degrees <= 180),
    backswing_angle_degrees DECIMAL(6,2),
    follow_through_angle_degrees DECIMAL(6,2),
    
    -- Raw sensor data for future analysis
    raw_sensor_data JSONB DEFAULT '{}',
    
    -- Device and detection info
    detection_source VARCHAR(20) CHECK (detection_source IN ('garmin', 'mobile')) NOT NULL,
    device_model VARCHAR(100),
    detection_confidence DECIMAL(3,2) CHECK (detection_confidence >= 0 AND detection_confidence <= 1),
    
    -- Analysis results
    swing_quality_score DECIMAL(3,2) CHECK (swing_quality_score >= 0 AND swing_quality_score <= 10),
    ai_feedback TEXT,
    compared_to_template VARCHAR(50) DEFAULT 'standard_driver',
    
    -- GPS context
    shot_location GEOMETRY(POINT, 4326),
    club_used VARCHAR(50),
    distance_to_pin_yards INTEGER,
    
    -- Audit fields
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Garmin device connections table
CREATE TABLE garmin_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(100) NOT NULL,
    device_model VARCHAR(100) NOT NULL,
    bluetooth_address VARCHAR(17) NOT NULL, -- MAC address format
    connection_status VARCHAR(20) CHECK (connection_status IN ('connected', 'disconnected', 'pairing', 'error')) DEFAULT 'disconnected',
    last_connected_at TIMESTAMP WITH TIME ZONE,
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
    firmware_version VARCHAR(50),
    
    -- Connection settings
    auto_connect BOOLEAN DEFAULT TRUE,
    preferred_device BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    paired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, bluetooth_address)
);

-- Apply updated_at triggers
CREATE TRIGGER update_swing_analyses_updated_at 
    BEFORE UPDATE ON swing_analyses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_garmin_devices_updated_at 
    BEFORE UPDATE ON garmin_devices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Performance indexes for swing analyses
CREATE INDEX idx_swing_analyses_user_id ON swing_analyses(user_id);
CREATE INDEX idx_swing_analyses_round_id ON swing_analyses(round_id);
CREATE INDEX idx_swing_analyses_hole_id ON swing_analyses(hole_id);
CREATE INDEX idx_swing_analyses_user_round ON swing_analyses(user_id, round_id);
CREATE INDEX idx_swing_analyses_detected_at ON swing_analyses(detected_at);
CREATE INDEX idx_swing_analyses_detection_source ON swing_analyses(detection_source);
CREATE INDEX idx_swing_analyses_shot_location ON swing_analyses USING GIST(shot_location);

-- Performance indexes for Garmin devices  
CREATE INDEX idx_garmin_devices_user_id ON garmin_devices(user_id);
CREATE INDEX idx_garmin_devices_connection_status ON garmin_devices(connection_status);
CREATE INDEX idx_garmin_devices_bluetooth_address ON garmin_devices(bluetooth_address);

-- Table and column comments for documentation
COMMENT ON TABLE swing_analyses IS 'Stores golf swing analysis data captured from Garmin devices and mobile sensors during rounds';
COMMENT ON COLUMN swing_analyses.swing_speed_mph IS 'Club head speed in miles per hour measured at impact';
COMMENT ON COLUMN swing_analyses.swing_angle_degrees IS 'Primary swing plane angle in degrees';
COMMENT ON COLUMN swing_analyses.backswing_angle_degrees IS 'Maximum backswing angle in degrees';
COMMENT ON COLUMN swing_analyses.follow_through_angle_degrees IS 'Follow-through completion angle in degrees';
COMMENT ON COLUMN swing_analyses.raw_sensor_data IS 'JSON blob containing raw accelerometer and gyroscope data for future analysis';
COMMENT ON COLUMN swing_analyses.detection_source IS 'Source device that detected the swing (garmin or mobile)';
COMMENT ON COLUMN swing_analyses.detection_confidence IS 'Confidence score (0.0-1.0) that detected motion was an actual golf swing';
COMMENT ON COLUMN swing_analyses.swing_quality_score IS 'AI-generated swing quality score from 0-10 based on technique analysis';
COMMENT ON COLUMN swing_analyses.ai_feedback IS 'AI-generated feedback and improvement suggestions for the swing';
COMMENT ON COLUMN swing_analyses.compared_to_template IS 'Template or pro swing used for comparison analysis';
COMMENT ON COLUMN swing_analyses.shot_location IS 'GPS location where swing was detected (PostGIS Point geometry)';
COMMENT ON COLUMN swing_analyses.club_used IS 'Golf club used for the shot (driver, 7-iron, etc.)';
COMMENT ON COLUMN swing_analyses.distance_to_pin_yards IS 'Distance to pin in yards at time of swing';

COMMENT ON TABLE garmin_devices IS 'Manages Garmin device connections and pairing information for users';
COMMENT ON COLUMN garmin_devices.device_name IS 'User-friendly device name (e.g., "My Forerunner 55")';
COMMENT ON COLUMN garmin_devices.device_model IS 'Garmin device model (e.g., "Forerunner 55", "Fenix 7")';
COMMENT ON COLUMN garmin_devices.bluetooth_address IS 'MAC address for Bluetooth connection in XX:XX:XX:XX:XX:XX format';
COMMENT ON COLUMN garmin_devices.connection_status IS 'Current connection status of the device';
COMMENT ON COLUMN garmin_devices.battery_level IS 'Last reported battery level as percentage (0-100)';
COMMENT ON COLUMN garmin_devices.firmware_version IS 'Device firmware version for compatibility tracking';
COMMENT ON COLUMN garmin_devices.auto_connect IS 'Whether to automatically connect to this device when starting rounds';
COMMENT ON COLUMN garmin_devices.preferred_device IS 'Whether this is the user''s preferred device when multiple devices are paired';