-- CaddieAI Database Initialization Script
-- This script is executed when the PostgreSQL container starts for the first time

-- Create the main database (if not exists)
SELECT 'CREATE DATABASE caddieai_dev' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'caddieai_dev')\gexec

-- Connect to the database
\c caddieai_dev;

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS postgis_raster;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;

-- Enable UUID extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a read-only user for reporting/analytics (optional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'caddieai_readonly') THEN
        CREATE ROLE caddieai_readonly LOGIN PASSWORD 'readonly_password';
    END IF;
END
$$;

-- Grant connect permission to the readonly user
GRANT CONNECT ON DATABASE caddieai_dev TO caddieai_readonly;

-- Note: Table-level permissions will be granted after Flyway migrations run
-- This is handled in the post-migration script

-- Set default timezone
SET timezone = 'UTC';

-- Display installed extensions
SELECT extname, extversion FROM pg_extension WHERE extname IN ('postgis', 'uuid-ossp');

-- Display PostGIS version
SELECT PostGIS_version();

-- Create a health check function for monitoring
CREATE OR REPLACE FUNCTION health_check() 
RETURNS TEXT AS $$
BEGIN
    RETURN 'CaddieAI Database is healthy - ' || now()::text;
END;
$$ LANGUAGE plpgsql;

-- Log initialization completion
DO $$
BEGIN
    RAISE NOTICE 'CaddieAI database initialization completed successfully';
END
$$;