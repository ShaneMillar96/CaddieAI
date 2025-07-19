# Location Tracking API

**Status**: Completed  
**Version**: v1.0.0  
**Author**: Claude Code  
**Date**: 2025-07-19  
**Related Task**: ECS-28

## Overview

The Location Tracking API provides comprehensive GPS position management and course boundary detection functionality within the CaddieAI application. This feature enables real-time location tracking, geospatial calculations, and intelligent course awareness to enhance the golf experience through precise positioning data.

The API leverages PostGIS spatial database capabilities to deliver accurate distance calculations, course boundary detection, and position classification, forming the foundation for location-based AI coaching and course guidance features.

## Requirements

### Functional Requirements
- [x] Create, read, update, and delete GPS location records
- [x] Real-time distance calculations to tee, pin, and course features
- [x] Course boundary detection using geospatial algorithms
- [x] Automatic hole detection based on player position
- [x] Position classification (tee, fairway, rough, green, hazard)
- [x] Shot tracking and distance analysis
- [x] Location history and movement patterns
- [x] Proximity-based queries for nearby locations
- [x] Comprehensive location statistics and analytics

### Non-Functional Requirements
- [x] Sub-second response times for location operations
- [x] Accurate geospatial calculations using PostGIS
- [x] Efficient spatial indexing for performance
- [x] Comprehensive error handling and logging
- [x] Integration with existing authentication system
- [x] Type-safe operations with proper validation

## Technical Implementation

### Architecture Overview

The Location Tracking API follows the established Clean Architecture pattern with clear separation of concerns:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Controller    │───▶│    Service       │───▶│   Repository    │
│   (API Layer)   │    │ (Business Logic) │    │ (Data Access)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│      DTOs       │    │   Service Models │    │ Entity Models   │
│ (Request/Resp)  │    │   (Domain)       │    │  (Database)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Database Integration

The Location Tracking API integrates with the existing database schema:

- **Location Entity**: Enhanced GPS tracking model with geospatial fields
- **PostGIS Integration**: Spatial database capabilities for geometric operations
- **Existing Schema**: Works with V1.2.0 migration (`Create_Round_And_Location_Tables.sql`)
- **Spatial Indexes**: Optimized for geometric queries and proximity searches

### Repository Layer Implementation

#### ILocationRepository Interface
**File**: `backend/src/caddie.portal.dal/Repositories/Interfaces/ILocationRepository.cs`

Comprehensive interface with 25+ methods organized into logical groups:

**Basic CRUD Operations**:
- `CreateAsync`, `UpdateAsync`, `DeleteAsync`, `GetByIdAsync`
- `GetByUserIdAsync`, `GetByRoundIdAsync`, `GetByCourseIdAsync`

**Geospatial Distance Calculations**:
- `CalculateDistanceToTeeAsync` - Real-time tee distance
- `CalculateDistanceToPinAsync` - Real-time pin distance  
- `CalculateDistanceBetweenLocationsAsync` - Shot distance tracking
- `CalculateDistanceFromPointAsync` - Generic point-to-target distance

**Course Boundary Detection**:
- `IsWithinCourseBoundaryAsync` - Course boundary validation
- `DetectCurrentHoleAsync` - Automatic hole detection
- `DetectPositionOnHoleAsync` - Position classification

**Proximity and Spatial Queries**:
- `GetLocationsWithinRadiusAsync` - Radius-based location queries
- `GetNearbyLocationsAsync` - Find nearby recorded positions
- `IsNearLocationAsync` - Proximity validation

**Shot Tracking and Analysis**:
- `GetLastShotLocationAsync` - Previous shot position
- `CalculateLastShotDistanceAsync` - Shot distance calculation
- `GetShotSequenceAsync` - Complete hole shot tracking

**Statistics and Analytics**:
- `GetLocationStatisticsAsync` - Comprehensive location metrics
- `GetHolePositionAnalysisAsync` - Position-based performance analysis
- `GetAverageDistanceToTargetAsync` - Statistical distance analysis

#### LocationRepository Implementation
**File**: `backend/src/caddie.portal.dal/Repositories/LocationRepository.cs`

**Key Features**:
- **PostGIS Integration**: Uses spatial functions for accurate calculations
- **Error Handling**: Comprehensive exception handling with detailed logging
- **Performance Optimization**: Efficient queries with proper indexing
- **Type Safety**: Proper nullable handling and enum-based operations

**PostGIS Functions Used**:
- `ST_Distance()` - Distance calculations between geometric points
- `ST_Within()` - Point-in-polygon testing for boundary detection
- `ST_DWithin()` - Proximity queries within specified distance
- `ST_Transform()` - Coordinate system transformations (EPSG:4326 ↔ EPSG:3857)

### Geospatial Calculations

#### Distance Calculations
The API provides accurate distance measurements using PostGIS spatial functions:

```sql
-- Example: Distance calculation with coordinate transformation
ST_Distance(
    ST_Transform(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326), 3857),
    ST_Transform(target_geometry, 3857)
)
```

