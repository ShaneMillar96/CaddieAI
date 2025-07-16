# Database Migrations

**Current Version**: V1.4.0  
**Total Migrations**: 4  
**Database**: PostgreSQL with PostGIS  
**Migration Tool**: Flyway  

## Overview

This document tracks all database migrations for the CaddieAI project, providing a complete history of schema changes and their impact on the system.

## Migration Timeline

```
V1.0.0 (Foundation)
    ↓
V1.1.0 (Course & Holes)
    ↓
V1.2.0 (Rounds & Location)
    ↓
V1.3.0 (AI Features)
    ↓
V1.4.0 (Faughan Valley Data)
```

## Migration Details

### V1.0.0 - Foundation Setup
**File**: `V1.0.0__Create_Initial_Tables.sql`  
**Date**: 2024-01-16  
**Status**: Applied  
**Type**: Schema Creation

#### Changes Made
- **PostGIS Extension**: Enabled geospatial capabilities
- **UUID Extension**: Added UUID generation support
- **Enum Types**: Created foundational enum types
- **Users Table**: Core user management with golf-specific fields
- **Triggers**: Auto-updating timestamp triggers

#### New Tables
- `users` - Core user information with golf preferences

#### New Enums
- `user_status` - active, inactive, suspended
- `skill_level` - beginner, intermediate, advanced, professional

#### New Functions
- `update_updated_at_column()` - Automatic timestamp updates

#### Impact
- Foundation for all user-related functionality
- Enables geospatial operations throughout the system
- Provides audit trail with automatic timestamps

### V1.1.0 - Course and Hole Structure
**File**: `V1.1.0__Create_Course_And_Hole_Tables.sql`  
**Date**: 2024-01-16  
**Status**: Applied  
**Type**: Schema Extension

#### Changes Made
- **Course Management**: Complete golf course information system
- **Hole Details**: Individual hole layout and characteristics
- **Hazard Mapping**: Detailed hazard location and information
- **Geospatial Indexes**: Performance optimization for location queries

#### New Tables
- `courses` - Golf course information with geospatial data
- `holes` - Individual hole details with layout information
- `course_hazards` - Detailed hazard mapping with geometry

#### New Enums
- `course_difficulty` - easy, moderate, difficult, championship
- `hole_type` - par3, par4, par5
- `hazard_type` - water, sand, trees, rough, out_of_bounds

#### Impact
- Enables comprehensive course data management
- Supports detailed hole-by-hole information
- Provides foundation for AI course recommendations

### V1.2.0 - Round Tracking and Location
**File**: `V1.2.0__Create_Round_And_Location_Tables.sql`  
**Date**: 2024-01-16  
**Status**: Applied  
**Type**: Schema Extension

#### Changes Made
- **Round Management**: Complete golf round tracking system
- **GPS Integration**: Real-time location tracking and positioning
- **Performance Metrics**: Detailed scoring and statistics
- **Weather Tracking**: Environmental conditions during play

#### New Tables
- `rounds` - Individual golf round tracking
- `locations` - GPS positioning and course position tracking
- `hole_scores` - Individual hole performance tracking
- `round_statistics` - Calculated performance metrics

#### New Enums
- `round_status` - not_started, in_progress, paused, completed, abandoned
- `weather_condition` - sunny, cloudy, overcast, light_rain, heavy_rain, windy, stormy
- `location_source` - gps, manual, estimated, course_data

#### Impact
- Enables real-time round tracking and scoring
- Supports GPS-based course positioning
- Provides comprehensive performance analytics

### V1.3.0 - AI Features
**File**: `V1.3.0__Create_AI_Features_Tables.sql`  
**Date**: 2024-01-16  
**Status**: Applied  
**Type**: Schema Extension

#### Changes Made
- **Chat System**: AI conversation management and context
- **Recommendations**: AI-generated club suggestions with reasoning
- **Feedback System**: User feedback on AI interactions
- **Context Management**: Conversation context and learning

#### New Tables
- `chat_sessions` - AI conversation context management
- `chat_messages` - Individual AI conversation messages
- `club_recommendations` - AI-generated club suggestions
- `ai_conversation_context` - Contextual information for AI responses
- `ai_feedback` - User feedback on AI responses and recommendations

