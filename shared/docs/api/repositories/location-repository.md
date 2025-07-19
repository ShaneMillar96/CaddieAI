# LocationRepository API Reference

**Interface**: `ILocationRepository`  
**Implementation**: `LocationRepository`  
**Namespace**: `caddie.portal.dal.Repositories`  
**Version**: v1.0.0

## Overview

The LocationRepository provides comprehensive GPS position management and geospatial calculations using PostGIS spatial database capabilities. This repository handles real-time location tracking, course boundary detection, and position-based analytics.

## Interface Methods

### Basic CRUD Operations

#### `Task<Location?> GetByIdAsync(int id)`
Retrieves a location record by its unique identifier.

**Parameters:**
- `id` (int): The location record ID

**Returns:** Location object or null if not found

---

#### `Task<Location?> GetByIdWithDetailsAsync(int id)`
Retrieves a location record with related entities (User, Round, Course).

**Parameters:**
- `id` (int): The location record ID

**Returns:** Location object with navigation properties loaded

---

#### `Task<IEnumerable<Location>> GetByUserIdAsync(int userId)`
Gets all location records for a specific user, ordered by timestamp descending.

**Parameters:**
- `userId` (int): The user ID

**Returns:** Collection of user's location records

---

#### `Task<IEnumerable<Location>> GetByRoundIdAsync(int roundId)`
Gets all location records for a specific golf round, ordered by timestamp ascending.

**Parameters:**
- `roundId` (int): The round ID

**Returns:** Collection of round's location records

---

#### `Task<IEnumerable<Location>> GetByCourseIdAsync(int courseId)`
Gets all location records for a specific course, ordered by timestamp descending.

**Parameters:**
- `courseId` (int): The course ID

**Returns:** Collection of course location records

---

#### `Task<Location> CreateAsync(Location location)`
Creates a new location record with automatic timestamp management.

**Parameters:**
- `location` (Location): The location object to create

**Returns:** Created location with generated ID and timestamps

---

#### `Task<Location> UpdateAsync(Location location)`
Updates an existing location record with automatic timestamp management.

**Parameters:**
- `location` (Location): The location object to update

**Returns:** Updated location object

---

#### `Task<bool> DeleteAsync(int id)`
Deletes a location record by ID.

**Parameters:**
- `id` (int): The location record ID

**Returns:** True if deleted successfully, false if not found

---

#### `Task<bool> ExistsAsync(int id)`
Checks if a location record exists.

**Parameters:**
- `id` (int): The location record ID

**Returns:** True if location exists, false otherwise

### Location Tracking Queries

#### `Task<Location?> GetLatestLocationByUserIdAsync(int userId)`
Gets the most recent location record for a user.

**Parameters:**
- `userId` (int): The user ID

**Returns:** Most recent location or null

---

#### `Task<Location?> GetLatestLocationByRoundIdAsync(int roundId)`
Gets the most recent location record for a round.

**Parameters:**
- `roundId` (int): The round ID

**Returns:** Most recent location or null

---

#### `Task<IEnumerable<Location>> GetLocationHistoryAsync(int userId, DateTime startTime, DateTime endTime)`
Gets location history for a user within a time range.

**Parameters:**
- `userId` (int): The user ID
- `startTime` (DateTime): Start of time range
- `endTime` (DateTime): End of time range

**Returns:** Location records within time range

---

#### `Task<IEnumerable<Location>> GetRoundLocationHistoryAsync(int roundId)`
Gets complete location history for a golf round.

**Parameters:**
- `roundId` (int): The round ID

**Returns:** All location records for the round

---

#### `Task<IEnumerable<Location>> GetLocationsByTimeRangeAsync(int userId, DateTime startTime, DateTime endTime)`
Gets user locations within a specific time range.

**Parameters:**
- `userId` (int): The user ID
- `startTime` (DateTime): Start of time range
- `endTime` (DateTime): End of time range

**Returns:** Location records within time range

### Geospatial Distance Calculations