**Supported Distance Types**:
- **Tee Distance**: Player position to hole tee box
- **Pin Distance**: Player position to hole pin/flag
- **Shot Distance**: Distance between consecutive positions
- **Feature Distance**: Distance to course features (hazards, landmarks)

#### Course Boundary Detection
Intelligent boundary detection using multiple strategies:

1. **Defined Boundaries**: Uses course polygon geometry when available
2. **Proximity-Based**: Falls back to distance from course center
3. **Contextual Detection**: Considers hole layouts and playing areas

#### Position Classification
Smart position detection based on proximity to course features:

- **Tee**: Within 30 meters of tee location
- **Green**: Within 20 meters of pin location  
- **Fairway**: Within 30 meters of fairway center line
- **Rough**: Default for areas outside specific zones
- **Hazard**: Based on hazard geometry or proximity to water/sand

## Dependencies

### External Dependencies
- **PostGIS**: Spatial database extension for PostgreSQL
- **NetTopologySuite**: .NET spatial library for geometry handling
- **Entity Framework Core**: ORM with PostGIS support
- **Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite**: EF Core PostGIS provider

### Internal Dependencies
- **Course Management**: Integration with course and hole data
- **Round Management**: Location tracking during active rounds
- **User Management**: User authentication and data isolation

## Performance Characteristics

### Response Time Requirements
- **Basic CRUD**: <100ms for standard operations
- **Distance Calculations**: <200ms for real-time calculations
- **Boundary Detection**: <150ms for course validation
- **Analytics Queries**: <2s for complex statistical calculations

### Optimization Strategies
- **Spatial Indexing**: GIN and GIST indexes on geometry columns
- **Query Optimization**: Efficient use of PostGIS spatial functions
- **Coordinate Transformations**: Optimized projection handling
- **Batched Operations**: Bulk updates for performance-critical scenarios

## Usage Examples

### Basic Location Operations

```csharp
// Create new location record
var location = new Location
{
    UserId = userId,
    RoundId = roundId,
    CourseId = courseId,
    Latitude = 54.6063m,
    Longitude = -5.8818m,
    AccuracyMeters = 5.0m,
    Timestamp = DateTime.UtcNow
};

var createdLocation = await _locationRepository.CreateAsync(location);
```

### Distance Calculations

```csharp
// Calculate distance to tee
var distanceToTee = await _locationRepository
    .CalculateDistanceToTeeAsync(userId, courseId, holeNumber);

// Calculate distance to pin
var distanceToPin = await _locationRepository
    .CalculateDistanceToPinAsync(userId, courseId, holeNumber);

// Calculate shot distance
var shotDistance = await _locationRepository
    .CalculateLastShotDistanceAsync(userId, roundId);
```

### Course Boundary Detection

```csharp
// Check if player is within course boundaries
var isWithinCourse = await _locationRepository
    .IsWithinCourseBoundaryAsync(latitude, longitude, courseId);

// Detect current hole
var currentHole = await _locationRepository
    .DetectCurrentHoleAsync(latitude, longitude, courseId);

// Classify position on hole
var position = await _locationRepository
    .DetectPositionOnHoleAsync(latitude, longitude, courseId, holeNumber);
```

### Analytics and Statistics

```csharp
// Get location statistics for user
var stats = await _locationRepository
    .GetLocationStatisticsAsync(userId, startDate, endDate);

// Analyze hole position patterns
var positionAnalysis = await _locationRepository
    .GetHolePositionAnalysisAsync(userId, courseId, holeNumber);

// Calculate average distances
var avgDistanceToPin = await _locationRepository
    .GetAverageDistanceToTargetAsync(userId, courseId, holeNumber, "pin");
```

## Integration Points

### Round Management Integration
- **Active Round Tracking**: Link location data to ongoing golf rounds
- **Round Progress**: Track player movement through holes
- **Performance Metrics**: Calculate round-specific location statistics

### AI Coaching Integration
- **Position-Based Recommendations**: Club suggestions based on current position
- **Course Strategy**: Optimal playing lines and target identification
- **Performance Analysis**: Shot pattern analysis and improvement suggestions

### Mobile Application Integration
- **Real-Time Updates**: Continuous GPS tracking during rounds
- **Offline Capability**: Store locations locally and sync when connected
- **Battery Optimization**: Efficient location tracking algorithms

## Security Considerations

### Data Privacy
- **User Isolation**: Locations are strictly user-specific
- **Round Association**: Proper validation of round ownership
- **Data Retention**: Configurable retention policies for location history

### Access Control
- **Authentication Required**: All operations require valid JWT token
- **Authorization**: Users can only access their own location data
- **Admin Access**: Support staff can view locations for troubleshooting

### Data Protection
- **Geospatial Privacy**: Optional location anonymization features
- **Audit Trail**: Comprehensive logging of location access and modifications
- **Encryption**: Sensitive location data encrypted at rest and in transit

## Error Handling

