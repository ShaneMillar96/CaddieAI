# Database Schema Documentation

**Last Updated**: 2024-01-16  
**Schema Version**: V1.5.0  
**Database**: PostgreSQL with PostGIS  
**Total Tables**: 8  
**Total Migrations**: 5

## Overview

The CaddieAI database schema is designed to support an AI-powered golf companion application with OpenAI ChatGPT integration and enhanced real-time location tracking. The schema has been simplified to 8 core tables focused on MVP functionality while maintaining geospatial capabilities.

## Schema Architecture

### Core Entities
- **Users**: Golf player profiles and preferences
- **Courses**: Golf course information with geospatial data
- **Holes**: Individual hole details with layout information
- **Rounds**: Golf round tracking and performance
- **Locations**: GPS positioning and course awareness

### AI Features (OpenAI ChatGPT Integration)
- **Chat Sessions**: AI conversation management with OpenAI settings
- **Chat Messages**: Individual conversation messages with token tracking
- **Club Recommendations**: Simplified AI-generated club suggestions

### Enhanced Location Tracking
- **Real-time GPS**: Enhanced location tracking with course awareness
- **Distance Calculations**: Automatic distance to tee and pin
- **Position Detection**: Current hole and course position tracking

## Tables Documentation

### users
**Purpose**: Core user information with golf-specific data and preferences

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR(255) | NOT NULL | Encrypted password |
| first_name | VARCHAR(100) | NOT NULL | User's first name |
| last_name | VARCHAR(100) | NOT NULL | User's last name |
| handicap | DECIMAL(4,1) | CHECK (-10 <= handicap <= 54) | Golf handicap index |
| skill_level | skill_level | DEFAULT 'beginner' | General skill assessment |
| preferences | JSONB | DEFAULT '{}' | User preferences and settings |
| playing_style | JSONB | DEFAULT '{}' | Playing style characteristics |
| status | user_status | DEFAULT 'active' | Account status |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Last update time |
| last_login_at | TIMESTAMPTZ | NULL | Last login timestamp |

**Enums Used**:
- `user_status`: active, inactive, suspended
- `skill_level`: beginner, intermediate, advanced, professional

**Indexes**:
- `idx_users_email` (email)
- `idx_users_status` (status)
- `idx_users_skill_level` (skill_level)
- `idx_users_handicap` (handicap)
- `idx_users_preferences` (GIN on preferences)
- `idx_users_playing_style` (GIN on playing_style)

### courses
**Purpose**: Golf course information with geospatial data and metadata

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique course identifier |
| name | VARCHAR(200) | NOT NULL | Course name |
| description | TEXT | NULL | Course description |
| address | TEXT | NULL | Course address |
| city | VARCHAR(100) | NULL | City location |
| country | VARCHAR(100) | NOT NULL | Country location |
| phone | VARCHAR(20) | NULL | Contact phone number |
| website | VARCHAR(255) | NULL | Course website |
| email | VARCHAR(255) | NULL | Contact email |
| par_total | INTEGER | NOT NULL, CHECK (54 <= par_total <= 90) | Total course par |
| total_holes | INTEGER | NOT NULL, DEFAULT 18, CHECK (total_holes IN (9,18,27,36)) | Number of holes |
| yardage_total | INTEGER | CHECK (yardage_total > 0) | Total yardage |
| course_rating | DECIMAL(3,1) | CHECK (60 <= course_rating <= 80) | USGA course rating |
| slope_rating | INTEGER | CHECK (55 <= slope_rating <= 155) | USGA slope rating |
| difficulty | course_difficulty | DEFAULT 'moderate' | Course difficulty level |
| location | GEOMETRY(POINT, 4326) | NULL | Course center point |
| boundary | GEOMETRY(POLYGON, 4326) | NULL | Course boundary |
| timezone | VARCHAR(50) | DEFAULT 'UTC' | Course timezone |
| green_fee_range | JSONB | DEFAULT '{}' | Pricing information |
| amenities | JSONB | DEFAULT '{}' | Available facilities |
| course_metadata | JSONB | DEFAULT '{}' | Additional course data |
| is_active | BOOLEAN | DEFAULT TRUE | Course availability |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Enums Used**:
- `course_difficulty`: easy, moderate, difficult, championship

