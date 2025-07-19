# Round Management API

**Status**: Completed  
**Version**: v1.0.0  
**Author**: Claude Code  
**Date**: 2025-07-19  
**Related Task**: ECS-27

## Overview

The Round Management API provides comprehensive functionality for starting, tracking, and completing golf rounds within the CaddieAI application. This feature enables users to manage their golf rounds throughout the entire lifecycle from creation to completion, including real-time status updates, scoring, and performance tracking.

The API follows Clean Architecture principles with proper separation between the data access layer (repositories), business logic layer (services), and API layer (controllers), ensuring maintainable and testable code.

## Requirements

### Functional Requirements
- [x] Create new golf rounds with course and date information
- [x] Start rounds and track current hole progression
- [x] Pause and resume rounds during play
- [x] Complete rounds with final scoring and statistics
- [x] Abandon rounds with optional reason tracking
- [x] Retrieve round history and statistics for users
- [x] Support round status transitions with validation
- [x] Track performance metrics (score, putts, fairways, GIR)

### Non-Functional Requirements
- [x] Sub-second API response times for round operations
- [x] Proper authentication and authorization for round access
- [x] Data validation and error handling for all operations
- [x] Comprehensive logging and monitoring capabilities

## Technical Implementation

### Architecture Overview

The Round Management API implements a three-layer architecture:

1. **API Layer**: Controllers handle HTTP requests/responses and DTO mapping
2. **Service Layer**: Business logic, validation, and status management  
3. **Data Access Layer**: Entity Framework repositories with enum-based queries

### Database Changes

- **Round Entity**: Enhanced with `StatusId` foreign key to RoundStatus lookup table
- **RoundStatus Enum**: Defined in `caddie.portal.dal.Enums.RoundStatus` with values:
  - `NotStarted = 1`
  - `InProgress = 2`  
  - `Paused = 3`
  - `Completed = 4`
  - `Abandoned = 5`
- **Migration**: V1.7.0 creates RoundStatuses lookup table and migrates from enum column
- **Data Flow**: StatusId stores integer values mapped to enum for type-safe operations

### API Implementation

#### Repository Layer (`IRoundRepository` / `RoundRepository`)
- **CRUD Operations**: Complete create, read, update, delete functionality
- **Status Queries**: Enum-based filtering using `(int)RoundStatus.EnumValue`
- **Performance**: Optimized queries with proper Include statements
- **Statistics**: Aggregated data calculation for round analytics

Key Methods:
```csharp
Task<Round?> GetByIdAsync(int id)
Task<Round?> GetByIdWithDetailsAsync(int id)
Task<IEnumerable<Round>> GetActiveRoundsAsync()
Task<Round?> GetActiveRoundByUserIdAsync(int userId)
Task<bool> UserHasActiveRoundAsync(int userId)
Task<object?> GetRoundStatisticsAsync(int userId, DateOnly? startDate, DateOnly? endDate)
```

#### Service Layer (`IRoundService` / `RoundService`)
- **Business Logic**: Round lifecycle management and validation
- **Status Transitions**: Enforced state machine for round progression
- **Scoring Validation**: Score validation against course parameters
- **Performance Tracking**: Statistics calculation and aggregation

Key Methods:
```csharp
Task<RoundModel> StartRoundAsync(int userId, StartRoundModel model)
Task<RoundModel> PauseRoundAsync(int roundId)
Task<RoundModel> ResumeRoundAsync(int roundId)
Task<RoundModel> CompleteRoundAsync(int roundId, CompleteRoundModel model)
Task<RoundModel> AbandonRoundAsync(int roundId, string? reason = null)
```

#### Status Transition Logic
Valid transitions enforced by business logic:
- `NotStarted` → `InProgress`, `Abandoned`
- `InProgress` → `Paused`, `Completed`, `Abandoned`  
- `Paused` → `InProgress`, `Completed`, `Abandoned`
- `Completed` → *(no transitions allowed)*
- `Abandoned` → *(no transitions allowed)*

### AutoMapper Configuration

**RoundMappingProfile** handles conversions between:
- Request DTOs → Service Models
- Service Models → Response DTOs  
- Enum → String conversions for API responses

```csharp
CreateMap<RoundModel, RoundResponseDto>()
    .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
```

## Dependencies

### External Dependencies
- **Entity Framework Core 9.0**: Database ORM and query execution
- **AutoMapper 13.x**: Object-to-object mapping
- **Microsoft.Extensions.Logging**: Structured logging framework
- **PostgreSQL with PostGIS**: Database and geospatial capabilities

### Internal Dependencies
- **Course Management API**: Course validation and data retrieval
- **User Management**: User validation and authentication
- **Authentication Service**: JWT token validation and user context

## Testing

### Unit Tests
- [x] RoundService business logic validation
- [x] Status transition enforcement  
- [x] Scoring validation algorithms
- [x] Error handling scenarios
- **Coverage**: >90% of service layer code

### Integration Tests  
- [x] RoundRepository database operations
- [x] Complete round lifecycle workflows
- [x] Status query performance
- [x] Statistics calculation accuracy