### Common Error Scenarios
1. **Invalid Coordinates**: Validation of latitude/longitude ranges
2. **Missing Course Data**: Graceful handling of incomplete course information
3. **Calculation Failures**: Fallback strategies for PostGIS operation errors
4. **Performance Issues**: Timeout handling for complex spatial queries

### Error Response Patterns
```csharp
try
{
    var result = await _locationRepository.CalculateDistanceToTeeAsync(userId, courseId, holeNumber);
    return result;
}
catch (InvalidOperationException ex)
{
    _logger.LogWarning("Invalid calculation parameters: {Error}", ex.Message);
    return null;
}
catch (Exception ex)
{
    _logger.LogError(ex, "Unexpected error in distance calculation");
    throw;
}
```

## Testing Strategy

### Unit Tests
- **Interface Validation**: Verify all interface methods are implemented
- **Calculation Accuracy**: Test distance calculation algorithms
- **Boundary Detection**: Validate course boundary logic
- **Error Handling**: Test exception scenarios and edge cases

### Integration Tests
- **Database Operations**: Test with real PostGIS database
- **Spatial Queries**: Validate PostGIS function integration
- **Performance Tests**: Measure response times under load
- **Data Consistency**: Verify referential integrity

### Manual Testing Scenarios
- **Real-World GPS Data**: Test with actual golf course coordinates
- **Course Boundary Edge Cases**: Test boundary detection accuracy
- **Multi-User Scenarios**: Validate concurrent location tracking
- **Mobile Integration**: Test with actual GPS hardware

## Monitoring and Logging

### Key Metrics
- **Operation Response Times**: Track API performance
- **Calculation Accuracy**: Monitor spatial calculation precision
- **Error Rates**: Track failed operations and root causes
- **Usage Patterns**: Analyze location tracking frequency and patterns

### Logging Framework
```csharp
// Success logging
_logger.LogInformation("Location created successfully: ID {LocationId}", locationId);

// Warning logging
_logger.LogWarning("Course boundary undefined for course {CourseId}", courseId);

// Error logging
_logger.LogError(ex, "Failed to calculate distance for user {UserId}", userId);
```

### Health Checks
- **Database Connectivity**: Verify PostGIS availability
- **Spatial Function Health**: Test critical PostGIS operations
- **Performance Thresholds**: Alert on response time degradation

## Future Enhancements

### Planned Features
- **Real-Time Streaming**: WebSocket-based live location updates
- **Advanced Analytics**: Machine learning-based position prediction
- **Weather Integration**: Location-aware weather data correlation
- **Social Features**: Location sharing and group tracking

### Scalability Improvements
- **Clustering**: PostGIS cluster support for high availability
- **Caching**: Redis-based caching for frequent calculations
- **Microservices**: Extract location service for independent scaling
- **Event-Driven**: Pub/sub architecture for location updates

### Integration Opportunities
- **Wearable Devices**: GPS watch and fitness tracker integration
- **Course Management Systems**: Integration with tee time and course data
- **Tournament Platforms**: Live scoring and player tracking
- **Broadcast Systems**: Real-time location data for tournament coverage

## Troubleshooting

### Common Issues

1. **Issue**: "PostGIS functions not available"
   - **Cause**: PostGIS extension not installed or enabled
   - **Solution**: Verify PostGIS installation and enable extension in database

2. **Issue**: "Inaccurate distance calculations"
   - **Cause**: Incorrect coordinate system or transformation
   - **Solution**: Verify SRID values and coordinate transformation logic

3. **Issue**: "Course boundary detection fails"
   - **Cause**: Missing or invalid course boundary geometry
   - **Solution**: Validate course polygon data and boundary definitions

4. **Issue**: "Poor performance on spatial queries"
   - **Cause**: Missing spatial indexes or inefficient query patterns
   - **Solution**: Create appropriate GIST indexes and optimize query structure

### Debugging Tips
- **Enable Spatial Query Logging**: Log PostGIS SQL for analysis
- **Validate Geometry Data**: Check course and hole geometry validity
- **Monitor Index Usage**: Ensure spatial indexes are being utilized
- **Test Coordinate Transformations**: Verify projection accuracy

## Related Documentation

- [Database Schema](../database/schema.md)
- [Course Management API](../course-management/course-management-api.md)
- [Round Management API](../round-management/round-management-api.md)
- [PostGIS Integration Guide](../../technical/postgis-integration.md)
- [Mobile GPS Integration](../../mobile/gps-integration.md)

## Changelog

### v1.0.0 (2025-07-19)
- Initial implementation of Location Tracking API
- ILocationRepository interface with 25+ methods
- LocationRepository implementation with PostGIS integration
- Comprehensive geospatial calculations and boundary detection
- Real-time distance calculations for tee, pin, and course features
- Position classification and hole detection algorithms
- Shot tracking and movement analysis capabilities
- Location statistics and analytics functionality
- Integration with existing authentication and course management systems
- Complete unit test coverage and build verification

---

*This documentation should be updated whenever the Location Tracking API is modified or enhanced.*