**Indexes**:
- `idx_courses_name` (name)
- `idx_courses_location` (GIST on location)
- `idx_courses_boundary` (GIST on boundary)
- `idx_courses_difficulty` (difficulty)
- `idx_courses_par_total` (par_total)
- `idx_courses_is_active` (is_active)
- `idx_courses_amenities` (GIN on amenities)

### holes
**Purpose**: Individual hole information with detailed layout and geospatial data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique hole identifier |
| course_id | UUID | NOT NULL, FOREIGN KEY | Reference to courses table |
| hole_number | INTEGER | NOT NULL, CHECK (1 <= hole_number <= 18) | Hole number |
| name | VARCHAR(100) | NULL | Hole name |
| par | INTEGER | NOT NULL, CHECK (3 <= par <= 5) | Hole par |
| hole_type | hole_type | NOT NULL | Par classification |
| yardage_black | INTEGER | CHECK (yardage_black > 0) | Black tee yardage |
| yardage_blue | INTEGER | CHECK (yardage_blue > 0) | Blue tee yardage |
| yardage_white | INTEGER | CHECK (yardage_white > 0) | White tee yardage |
| yardage_red | INTEGER | CHECK (yardage_red > 0) | Red tee yardage |
| stroke_index | INTEGER | CHECK (1 <= stroke_index <= 18) | Hole difficulty ranking |
| ladies_yardage | INTEGER | CHECK (ladies_yardage > 0) | Ladies tee yardage |
| ladies_par | INTEGER | CHECK (3 <= ladies_par <= 5) | Ladies tee par |
| ladies_stroke_index | INTEGER | CHECK (1 <= ladies_stroke_index <= 18) | Ladies tee difficulty ranking |
| hole_tips | TEXT | NULL | Official playing tips and strategy advice |
| simple_hazards | JSONB | DEFAULT '[]' | Simplified hazard information |
| tee_location | GEOMETRY(POINT, 4326) | NULL | Tee box center point |
| pin_location | GEOMETRY(POINT, 4326) | NULL | Green/pin location |
| hole_layout | GEOMETRY(POLYGON, 4326) | NULL | Complete hole boundary |
| fairway_center_line | GEOMETRY(LINESTRING, 4326) | NULL | Optimal playing line |
| hole_description | TEXT | NULL | Hole description |
| playing_tips | TEXT | NULL | Strategic advice |
| hole_metadata | JSONB | DEFAULT '{}' | Additional hole data |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Enums Used**:
- `hole_type`: par3, par4, par5

**Unique Constraints**:
- `UNIQUE(course_id, hole_number)`

**Indexes**:
- `idx_holes_course_id` (course_id)
- `idx_holes_hole_number` (hole_number)
- `idx_holes_par` (par)
- `idx_holes_hole_type` (hole_type)
- `idx_holes_tee_location` (GIST on tee_location)
- `idx_holes_pin_location` (GIST on pin_location)
- `idx_holes_hole_layout` (GIST on hole_layout)
- `idx_holes_fairway_center_line` (GIST on fairway_center_line)
- `idx_holes_stroke_index` (stroke_index)
- `idx_holes_ladies_par` (ladies_par)
- `idx_holes_simple_hazards` (GIN on simple_hazards)

