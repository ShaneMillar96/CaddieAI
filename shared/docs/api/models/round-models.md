# Round Management Models

This document describes all data models used in the Round Management API, including request DTOs, response DTOs, service models, and validation rules.

## Request DTOs

### CreateRoundRequestDto
Used for creating a new golf round.

```csharp
public class CreateRoundRequestDto
{
    [Required]
    public int CourseId { get; set; }

    [Required]
    public DateOnly RoundDate { get; set; }

    [Range(-50, 60)]
    public decimal? TemperatureCelsius { get; set; }

    [Range(0, 200)]
    public decimal? WindSpeedKmh { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MaxLength(2000)]
    public string? RoundMetadata { get; set; }
}
```

**Validation Rules:**
- `CourseId`: Must be a valid course ID that exists in the system
- `RoundDate`: Cannot be more than 1 year in the future
- `TemperatureCelsius`: Must be between -50°C and 60°C if provided
- `WindSpeedKmh`: Must be between 0 and 200 km/h if provided
- `Notes`: Maximum 1000 characters
- `RoundMetadata`: Maximum 2000 characters, typically JSON format

**Example:**
```json
{
  "courseId": 1,
  "roundDate": "2025-07-19",
  "temperatureCelsius": 22.5,
  "windSpeedKmh": 10.0,
  "notes": "Perfect morning conditions",
  "roundMetadata": "{\"teeType\":\"blue\",\"cart\":true}"
}
```

---

### UpdateRoundRequestDto
Used for updating round information during play.

```csharp
public class UpdateRoundRequestDto
{
    [Range(1, 18)]
    public int? CurrentHole { get; set; }

    public string? Status { get; set; }

    [Range(18, 300)]
    public int? TotalScore { get; set; }

    [Range(0, 100)]
    public int? TotalPutts { get; set; }

    [Range(0, 18)]
    public int? FairwaysHit { get; set; }

    [Range(0, 18)]
    public int? GreensInRegulation { get; set; }

    [Range(-50, 60)]
    public decimal? TemperatureCelsius { get; set; }

    [Range(0, 200)]
    public decimal? WindSpeedKmh { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MaxLength(2000)]
    public string? RoundMetadata { get; set; }
}
```

**Validation Rules:**
- `CurrentHole`: Must be between 1 and 18 if provided
- `Status`: Must be valid status string if provided (`not_started`, `in_progress`, `paused`, `completed`, `abandoned`)
- `TotalScore`: Must be between 18 and 300 if provided
- `TotalPutts`: Must be between 0 and 100 if provided
- `FairwaysHit`: Must be between 0 and 18 if provided
- `GreensInRegulation`: Must be between 0 and 18 if provided

**Example:**
```json
{
  "currentHole": 9,
  "totalScore": 42,
  "totalPutts": 18,
  "fairwaysHit": 6,
  "greensInRegulation": 5,
  "notes": "Playing well so far"
}
```

---

### StartRoundRequestDto
Used for starting a new round (combines creation and starting).

```csharp
public class StartRoundRequestDto
{
    [Required]
    public int CourseId { get; set; }

    public DateOnly? RoundDate { get; set; }

    [Range(-50, 60)]
    public decimal? TemperatureCelsius { get; set; }

    [Range(0, 200)]
    public decimal? WindSpeedKmh { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MaxLength(2000)]
    public string? RoundMetadata { get; set; }
}
```

**Validation Rules:**
- `CourseId`: Must be a valid course ID
- `RoundDate`: Defaults to current date if not provided
- Other fields follow same validation as CreateRoundRequestDto

**Example:**
```json
{
  "courseId": 1,
  "temperatureCelsius": 22.5,
  "windSpeedKmh": 10.0,
  "notes": "Starting my round now!"
}
```

---

### CompleteRoundRequestDto
Used for completing a round with final scoring.

```csharp
public class CompleteRoundRequestDto
{
    [Required]
    [Range(18, 300)]
    public int TotalScore { get; set; }

    [Range(0, 100)]
    public int? TotalPutts { get; set; }

    [Range(0, 18)]
    public int? FairwaysHit { get; set; }

    [Range(0, 18)]
    public int? GreensInRegulation { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}
```

**Validation Rules:**
- `TotalScore`: Required, must be between 18 and 300
- All other fields optional but must meet validation if provided

**Example:**
```json
{
  "totalScore": 85,
  "totalPutts": 32,
  "fairwaysHit": 12,
  "greensInRegulation": 10,
  "notes": "Great round! Personal best this season."
}
```

---

## Response DTOs

### RoundResponseDto
Complete round information returned by the API.

