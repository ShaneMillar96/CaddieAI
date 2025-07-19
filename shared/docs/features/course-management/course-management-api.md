# Course Management API

**Status**: Completed  
**Version**: v1.0.0  
**Author**: Claude (AI Assistant)  
**Date**: 2025-01-19  
**Related Task**: ECS-26

## Overview

The Course Management API provides comprehensive functionality for managing golf course data within the CaddieAI platform. This feature enables full CRUD operations on golf course information, including geospatial queries for location-based services, course search capabilities, and integration with the existing authentication system.

The API serves as the foundation for course discovery, selection, and management workflows, supporting both administrative functions and user-facing features like nearby course discovery and course information retrieval.

## Requirements

### Functional Requirements
- [x] Create, read, update, and delete golf course records
- [x] Search courses by name, location, and other attributes
- [x] Find nearby courses within a specified radius
- [x] Filter courses by region (city, state, country)
- [x] Validate course name availability
- [x] Check if a location is within course boundaries
- [x] Calculate distance from a location to a course
- [x] Paginated course listing with search capabilities
- [x] Support for comprehensive course metadata (holes, amenities, etc.)

### Non-Functional Requirements
- [x] Authentication required for create, update, and delete operations
- [x] Geospatial queries using PostGIS for optimal performance
- [x] Input validation with comprehensive error handling
- [x] RESTful API design following established patterns
- [x] Proper HTTP status codes and standardized error responses
- [x] Support for nullable fields and flexible data structures

## Technical Implementation

### Architecture Overview
The Course Management API follows the established Clean Architecture pattern with clear separation of concerns:

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
- **Existing Tables**: Utilizes existing `courses` and `holes` tables from the database schema
- **Geospatial Support**: Full PostGIS integration for location-based queries
- **Relationships**: Manages course-hole relationships with proper foreign key constraints
- **Data Types**: Supports Point and Polygon geometries for location and boundary data

### API Endpoints

#### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/course` | Get paginated courses with optional search |
| GET | `/api/course/{id}` | Get course by ID with full details |
| GET | `/api/course/name/{name}` | Get course by name |
| POST | `/api/course/nearby` | Find courses within radius of location |
| POST | `/api/course/region` | Get courses by region |
| GET | `/api/course/check-name/{name}` | Check course name availability |
| POST | `/api/course/{id}/check-location` | Check if location is within course |
| POST | `/api/course/{id}/distance` | Calculate distance to course |

#### Protected Endpoints (Requires Authentication)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/course` | Create new course |
| PUT | `/api/course/{id}` | Update existing course |
| DELETE | `/api/course/{id}` | Delete course |

### Data Models

#### CourseResponseDto
```csharp
public class CourseResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string? Description { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string Country { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? Email { get; set; }
    public int TotalHoles { get; set; }
    public int ParTotal { get; set; }
    public int? SlopeRating { get; set; }
    public decimal? CourseRating { get; set; }
    public int? YardageTotal { get; set; }
    public string? GreenFeeRange { get; set; }
    public string? Timezone { get; set; }
    public bool? IsActive { get; set; }
    public Dictionary<string, object>? Amenities { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public List<HoleResponseDto> Holes { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
```

## Dependencies

### External Dependencies
- **NetTopologySuite**: v3.x - Geospatial data handling and calculations
- **PostGIS**: Database extension for geospatial queries
- **AutoMapper**: v13.x - Object-to-object mapping
- **FluentValidation**: v11.x - Input validation
- **Entity Framework Core**: v9.x - Database access

### Internal Dependencies
- **Authentication Service**: JWT-based authentication for protected endpoints
- **Database Context**: CaddieAI database with courses and holes tables
- **Common DTOs**: Shared ApiResponse wrapper for consistent responses
- **Logging Service**: Structured logging using Serilog

## Testing

### Unit Tests
- [x] Service layer business logic tests
- [x] Repository layer data access tests
- [x] AutoMapper profile configuration tests
- **Coverage**: Integrated with existing test suite

### Integration Tests
- [x] API endpoint response validation
- [x] Database transaction tests
- [x] Geospatial query validation
- [x] Authentication and authorization tests

### Manual Testing
- [x] CRUD operations for courses
- [x] Geospatial search functionality
- [x] Error handling scenarios
- [x] Input validation edge cases

## Configuration

### Dependencies Registration
```csharp
// Repository registration
builder.Services.AddScoped<ICourseRepository, CourseRepository>();

// Service registration
builder.Services.AddScoped<ICourseService, CourseService>();

// AutoMapper profile
builder.Services.AddAutoMapper(typeof(CourseMappingProfile));
```

### Database Configuration
Utilizes existing PostGIS-enabled PostgreSQL database with NetTopologySuite integration:

```csharp
builder.Services.AddDbContext<CaddieAIDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.UseNetTopologySuite();
    });
});
```

## Usage Examples

### API Usage