### locations
**Purpose**: Enhanced real-time GPS tracking with distance calculations and course position awareness

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique location identifier |
| user_id | UUID | NOT NULL, FOREIGN KEY | Reference to users table |
| round_id | UUID | NULL, FOREIGN KEY | Reference to rounds table |
| course_id | UUID | NULL, FOREIGN KEY | Reference to courses table |
| latitude | DECIMAL(10,7) | NOT NULL | GPS latitude |
| longitude | DECIMAL(10,7) | NOT NULL | GPS longitude |
| altitude_meters | DECIMAL(6,2) | NULL | GPS altitude |
| accuracy_meters | DECIMAL(6,2) | NULL | GPS accuracy |
| heading_degrees | DECIMAL(5,2) | NULL | GPS heading |
| speed_mps | DECIMAL(5,2) | NULL | GPS speed |
| current_hole_detected | INTEGER | CHECK (1 <= current_hole_detected <= 18) | Auto-detected current hole |
| distance_to_tee_meters | DECIMAL(6,2) | NULL | Real-time distance to tee |
| distance_to_pin_meters | DECIMAL(6,2) | NULL | Real-time distance to pin |
| position_on_hole | VARCHAR(20) | CHECK (position_on_hole IN ('tee', 'fairway', 'rough', 'green', 'hazard', 'unknown')) | Current position on hole |
| movement_speed_mps | DECIMAL(4,2) | NULL | Player movement speed |
| course_boundary_status | BOOLEAN | DEFAULT FALSE | On/off course detection |
| last_shot_location | GEOMETRY(POINT, 4326) | NULL | Previous shot position |
| timestamp | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Location timestamp |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes**:
- `idx_locations_user_id` (user_id)
- `idx_locations_round_id` (round_id)
- `idx_locations_course_id` (course_id)
- `idx_locations_timestamp` (timestamp)
- `idx_locations_current_hole_detected` (current_hole_detected)
- `idx_locations_distance_to_tee` (distance_to_tee_meters)
- `idx_locations_distance_to_pin` (distance_to_pin_meters)
- `idx_locations_position_on_hole` (position_on_hole)
- `idx_locations_course_boundary_status` (course_boundary_status)
- `idx_locations_last_shot_location` (GIST on last_shot_location)

### rounds
**Purpose**: Individual golf round tracking with status and performance metrics

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique round identifier |
| user_id | UUID | NOT NULL, FOREIGN KEY | Reference to users table |
| course_id | UUID | NOT NULL, FOREIGN KEY | Reference to courses table |
| round_date | DATE | NOT NULL | Date of round |
| start_time | TIMESTAMPTZ | NULL | Round start time |
| end_time | TIMESTAMPTZ | NULL | Round end time |
| current_hole | INTEGER | CHECK (1 <= current_hole <= 18) | Current hole being played |
| status | round_status | DEFAULT 'not_started' | Round status |
| total_score | INTEGER | NULL | Total strokes |
| total_putts | INTEGER | NULL | Total putts |
| fairways_hit | INTEGER | DEFAULT 0, CHECK (0 <= fairways_hit <= 18) | Fairways in regulation |
| greens_in_regulation | INTEGER | DEFAULT 0, CHECK (0 <= greens_in_regulation <= 18) | Greens in regulation |
| weather_condition | weather_condition | NULL | Weather during round |
| temperature_celsius | DECIMAL(4,1) | NULL | Temperature |
| wind_speed_kmh | DECIMAL(4,1) | NULL | Wind speed |
| notes | TEXT | NULL | Round notes |
| round_metadata | JSONB | DEFAULT '{}' | Additional round data |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Enums Used**:
- `round_status`: not_started, in_progress, paused, completed, abandoned
- `weather_condition`: sunny, cloudy, overcast, light_rain, heavy_rain, windy, stormy

**Indexes**:
- `idx_rounds_user_id` (user_id)
- `idx_rounds_course_id` (course_id)
- `idx_rounds_round_date` (round_date)
- `idx_rounds_status` (status)
- `idx_rounds_current_hole` (current_hole)
- `idx_rounds_weather_condition` (weather_condition)
- `idx_rounds_user_date` (user_id, round_date)