```csharp
public class RoundResponseDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int CourseId { get; set; }
    public DateOnly RoundDate { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int? CurrentHole { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? TotalScore { get; set; }
    public int? TotalPutts { get; set; }
    public int? FairwaysHit { get; set; }
    public int? GreensInRegulation { get; set; }
    public decimal? TemperatureCelsius { get; set; }
    public decimal? WindSpeedKmh { get; set; }
    public string? Notes { get; set; }
    public string? RoundMetadata { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
```

**Example:**
```json
{
  "id": 123,
  "userId": 456,
  "courseId": 1,
  "roundDate": "2025-07-19",
  "startTime": "2025-07-19T08:00:00Z",
  "endTime": "2025-07-19T12:30:00Z",
  "currentHole": 18,
  "status": "completed",
  "totalScore": 85,
  "totalPutts": 32,
  "fairwaysHit": 12,
  "greensInRegulation": 10,
  "temperatureCelsius": 22.5,
  "windSpeedKmh": 10.0,
  "notes": "Great round today!",
  "roundMetadata": "{\"teeType\":\"blue\",\"cart\":true}",
  "createdAt": "2025-07-19T07:45:00Z",
  "updatedAt": "2025-07-19T12:30:00Z"
}
```

---

### RoundListResponseDto
Simplified round information for list views.

```csharp
public class RoundListResponseDto
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public DateOnly RoundDate { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int? CurrentHole { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? TotalScore { get; set; }
    public string? Notes { get; set; }
    public DateTime? CreatedAt { get; set; }
}
```

**Example:**
```json
{
  "id": 123,
  "courseId": 1,
  "roundDate": "2025-07-19",
  "startTime": "2025-07-19T08:00:00Z",
  "endTime": "2025-07-19T12:30:00Z",
  "currentHole": 18,
  "status": "completed",
  "totalScore": 85,
  "notes": "Great round today!",
  "createdAt": "2025-07-19T07:45:00Z"
}
```

---

### RoundStatisticsResponseDto
Aggregated statistics for user's rounds.

```csharp
public class RoundStatisticsResponseDto
{
    public int TotalRounds { get; set; }
    public double? AverageScore { get; set; }
    public int? BestScore { get; set; }
    public int? WorstScore { get; set; }
    public double? AveragePutts { get; set; }
    public double? AverageFairwaysHit { get; set; }
    public double? AverageGreensInRegulation { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}
```

**Example:**
```json
{
  "totalRounds": 25,
  "averageScore": 87.5,
  "bestScore": 78,
  "worstScore": 102,
  "averagePutts": 33.2,
  "averageFairwaysHit": 9.8,
  "averageGreensInRegulation": 7.5,
  "startDate": "2025-01-01",
  "endDate": "2025-07-19"
}
```

---

### PaginatedRoundResponseDto
Paginated collection of rounds.

```csharp
public class PaginatedRoundResponseDto
{
    public IEnumerable<RoundListResponseDto> Data { get; set; } = new List<RoundListResponseDto>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}
```