#### `Task<decimal?> CalculateDistanceToTeeAsync(int userId, int courseId, int holeNumber)`
Calculates real-time distance from user's current position to hole tee.

**Parameters:**
- `userId` (int): The user ID
- `courseId` (int): The course ID
- `holeNumber` (int): The hole number (1-18)

**Returns:** Distance in meters or null if calculation fails

**PostGIS Functions Used:** `ST_Distance`, `ST_Transform`

---

#### `Task<decimal?> CalculateDistanceToPinAsync(int userId, int courseId, int holeNumber)`
Calculates real-time distance from user's current position to hole pin.

**Parameters:**
- `userId` (int): The user ID
- `courseId` (int): The course ID
- `holeNumber` (int): The hole number (1-18)

**Returns:** Distance in meters or null if calculation fails

**PostGIS Functions Used:** `ST_Distance`, `ST_Transform`

---

#### `Task<decimal?> CalculateDistanceBetweenLocationsAsync(int locationId1, int locationId2)`
Calculates distance between two recorded locations.

**Parameters:**
- `locationId1` (int): First location ID
- `locationId2` (int): Second location ID

**Returns:** Distance in meters or null if calculation fails

**PostGIS Functions Used:** `ST_Distance`, `ST_Transform`

---

#### `Task<decimal?> CalculateDistanceFromPointAsync(decimal latitude, decimal longitude, int courseId, int holeNumber, string targetType)`
Calculates distance from specific coordinates to a target (tee or pin).

**Parameters:**
- `latitude` (decimal): Latitude coordinate
- `longitude` (decimal): Longitude coordinate
- `courseId` (int): The course ID
- `holeNumber` (int): The hole number
- `targetType` (string): "tee", "pin", or "flag"

**Returns:** Distance in meters or null if calculation fails

### Course Boundary Detection

#### `Task<bool> IsWithinCourseBoundaryAsync(decimal latitude, decimal longitude, int courseId)`
Determines if coordinates are within course boundaries.

**Parameters:**
- `latitude` (decimal): Latitude coordinate
- `longitude` (decimal): Longitude coordinate
- `courseId` (int): The course ID

**Returns:** True if within course boundaries, false otherwise

**PostGIS Functions Used:** `ST_Within`, `ST_Distance`

**Fallback Logic:** If no boundary geometry exists, checks if within 2km of course center

---

#### `Task<int?> DetectCurrentHoleAsync(decimal latitude, decimal longitude, int courseId)`
Automatically detects which hole the player is currently on.

**Parameters:**
- `latitude` (decimal): Latitude coordinate
- `longitude` (decimal): Longitude coordinate
- `courseId` (int): The course ID

**Returns:** Hole number (1-18) or null if detection fails

**Algorithm:** Finds closest hole tee to current position

---

#### `Task<string?> DetectPositionOnHoleAsync(decimal latitude, decimal longitude, int courseId, int holeNumber)`
Classifies player position on a specific hole.

**Parameters:**
- `latitude` (decimal): Latitude coordinate
- `longitude` (decimal): Longitude coordinate
- `courseId` (int): The course ID
- `holeNumber` (int): The hole number

**Returns:** Position classification: "tee", "fairway", "rough", "green", "hazard", "unknown"

**Classification Logic:**
- **Tee**: Within 30m of tee location
- **Green**: Within 20m of pin location
- **Fairway**: Within 30m of fairway center line
- **Rough**: Default for other areas within hole layout
- **Hazard**: Near water hazards or sand bunkers (future enhancement)

### Proximity and Spatial Queries

#### `Task<IEnumerable<Location>> GetLocationsWithinRadiusAsync(decimal latitude, decimal longitude, decimal radiusMeters)`
Finds all locations within a specified radius of coordinates.

**Parameters:**
- `latitude` (decimal): Center latitude
- `longitude` (decimal): Center longitude
- `radiusMeters` (decimal): Search radius in meters

**Returns:** Locations within radius

**PostGIS Functions Used:** `ST_DWithin`, `ST_Transform`