#### New Enums
- `chat_message_type` - user, assistant, system
- `chat_session_status` - active, paused, completed, archived
- `club_type` - driver, fairway_wood, hybrid, iron, wedge, putter
- `recommendation_confidence` - very_low, low, medium, high, very_high

#### Impact
- Enables AI-powered conversational features
- Supports intelligent club recommendations
- Provides learning mechanism through user feedback

### V1.4.0 - Faughan Valley Golf Centre Data
**File**: `V1.4.0__Insert_Faughan_Valley_Golf_Centre_Data.sql`  
**Date**: 2024-01-16  
**Status**: Applied  
**Type**: Data Seeding

#### Changes Made
- **Course Data**: Complete Faughan Valley Golf Centre information
- **Hole Information**: All 18 holes with realistic yardages and pars
- **Hazard Mapping**: River Faughan water hazard integration
- **Geospatial Setup**: Course boundary and location data

#### Data Inserted
- **1 Course**: Faughan Valley Golf Centre (Par 69, 5,453 yards)
- **18 Holes**: Complete hole-by-hole information
- **1 Major Hazard**: River Faughan water hazard
- **Course Boundary**: 800-meter radius geofencing

#### Impact
- Provides real course data for development and testing
- Enables immediate MVP functionality
- Supports Northern Ireland location testing

## Migration Statistics

### Schema Growth
- **V1.0.0**: 1 table, 2 enums, 1 function
- **V1.1.0**: +3 tables, +3 enums
- **V1.2.0**: +4 tables, +3 enums
- **V1.3.0**: +5 tables, +4 enums
- **V1.4.0**: +Seed data (1 course, 18 holes, 1 hazard)

### Current State
- **Total Tables**: 12
- **Total Enums**: 12
- **Total Functions**: 1
- **Total Triggers**: 10 (auto-update triggers)
- **Total Indexes**: 54 (including GIN and GIST)

## Future Migrations

### Planned V1.5.0 - User Authentication
- JWT token management
- Password reset functionality
- Session management
- Role-based access control

### Planned V1.6.0 - Performance Optimization
- Partitioning for large tables
- Additional composite indexes
- Query optimization
- Materialized views for analytics

### Planned V1.7.0 - API Integration
- External API reference fields
- Data synchronization tracking
- Version control for external data
- Conflict resolution mechanisms

## Best Practices

### Migration Development
1. **Small, Focused Changes**: Each migration should have a single purpose
2. **Backward Compatibility**: Avoid breaking changes when possible
3. **Testing**: Test migrations on development and staging environments
4. **Documentation**: Update schema documentation with each migration
5. **Rollback Planning**: Always have a rollback strategy

### Naming Conventions
- **Files**: `V{version}__{Description}.sql`
- **Versions**: Semantic versioning (Major.Minor.Patch)
- **Descriptions**: Clear, concise description of changes
- **Tables**: Lowercase with underscores
- **Columns**: Lowercase with underscores
- **Indexes**: `idx_tablename_columnname`

### Performance Considerations
- **Index Creation**: Create indexes for foreign keys and query patterns
- **Data Types**: Use appropriate data types for constraints
- **Constraints**: Add constraints for data integrity
- **Triggers**: Minimize trigger complexity

## Troubleshooting

### Common Issues
1. **Migration Fails**: Check Flyway logs for detailed error messages
2. **Performance Issues**: Monitor query execution times after migrations
3. **Data Integrity**: Verify constraints and foreign key relationships
4. **Rollback Needed**: Follow documented rollback procedures

### Monitoring
- **Migration Status**: Check `flyway_schema_history` table
- **Performance Impact**: Monitor query response times
- **Error Logging**: Review database logs for migration-related errors
- **Data Validation**: Run integrity checks after migrations

## Related Documentation

- [Database Schema](./schema.md)
- [Migration Templates](../../_templates/migration-template.md)
- [Development Setup](../../development/setup/database-setup.md)
- [Rollback Procedures](../../development/database-rollback.md)

---

*This migration documentation is updated with each new migration and provides the complete history of database schema evolution.*