**Example:**
```json
{
  "data": [
    {
      "id": 123,
      "courseId": 1,
      "roundDate": "2025-07-19",
      "status": "completed",
      "totalScore": 85
    }
  ],
  "totalCount": 25,
  "page": 1,
  "pageSize": 10,
  "totalPages": 3,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

---

## Service Models

### RoundModel
Internal service layer model for round data.

```csharp
public class RoundModel
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int CourseId { get; set; }
    public DateOnly RoundDate { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int? CurrentHole { get; set; }
    public RoundStatus Status { get; set; }
    public int? TotalScore { get; set; }
    public int? TotalPutts { get; set; }
    public int? FairwaysHit { get; set; }
    public int? GreensInRegulation { get; set; }
    public decimal? TemperatureCelsius { get; set; }
    public decimal? WindSpeedKmh { get; set; }
    public string? Notes { get; set; }
    public string? RoundMetadata { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public UserModel? User { get; set; }
    public CourseModel? Course { get; set; }
}
```

---

### RoundStatus Enum
Defines valid round statuses.

```csharp
public enum RoundStatus
{
    NotStarted,
    InProgress,
    Paused,
    Completed,
    Abandoned
}
```

**String Mappings:**
- `NotStarted` ↔ `"not_started"`
- `InProgress` ↔ `"in_progress"`
- `Paused` ↔ `"paused"`
- `Completed` ↔ `"completed"`
- `Abandoned` ↔ `"abandoned"`

---

### CreateRoundModel
Service layer model for round creation.

```csharp
public class CreateRoundModel
{
    public int UserId { get; set; }
    public int CourseId { get; set; }
    public DateOnly RoundDate { get; set; }
    public decimal? TemperatureCelsius { get; set; }
    public decimal? WindSpeedKmh { get; set; }
    public string? Notes { get; set; }
    public string? RoundMetadata { get; set; }
}
```

---

### UpdateRoundModel
Service layer model for round updates.

```csharp
public class UpdateRoundModel
{
    public int? CurrentHole { get; set; }
    public RoundStatus? Status { get; set; }
    public int? TotalScore { get; set; }
    public int? TotalPutts { get; set; }
    public int? FairwaysHit { get; set; }
    public int? GreensInRegulation { get; set; }
    public decimal? TemperatureCelsius { get; set; }
    public decimal? WindSpeedKmh { get; set; }
    public string? Notes { get; set; }
    public string? RoundMetadata { get; set; }
}
```

---

### StartRoundModel
Service layer model for starting rounds.

```csharp
public class StartRoundModel
{
    public int CourseId { get; set; }
    public DateOnly? RoundDate { get; set; }
    public decimal? TemperatureCelsius { get; set; }
    public decimal? WindSpeedKmh { get; set; }
    public string? Notes { get; set; }
    public string? RoundMetadata { get; set; }
}
```

---

### CompleteRoundModel
Service layer model for completing rounds.

```csharp
public class CompleteRoundModel
{
    public int TotalScore { get; set; }
    public int? TotalPutts { get; set; }
    public int? FairwaysHit { get; set; }
    public int? GreensInRegulation { get; set; }
    public string? Notes { get; set; }
}
```

---

### RoundStatisticsModel
Service layer model for round statistics.

```csharp
public class RoundStatisticsModel
{
    public int TotalRounds { get; set; }
    public double? AverageScore { get; set; }
    public int? BestScore { get; set; }
    public int? WorstScore { get; set; }
    public double? AveragePutts { get; set; }
    public double? AverageFairwaysHit { get; set; }
    public double? AverageGreensInRegulation { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}
```

---

## Data Validation Rules

### General Rules
- All string fields are trimmed of leading/trailing whitespace
- Null values are allowed unless marked as `[Required]`
- Date values must be valid dates
- Numeric ranges are enforced at both API and service layers

### Business Rules
- Users can only have one active round at a time
- Rounds can only be started if user has no active rounds
- Score validation ensures reasonable values (18-300)
- Current hole must be valid for the course (1-18 for standard courses)
- Status transitions must follow valid state machine rules

### Status Transition Rules
- `NotStarted` → `InProgress`, `Abandoned`
- `InProgress` → `Paused`, `Completed`, `Abandoned`
- `Paused` → `InProgress`, `Completed`, `Abandoned`
- `Completed` → *(no transitions)*
- `Abandoned` → *(no transitions)*

---

## AutoMapper Configuration

The `RoundMappingProfile` handles all conversions between layers:

```csharp
public class RoundMappingProfile : Profile
{
    public RoundMappingProfile()
    {
        // Request DTOs to Service Models
        CreateMap<CreateRoundRequestDto, CreateRoundModel>();
        CreateMap<UpdateRoundRequestDto, UpdateRoundModel>();
        CreateMap<StartRoundRequestDto, StartRoundModel>();
        CreateMap<CompleteRoundRequestDto, CompleteRoundModel>();

        // Service Models to Response DTOs
        CreateMap<RoundModel, RoundResponseDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
        
        CreateMap<RoundModel, RoundListResponseDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
        
        CreateMap<RoundStatisticsModel, RoundStatisticsResponseDto>();
        
        CreateMap<PaginatedResult<RoundModel>, PaginatedRoundResponseDto>();
    }
}
```

---

## Common Usage Patterns

### Creating and Starting a Round
```csharp
// Option 1: Create then start separately
var createModel = new CreateRoundModel { CourseId = 1, RoundDate = DateOnly.Today };
var round = await _roundService.CreateRoundAsync(userId, createModel);
var startedRound = await _roundService.StartRoundAsync(round.Id);

// Option 2: Start immediately
var startModel = new StartRoundModel { CourseId = 1 };
var round = await _roundService.StartRoundAsync(userId, startModel);
```

### Updating Round Progress
```csharp
var updateModel = new UpdateRoundModel 
{ 
    CurrentHole = 9, 
    TotalScore = 42,
    TotalPutts = 18 
};
var updatedRound = await _roundService.UpdateRoundAsync(roundId, updateModel);
```

### Completing a Round
```csharp
var completeModel = new CompleteRoundModel 
{ 
    TotalScore = 85,
    TotalPutts = 32,
    FairwaysHit = 12,
    GreensInRegulation = 10,
    Notes = "Great round!"
};
var completedRound = await _roundService.CompleteRoundAsync(roundId, completeModel);
```

---

*This documentation should be updated whenever the Round Management models are modified.*