---

#### `Task<IEnumerable<Location>> GetNearbyLocationsAsync(int locationId, decimal radiusMeters)`
Finds locations near a specific recorded location.

**Parameters:**
- `locationId` (int): Reference location ID
- `radiusMeters` (decimal): Search radius in meters

**Returns:** Nearby locations within radius

---

#### `Task<bool> IsNearLocationAsync(decimal latitude, decimal longitude, decimal targetLatitude, decimal targetLongitude, decimal thresholdMeters)`
Checks if two coordinates are within a distance threshold.

**Parameters:**
- `latitude` (decimal): First coordinate latitude
- `longitude` (decimal): First coordinate longitude
- `targetLatitude` (decimal): Target latitude
- `targetLongitude` (decimal): Target longitude
- `thresholdMeters` (decimal): Distance threshold

**Returns:** True if within threshold, false otherwise

### Shot Tracking and Analysis

#### `Task<Location?> GetLastShotLocationAsync(int userId, int roundId)`
Gets the most recent shot location for a user in a round.

**Parameters:**
- `userId` (int): The user ID
- `roundId` (int): The round ID

**Returns:** Last shot location or null

---

#### `Task<decimal?> CalculateLastShotDistanceAsync(int userId, int roundId)`
Calculates distance of the last shot taken.

**Parameters:**
- `userId` (int): The user ID
- `roundId` (int): The round ID

**Returns:** Shot distance in meters or null

---

#### `Task<IEnumerable<Location>> GetShotSequenceAsync(int roundId, int holeNumber)`
Gets complete shot sequence for a specific hole.

**Parameters:**
- `roundId` (int): The round ID
- `holeNumber` (int): The hole number

**Returns:** Ordered sequence of shot locations

### Real-time Updates

#### `Task<Location> UpdateLocationWithCalculationsAsync(Location location)`
Updates location with automatic distance and boundary calculations.

**Parameters:**
- `location` (Location): Location to update with calculations

**Returns:** Updated location with calculated fields

**Calculated Fields:**
- `DistanceToTeeMeters`
- `DistanceToPinMeters`
- `PositionOnHole`
- `CourseBoundaryStatus`

---

#### `Task<bool> UpdateCourseBoundaryStatusAsync(int locationId, bool isWithinBoundary)`
Updates the course boundary status for a location.

**Parameters:**
- `locationId` (int): The location ID
- `isWithinBoundary` (bool): Boundary status

**Returns:** True if updated successfully

---

#### `Task<bool> UpdateDistanceCalculationsAsync(int locationId, decimal? distanceToTee, decimal? distanceToPin)`
Updates distance calculations for a location.

**Parameters:**
- `locationId` (int): The location ID
- `distanceToTee` (decimal?): Distance to tee in meters
- `distanceToPin` (decimal?): Distance to pin in meters

**Returns:** True if updated successfully

### Statistics and Analytics

#### `Task<object?> GetLocationStatisticsAsync(int userId, DateTime? startDate = null, DateTime? endDate = null)`
Gets comprehensive location statistics for a user.

**Parameters:**
- `userId` (int): The user ID
- `startDate` (DateTime?): Optional start date filter
- `endDate` (DateTime?): Optional end date filter

**Returns:** Statistics object with metrics:
- `TotalLocations`: Total location records
- `AverageAccuracy`: Average GPS accuracy
- `TotalDistance`: Sum of distances to tee
- `AverageSpeed`: Average movement speed
- `TimeSpan`: Total time range
- `CoursesVisited`: Number of unique courses

---

#### `Task<IEnumerable<object>> GetHolePositionAnalysisAsync(int userId, int courseId, int holeNumber)`
Analyzes position patterns for a specific hole.

**Parameters:**
- `userId` (int): The user ID
- `courseId` (int): The course ID
- `holeNumber` (int): The hole number