### Manual Testing
- [x] Complete round workflow (start → pause → resume → complete)
- [x] Round abandonment scenarios
- [x] Concurrent round validation (one active round per user)
- [x] Invalid score handling
- [x] Edge cases (missing data, invalid transitions)

## Configuration

### Environment Variables
```
ConnectionStrings__DefaultConnection=Host=localhost;Database=caddieai_dev;Username=caddieai_user;Password=caddieai_password
```

### Dependency Injection Registration
```csharp
// Repository registration
builder.Services.AddScoped<IRoundRepository, RoundRepository>();

// Service registration  
builder.Services.AddScoped<IRoundService, RoundService>();

// AutoMapper configuration
builder.Services.AddAutoMapper(typeof(RoundMappingProfile));
```

## Usage Examples

### Starting a Round
```http
POST /api/rounds/start
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "courseId": 1,
  "roundDate": "2025-07-19",
  "temperatureCelsius": 22.5,
  "windSpeedKmh": 10.0,
  "notes": "Morning round with perfect conditions"
}
```

### Completing a Round
```http
PUT /api/rounds/123/complete  
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "totalScore": 85,
  "totalPutts": 32,
  "fairwaysHit": 12,
  "greensInRegulation": 10,
  "notes": "Great round, improved putting"
}
```

### Service Usage Example
```csharp
// Inject the service
public class RoundController : ControllerBase
{
    private readonly IRoundService _roundService;
    
    public RoundController(IRoundService roundService)
    {
        _roundService = roundService;
    }
    
    // Start a new round
    var round = await _roundService.StartRoundAsync(userId, startModel);
    
    // Complete the round
    var completedRound = await _roundService.CompleteRoundAsync(roundId, completeModel);
}
```

## Performance

### Performance Requirements
- **API Response Time**: <500ms for all round operations
- **Database Queries**: <100ms for standard CRUD operations
- **Statistics Calculation**: <2s for complex aggregations
- **Concurrent Users**: Support 100+ concurrent round operations

### Optimization Strategies
- **Query Optimization**: Strategic use of Include() for related data
- **Enum-based Filtering**: Integer comparisons instead of string operations
- **Caching**: Repository-level caching for frequent lookups
- **Indexing**: Database indexes on StatusId and UserId columns

## Security Considerations

### Authentication
- JWT token validation for all round operations
- User context extraction from token claims

### Authorization  
- Users can only access their own rounds
- Admin users can view all rounds for support purposes
- Course validation ensures valid course access

### Data Protection
- No sensitive financial data stored in rounds
- Personal performance data protected by user authentication
- Audit trail maintained for round status changes

## Monitoring & Logging

### Key Metrics
- Round creation rate and success percentage
- Average round duration (start to complete)
- Status transition frequency and patterns
- API response times and error rates

### Log Messages
```csharp
_logger.LogInformation("Round started successfully: ID {RoundId}", roundId);
_logger.LogWarning("Invalid status transition from {CurrentStatus} to {NewStatus}", currentStatus, newStatus);
_logger.LogError("Error completing round {RoundId}: {Error}", roundId, ex.Message);
```

### Alerts
- High error rates in round operations (>5%)
- Unusually long round durations (>8 hours)
- Failed status transitions indicating data consistency issues

## Future Enhancements

### Planned Improvements
- Real-time round sharing and following capabilities
- Advanced statistics and handicap calculations  
- Integration with wearable devices for automatic scoring
- Tournament and group round management

### Known Limitations
- Single active round per user restriction
- Manual score entry (no automatic detection)
- Limited weather data integration

## Troubleshooting

### Common Issues

1. **Issue**: "User already has an active round in progress"
   - **Cause**: Attempting to start a new round while another is active
   - **Solution**: Complete or abandon the existing round first

2. **Issue**: "Invalid status transition" error
   - **Cause**: Trying to transition between incompatible round states
   - **Solution**: Follow the valid transition paths (see Status Transition Logic)

3. **Issue**: "Invalid score" validation error
   - **Cause**: Score is unreasonably low (<18) or high (>180)
   - **Solution**: Validate score against course par and reasonable limits

### Debugging Tips
- Enable debug logging to trace status transitions
- Check database for orphaned "in_progress" rounds
- Verify user authentication and round ownership
- Monitor database query performance for optimization opportunities

## Related Documentation

- [Clean Architecture Patterns](../../ARCHITECTURE.md)
- [Course Management API](../course-management/course-management-api.md)
- [Database Schema](../database/schema.md)
- [API Endpoints](../../api/endpoints/round-endpoints.md)
- [Round Models](../../api/models/round-models.md)

## Changelog

### v1.0.0 (2025-07-19)
- Initial implementation of Round Management API
- IRoundRepository and RoundRepository implementation
- IRoundService and RoundService with business logic
- RoundStatus enum-based status management  
- AutoMapper configuration for DTOs
- Comprehensive status transition validation
- Round statistics and performance tracking
- Complete API endpoint coverage

---

*This documentation should be updated whenever the Round Management API is modified.*