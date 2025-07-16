# CaddieAI Database Migrations

This directory contains database migration scripts for the CaddieAI application.

## Migration Naming Convention

All migration files follow the pattern:
`V{version}__{description}.sql`

Where:
- `{version}` is the version number (e.g., 1.0.0, 1.0.1, 1.1.0)
- `{description}` is a brief description with words separated by underscores

## Migration Files

- `V1.0.0__Create_Initial_Tables.sql` - Creates the initial database schema with core tables

## Running Migrations

These migration scripts are designed to be used with Flyway or similar database migration tool.

### Using Flyway

1. Configure Flyway with your database connection details
2. Place migration files in this directory
3. Run `flyway migrate` to apply migrations

### Database Schema Overview

The initial schema includes:
- **users**: User authentication and profile information
- **golf_courses**: Golf course details and metadata
- **golf_rounds**: Individual golf round records
- **hole_scores**: Detailed hole-by-hole scoring information