### chat_sessions
**Purpose**: OpenAI ChatGPT conversation sessions with AI caddie personality

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique session identifier |
| user_id | UUID | NOT NULL, FOREIGN KEY | Reference to users table |
| round_id | UUID | NULL, FOREIGN KEY | Reference to rounds table |
| course_id | UUID | NULL, FOREIGN KEY | Reference to courses table |
| session_name | VARCHAR(255) | NULL | Session name |
| status | chat_session_status | DEFAULT 'active' | Session status |
| context_data | JSONB | DEFAULT '{}' | Conversation context |
| openai_model | VARCHAR(50) | DEFAULT 'gpt-3.5-turbo' | OpenAI model selection |
| system_prompt | TEXT | NULL | System prompt defining AI caddie personality |
| temperature | DECIMAL(3,2) | DEFAULT 0.7, CHECK (temperature >= 0.0 AND temperature <= 2.0) | OpenAI temperature setting |
| max_tokens | INTEGER | DEFAULT 500, CHECK (max_tokens >= 1 AND max_tokens <= 4000) | Token limit management |
| total_messages | INTEGER | DEFAULT 0 | Message count |
| last_message_at | TIMESTAMPTZ | NULL | Last message timestamp |
| session_metadata | JSONB | DEFAULT '{}' | Additional session data |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Enums Used**:
- `chat_session_status`: active, paused, completed, archived

**Indexes**:
- `idx_chat_sessions_user_id` (user_id)
- `idx_chat_sessions_round_id` (round_id)
- `idx_chat_sessions_course_id` (course_id)
- `idx_chat_sessions_status` (status)
- `idx_chat_sessions_openai_model` (openai_model)
- `idx_chat_sessions_last_message_at` (last_message_at)
- `idx_chat_sessions_user_status` (user_id, status)
- `idx_chat_sessions_context_data` (GIN on context_data)

### chat_messages
**Purpose**: ChatGPT conversation messages with token tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique message identifier |
| session_id | UUID | NOT NULL, FOREIGN KEY | Reference to chat_sessions table |
| user_id | UUID | NOT NULL, FOREIGN KEY | Reference to users table |
| message_content | TEXT | NOT NULL | Message content |
| message_type | message_type | NOT NULL | Message type classification |
| openai_role | VARCHAR(20) | DEFAULT 'user', CHECK (openai_role IN ('user', 'assistant', 'system')) | OpenAI role |
| tokens_consumed | INTEGER | NULL | Number of tokens used by OpenAI |
| openai_model_used | VARCHAR(50) | NULL | OpenAI model used for this message |
| context_data | JSONB | DEFAULT '{}' | Message context |
| timestamp | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Message timestamp |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Enums Used**:
- `message_type`: user_message, ai_response, system_message, error_message

**Indexes**:
- `idx_chat_messages_session_id` (session_id)
- `idx_chat_messages_user_id` (user_id)
- `idx_chat_messages_timestamp` (timestamp)
- `idx_chat_messages_message_type` (message_type)
- `idx_chat_messages_openai_role` (openai_role)
- `idx_chat_messages_tokens_consumed` (tokens_consumed)
- `idx_chat_messages_session_timestamp` (session_id, timestamp)

### club_recommendations
**Purpose**: Simplified AI-generated club recommendations via OpenAI ChatGPT

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique recommendation identifier |
| user_id | UUID | NOT NULL, FOREIGN KEY | Reference to users table |
| round_id | UUID | NULL, FOREIGN KEY | Reference to rounds table |
| hole_id | UUID | NULL, FOREIGN KEY | Reference to holes table |
| location_id | UUID | NULL, FOREIGN KEY | Reference to locations table |
| recommended_club | VARCHAR(50) | NOT NULL | Recommended club |
| confidence_score | DECIMAL(3,2) | CHECK (0 <= confidence_score <= 1) | Recommendation confidence |
| distance_to_target | DECIMAL(6,2) | NULL | Distance to target in meters |
| openai_reasoning | TEXT | NULL | OpenAI-generated reasoning |
| context_used | JSONB | DEFAULT '{}' | Context data used for recommendation |
| was_accepted | BOOLEAN | NULL | Whether user accepted recommendation |
| actual_club_used | VARCHAR(50) | NULL | Actual club used by player |
| recommendation_metadata | JSONB | DEFAULT '{}' | Additional recommendation data |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes**:
- `idx_club_recommendations_user_id` (user_id)
- `idx_club_recommendations_round_id` (round_id)
- `idx_club_recommendations_hole_id` (hole_id)
- `idx_club_recommendations_location_id` (location_id)
- `idx_club_recommendations_recommended_club` (recommended_club)
- `idx_club_recommendations_confidence_score` (confidence_score)
- `idx_club_recommendations_was_accepted` (was_accepted)
- `idx_club_recommendations_context_used` (GIN on context_used)