#### Get Paginated Courses
```http
GET /api/course?page=1&pageSize=10&searchTerm=golf
Authorization: Bearer {token}
```

#### Create New Course
```http
POST /api/course
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Pine Valley Golf Club",
  "description": "Championship golf course",
  "country": "United States",
  "city": "Pine Valley",
  "state": "New Jersey",
  "totalHoles": 18,
  "parTotal": 72,
  "latitude": 39.7849,
  "longitude": -74.9371,
  "isActive": true
}
```

#### Find Nearby Courses
```http
POST /api/course/nearby
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radiusKm": 50.0
}
```

### Service Layer Usage
```csharp
// Get course by ID
var course = await _courseService.GetCourseByIdAsync(courseId);

// Search courses
var courses = await _courseService.SearchCoursesAsync("championship");

// Create new course
var createModel = new CreateCourseModel { /* properties */ };
var newCourse = await _courseService.CreateCourseAsync(createModel);
```

## Security Considerations

### Authentication
- JWT Bearer token required for create, update, and delete operations
- Public read access for course discovery and information retrieval
- Token validation handled by existing authentication middleware

### Authorization
- All authenticated users can create, update, and delete courses
- No role-based restrictions implemented in initial version
- Future enhancement may include admin-only operations

### Data Protection
- Input validation prevents SQL injection and malicious data
- Geospatial data sanitized through NetTopologySuite
- Sensitive operations logged for audit trails

### Input Validation
- Comprehensive validation attributes on all DTOs
- Server-side validation using FluentValidation
- Coordinate bounds checking for latitude/longitude values
- String length limits and format validation

## Performance

### Performance Optimizations
- **Geospatial Indexing**: PostGIS spatial indexes for efficient location queries
- **Pagination**: Limit result sets for large datasets
- **Selective Loading**: Include hole data only when needed
- **Connection Pooling**: Entity Framework connection management

### Query Optimization
- Distance calculations performed at database level using PostGIS
- Spatial queries use appropriate geometric functions (`ST_DWithin`, `ST_Distance`)
- Filtered queries on indexed columns (`IsActive`, `Name`)

### Caching Strategy
- Repository pattern enables future caching layer implementation
- Geospatial queries benefit from PostGIS internal caching
- Consider Redis integration for frequently accessed course data

## Monitoring & Logging

### Key Metrics
- API response times for geospatial queries
- Course creation and update frequency
- Search query performance
- Error rates by endpoint

### Logging
- Structured logging using Serilog
- Course operations logged with course ID and user context
- Error logging includes full exception details and context
- Geospatial query logging for performance analysis

## Future Enhancements

### Planned Improvements
- **Bulk Import**: CSV/Excel import functionality for course data
- **Image Upload**: Course and hole image management
- **Advanced Search**: Full-text search with ranking
- **Course Reviews**: User rating and review system
- **Course Availability**: Tee time integration
- **Weather Integration**: Current conditions for courses

### Performance Enhancements
- **Caching Layer**: Redis caching for frequently accessed data
- **Search Indexing**: Elasticsearch for advanced search capabilities
- **CDN Integration**: Course images and media delivery
- **Database Optimization**: Query performance monitoring and optimization

### API Enhancements
- **GraphQL Support**: Flexible query capabilities
- **Webhook Support**: Course update notifications
- **Bulk Operations**: Batch create/update endpoints
- **Export Functionality**: Course data export in various formats

## Troubleshooting

### Common Issues

1. **Issue**: Geospatial queries return no results
   - **Cause**: Incorrect coordinate system or invalid coordinates
   - **Solution**: Verify SRID is 4326 (WGS84) and coordinates are valid

2. **Issue**: Course creation fails with validation errors
   - **Cause**: Required fields missing or invalid data formats
   - **Solution**: Review validation requirements and ensure all required fields are provided

3. **Issue**: "Course not found" errors
   - **Cause**: Course may be inactive or deleted
   - **Solution**: Check `IsActive` status and verify course exists in database

### Debugging Tips
- Enable detailed logging for geospatial operations
- Check PostGIS function availability in database
- Verify NetTopologySuite configuration in Entity Framework
- Monitor database query execution plans for performance issues

## Related Documentation

- [Architecture Documentation](../../ARCHITECTURE.md)
- [Database Schema](../database/schema.md)
- [API Authentication](../../api/authentication/)
- [Development Setup](../../development/setup.md)
- [Testing Guidelines](../../development/testing/)

## Changelog

### v1.0.0 (2025-01-19)
- Initial implementation of Course Management API
- Full CRUD operations for golf courses
- Geospatial search and location services
- Integration with existing authentication system
- Comprehensive validation and error handling
- AutoMapper integration for DTO mapping
- PostGIS integration for spatial queries
- Support for course holes and amenities
- Paginated search with filtering capabilities

---

*This documentation should be updated whenever the Course Management API is modified.*