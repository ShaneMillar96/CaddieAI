-- CaddieAI Database Performance Tuning
-- This script optimizes PostgreSQL settings for the CaddieAI application

-- Connect to the database
\c caddieai_dev;

-- Performance settings for development environment
-- These settings are optimized for local development with moderate data volumes

-- Memory settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET work_mem = '4MB';

-- Connection settings
ALTER SYSTEM SET max_connections = '100';

-- Checkpoint settings
ALTER SYSTEM SET checkpoint_completion_target = '0.9';
ALTER SYSTEM SET wal_buffers = '16MB';

-- Query planner settings
ALTER SYSTEM SET random_page_cost = '1.1';
ALTER SYSTEM SET effective_io_concurrency = '200';

-- Logging settings for development
ALTER SYSTEM SET log_statement = 'none';
ALTER SYSTEM SET log_min_duration_statement = '1000';
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

-- Auto-vacuum settings
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = '0.1';
ALTER SYSTEM SET autovacuum_analyze_scale_factor = '0.05';

-- Reload configuration
SELECT pg_reload_conf();

-- Create indexes for common queries (will be used after migrations)
-- Note: Actual indexes are created in migration scripts

-- Log performance tuning completion
DO $$
BEGIN
    RAISE NOTICE 'CaddieAI database performance tuning completed';
END
$$;