## Migration History

### V1.0.0 - Foundation Setup
- Enabled PostGIS extension
- Created user management system
- Implemented auto-updating triggers
- Added enum types for data consistency

### V1.1.0 - Course and Hole Structure
- Added comprehensive course information
- Implemented hole-by-hole data structure
- Added course hazard mapping
- Created geospatial indexes for performance

### V1.2.0 - Round Tracking
- Added round management system
- Implemented location tracking
- Added hole scoring and statistics
- Created performance metrics tables

### V1.3.0 - AI Features
- Added chat session management
- Implemented AI message storage
- Added club recommendation system
- Created AI feedback mechanism

### V1.4.0 - Faughan Valley Seed Data
- Added Faughan Valley Golf Centre course data
- Populated 18 holes with realistic information
- Added River Faughan hazard mapping
- Included course boundary geofencing

### V1.5.0 - Schema Simplification and OpenAI Integration
- Simplified schema from 12 to 8 core tables
- Removed ai_feedback, ai_conversation_context, course_hazards, round_statistics
- Enhanced locations table for real-time GPS tracking
- Updated holes table with accurate Faughan Valley data and playing tips
- Added OpenAI ChatGPT integration fields to chat_sessions and chat_messages
- Simplified club_recommendations for AI-powered suggestions
- Updated course data with accurate Faughan Valley information

## Data Types and Constraints

### UUID Usage
All primary keys use UUID type with `gen_random_uuid()` default for better distribution and security.

### Geospatial Data
- Uses PostGIS extension for spatial operations
- All coordinates in WGS84 (SRID 4326)
- GIST indexes for spatial queries
- Supports points, lines, and polygons

### JSON Storage
- JSONB used for flexible data storage
- GIN indexes for JSON query performance
- Structured for common query patterns

### Temporal Data
- All timestamps use `TIMESTAMPTZ` for timezone awareness
- Automatic `updated_at` triggers on all main tables
- Audit trail through creation and modification timestamps

## Performance Considerations

### Indexing Strategy
- Primary keys on UUID columns
- Foreign key indexes for join performance
- Geospatial indexes for location queries
- JSON indexes for flexible data queries
- Composite indexes for common query patterns

### Query Optimization
- Use of proper data types for constraints
- Normalized structure with appropriate relationships
- Partitioning consideration for large tables (future)

### Monitoring
- Track slow queries and optimize indexes
- Monitor table sizes and growth patterns
- Regular VACUUM and ANALYZE operations

## Security Considerations

### Access Control
- Row-level security policies (future implementation)
- Proper user permissions and roles
- API-level authorization checks

### Data Protection
- Password hashing (never stored in plain text)
- Sensitive data encryption (future implementation)
- Audit logging for data changes

## Maintenance Procedures

### Regular Tasks
- Weekly VACUUM ANALYZE on large tables
- Monthly index usage review
- Quarterly performance assessment

### Backup Strategy
- Daily automated backups
- Point-in-time recovery capability
- Disaster recovery procedures

### Schema Evolution
- All changes through versioned migrations
- Backward compatibility considerations
- Testing on staging before production

## Related Documentation

- [Migration Documentation](../../changelog/migrations/)
- [Feature Documentation](../database/)
- [API Model Documentation](../../api/models/)
- [Architecture Overview](../../ARCHITECTURE.md)

---

*This schema documentation is automatically updated with each migration and should be reviewed monthly for accuracy.*