**Returns:** Position analysis grouped by position type:
- `Position`: Position classification
- `Count`: Number of recordings
- `AverageDistanceToPin`: Average distance to pin
- `MinDistanceToPin`: Minimum distance to pin
- `MaxDistanceToPin`: Maximum distance to pin

---

#### `Task<decimal?> GetAverageDistanceToTargetAsync(int userId, int courseId, int holeNumber, string targetType)`
Calculates average distance to target for a user on a specific hole.

**Parameters:**
- `userId` (int): The user ID
- `courseId` (int): The course ID
- `holeNumber` (int): The hole number
- `targetType` (string): "pin" or "tee"

**Returns:** Average distance in meters or null

### Pagination and Filtering

#### `Task<IEnumerable<Location>> GetPaginatedAsync(int page, int pageSize, int? userId = null, int? roundId = null, int? courseId = null)`
Gets paginated location results with optional filtering.

**Parameters:**
- `page` (int): Page number (1-based)
- `pageSize` (int): Records per page
- `userId` (int?): Optional user filter
- `roundId` (int?): Optional round filter
- `courseId` (int?): Optional course filter

**Returns:** Paginated location records

---

#### `Task<int> GetTotalCountAsync(int? userId = null, int? roundId = null, int? courseId = null)`
Gets total count of locations with optional filtering.

**Parameters:**
- `userId` (int?): Optional user filter
- `roundId` (int?): Optional round filter
- `courseId` (int?): Optional course filter

**Returns:** Total count matching filters

## PostGIS Integration

### Coordinate Systems
- **Input Coordinates**: EPSG:4326 (WGS84 - GPS coordinates)
- **Calculation Coordinates**: EPSG:3857 (Web Mercator - for accurate meter-based distances)
- **Automatic Transformation**: ST_Transform handles coordinate system conversions

### Spatial Functions Used
- **ST_Distance**: Accurate distance calculations between geometries
- **ST_Within**: Point-in-polygon testing for boundary detection
- **ST_DWithin**: Proximity queries within specified distance
- **ST_Transform**: Coordinate system transformations
- **ST_MakePoint**: Create point geometries from coordinates
- **ST_SetSRID**: Set spatial reference identifier for geometries

### Performance Considerations
- **Spatial Indexes**: Utilizes GIST indexes for fast spatial queries
- **Coordinate Transformations**: Optimized projection handling for accuracy
- **Query Optimization**: Efficient PostGIS function usage patterns
- **Batched Operations**: Support for bulk spatial calculations

## Error Handling

### Common Exceptions
- **InvalidOperationException**: Invalid parameters or missing data
- **ArgumentException**: Invalid coordinate ranges or IDs
- **SqlException**: Database connectivity or PostGIS function errors
- **TimeoutException**: Long-running spatial query timeouts

### Logging Patterns
```csharp
// Success
_logger.LogInformation("Location created successfully: ID {LocationId}", locationId);

// Warning
_logger.LogWarning("Course boundary undefined for course {CourseId}", courseId);

// Error
_logger.LogError(ex, "Failed to calculate distance for user {UserId}", userId);
```

## Usage Best Practices

### Performance Optimization
1. **Batch Operations**: Use bulk operations for multiple locations
2. **Index Utilization**: Ensure spatial indexes are properly configured
3. **Coordinate Caching**: Cache frequently used course geometry data
4. **Query Filtering**: Use specific filters to limit result sets

### Data Integrity
1. **Validation**: Validate latitude/longitude ranges before storage
2. **Null Handling**: Properly handle optional geospatial calculations
3. **Referential Integrity**: Verify course/hole/round relationships
4. **Timestamp Management**: Use UTC timestamps consistently

### Security Considerations
1. **User Isolation**: Always filter by user context
2. **Data Privacy**: Consider location data sensitivity
3. **Input Validation**: Validate all coordinate inputs
4. **Access Control**: Implement proper authorization checks

---

**Last Updated**: 2025-07-19  
**Version**: v1.0.0  
**Related Documentation**: [Location Tracking API](../features/location-tracking/location-tracking-api.md)