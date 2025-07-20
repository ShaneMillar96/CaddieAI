# Club Recommendation Data Models

## Overview

This document describes the data models used in the Club Recommendation API, including entities, DTOs, and service models.

## Database Entities

### ClubRecommendation Entity

The core entity that stores AI-generated club recommendations and user feedback.

```csharp
public class ClubRecommendation
{
    /// <summary>
    /// Unique identifier for the recommendation
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// User who requested the recommendation
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Associated golf round (optional)
    /// </summary>
    public int? RoundId { get; set; }

    /// <summary>
    /// Associated hole (optional)
    /// </summary>
    public int? HoleId { get; set; }

    /// <summary>
    /// Associated location (optional)
    /// </summary>
    public int? LocationId { get; set; }

    /// <summary>
    /// Primary club recommendation from AI
    /// </summary>
    public string RecommendedClub { get; set; } = null!;

    /// <summary>
    /// AI confidence score (0-1)
    /// </summary>
    public decimal? ConfidenceScore { get; set; }

    /// <summary>
    /// Distance to target in meters
    /// </summary>
    public decimal? DistanceToTarget { get; set; }

    /// <summary>
    /// OpenAI-generated reasoning for the recommendation
    /// </summary>
    public string? OpenaiReasoning { get; set; }

    /// <summary>
    /// JSON context data used for the recommendation
    /// </summary>
    public string? ContextUsed { get; set; }

    /// <summary>
    /// Whether user accepted the recommendation
    /// </summary>
    public bool? WasAccepted { get; set; }

    /// <summary>
    /// Club actually used by player (for learning)
    /// </summary>
    public string? ActualClubUsed { get; set; }

    /// <summary>
    /// Additional metadata in JSON format
    /// </summary>
    public string? RecommendationMetadata { get; set; }

    /// <summary>
    /// Creation timestamp
    /// </summary>
    public DateTime? CreatedAt { get; set; }

    /// <summary>
    /// Last update timestamp
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    // Navigation Properties
    public virtual User User { get; set; } = null!;
    public virtual Round? Round { get; set; }
    public virtual Hole? Hole { get; set; }
    public virtual Location? Location { get; set; }
}
```

### Related Entities

#### User Entity (Partial)
```csharp
public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public decimal? Handicap { get; set; }
    public virtual SkillLevel? SkillLevel { get; set; }
    public string? PlayingStyle { get; set; }
    // ... other properties
}
```

#### Location Entity (Partial)
```csharp
public class Location
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? RoundId { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double? Accuracy { get; set; }
    public string? CoursePosition { get; set; }
    public DateTime? RecordedAt { get; set; }
    // ... other properties
}
```

## API DTOs (Data Transfer Objects)

### Request DTOs

#### CreateClubRecommendationRequestDto
```csharp
public class CreateClubRecommendationRequestDto
{
    [Required]
    public int UserId { get; set; }

    public int? RoundId { get; set; }

    public int? HoleId { get; set; }

    public int? LocationId { get; set; }

    [Required]
    [Range(1, 1000)]
    public decimal DistanceToTarget { get; set; }

    [StringLength(200)]
    public string? WeatherConditions { get; set; }

    [StringLength(100)]
    public string? LieConditions { get; set; }

    [StringLength(50)]
    public string? ShotType { get; set; }

    [StringLength(500)]
    public string? PlayerNotes { get; set; }

    public Dictionary<string, object>? AdditionalContext { get; set; }
}
```

#### ClubRecommendationFeedbackDto
```csharp
public class ClubRecommendationFeedbackDto
{
    [Required]
    public bool WasAccepted { get; set; }

    [StringLength(50)]
    public string? ActualClubUsed { get; set; }

    [StringLength(500)]
    public string? PlayerNotes { get; set; }

    [Range(1, 5)]
    public int? ShotResult { get; set; }

    [StringLength(50)]
    public string? ShotOutcome { get; set; }
}
```

### Response DTOs

#### ClubRecommendationResponseDto
```csharp
public class ClubRecommendationResponseDto
{
    public int Id { get; set; }
    public string RecommendedClub { get; set; } = string.Empty;
    public decimal? ConfidenceScore { get; set; }
    public string? Reasoning { get; set; }
    public List<string> AlternativeClubs { get; set; } = new();
    public string? Strategy { get; set; }
    public Dictionary<string, object> Factors { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}
```

#### ClubRecommendationDto
```csharp
public class ClubRecommendationDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? RoundId { get; set; }
    public int? HoleId { get; set; }
    public int? LocationId { get; set; }
    public string RecommendedClub { get; set; } = string.Empty;
    public decimal? ConfidenceScore { get; set; }
    public decimal? DistanceToTarget { get; set; }
    public string? OpenaiReasoning { get; set; }
    public string? ContextUsed { get; set; }
    public bool? WasAccepted { get; set; }
    public string? ActualClubUsed { get; set; }
    public string? RecommendationMetadata { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public UserDto? User { get; set; }
    public HoleDto? Hole { get; set; }
    public LocationDto? Location { get; set; }
}
```

#### ClubRecommendationDetailDto
```csharp
public class ClubRecommendationDetailDto : ClubRecommendationDto
{
    public List<string> AlternativeClubs { get; set; } = new();
    public string? Strategy { get; set; }
    public Dictionary<string, object> Factors { get; set; } = new();
}
```

### Analytics DTOs

#### ClubRecommendationAnalyticsResponseDto
```csharp
public class ClubRecommendationAnalyticsResponseDto
{
    public decimal OverallAcceptanceRate { get; set; }
    public int TotalRecommendations { get; set; }
    public int AcceptedRecommendations { get; set; }
    public List<ClubPopularityDto> MostRecommendedClubs { get; set; } = new();
    public List<ClubAccuracyDto> ClubAccuracyRates { get; set; } = new();
    public Dictionary<string, decimal> AcceptanceRateByDistance { get; set; } = new();
    public Dictionary<string, decimal> AcceptanceRateByConditions { get; set; } = new();
    public DateTime AnalyticsGeneratedAt { get; set; }
}
```

#### ClubPopularityDto
```csharp
public class ClubPopularityDto
{
    public string Club { get; set; } = string.Empty;
    public int RecommendationCount { get; set; }
    public decimal Percentage { get; set; }
}
```

#### ClubAccuracyDto
```csharp
public class ClubAccuracyDto
{
    public string Club { get; set; } = string.Empty;
    public decimal AcceptanceRate { get; set; }
    public int TotalRecommendations { get; set; }
    public int AcceptedRecommendations { get; set; }
}
```

## Service Models

### ClubRecommendationRequestModel
```csharp
public class ClubRecommendationRequestModel
{
    public int UserId { get; set; }
    public int? RoundId { get; set; }
    public int? HoleId { get; set; }
    public int? LocationId { get; set; }
    public decimal DistanceToTarget { get; set; }
    public string? WeatherConditions { get; set; }
    public string? LieConditions { get; set; }
    public string? ShotType { get; set; }
    public string? PlayerNotes { get; set; }
    public Dictionary<string, object>? AdditionalContext { get; set; }
}
```

### ClubRecommendationModel
```csharp
public class ClubRecommendationModel
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? RoundId { get; set; }
    public int? HoleId { get; set; }
    public int? LocationId { get; set; }
    public string RecommendedClub { get; set; } = string.Empty;
    public decimal? ConfidenceScore { get; set; }
    public decimal? DistanceToTarget { get; set; }
    public string? OpenaiReasoning { get; set; }
    public string? ContextUsed { get; set; }
    public bool? WasAccepted { get; set; }
    public string? ActualClubUsed { get; set; }
    public string? RecommendationMetadata { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties as models
    public UserModel? User { get; set; }
    public RoundModel? Round { get; set; }
    public HoleModel? Hole { get; set; }
    public LocationModel? Location { get; set; }
}
```

### ClubRecommendationFeedbackModel
```csharp
public class ClubRecommendationFeedbackModel
{
    public bool WasAccepted { get; set; }
    public string? ActualClubUsed { get; set; }
    public string? PlayerNotes { get; set; }
    public int? ShotResult { get; set; }
    public string? ShotOutcome { get; set; }
}
```

### ClubRecommendationAnalyticsModel
```csharp
public class ClubRecommendationAnalyticsModel
{
    public decimal OverallAcceptanceRate { get; set; }
    public int TotalRecommendations { get; set; }
    public int AcceptedRecommendations { get; set; }
    public List<ClubPopularityModel> MostRecommendedClubs { get; set; } = new();
    public List<ClubAccuracyModel> ClubAccuracyRates { get; set; } = new();
    public Dictionary<string, decimal> AcceptanceRateByDistance { get; set; } = new();
    public Dictionary<string, decimal> AcceptanceRateByConditions { get; set; } = new();
    public DateTime AnalyticsGeneratedAt { get; set; } = DateTime.UtcNow;
}
```

#### ClubPopularityModel
```csharp
public class ClubPopularityModel
{
    public string Club { get; set; } = string.Empty;
    public int RecommendationCount { get; set; }
    public decimal Percentage { get; set; }
}
```

#### ClubAccuracyModel
```csharp
public class ClubAccuracyModel
{
    public string Club { get; set; } = string.Empty;
    public decimal AcceptanceRate { get; set; }
    public int TotalRecommendations { get; set; }
    public int AcceptedRecommendations { get; set; }
}
```

## Golf Context Models

### ClubRecommendationResult
```csharp
public class ClubRecommendationResult
{
    public string Club { get; set; } = string.Empty;
    public string Reasoning { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public List<string> Alternatives { get; set; } = new();
    public string? Strategy { get; set; }
    public Dictionary<string, object> Factors { get; set; } = new();
}
```

### GolfContext (Used for AI recommendations)
```csharp
public class GolfContext
{
    public UserGolfProfile User { get; set; } = new();
    public CourseContext? Course { get; set; }
    public RoundContext? Round { get; set; }
    public HoleContext? CurrentHole { get; set; }
    public LocationContext? Location { get; set; }
    public WeatherContext? Weather { get; set; }
    public PerformanceContext Performance { get; set; } = new();
    public Dictionary<string, object> CustomData { get; set; } = new();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}
```

## JSON Schema Examples

### Recommendation Metadata Schema
```json
{
  "type": "object",
  "properties": {
    "AlternativeClubs": {
      "type": "array",
      "items": { "type": "string" }
    },
    "Strategy": { "type": "string" },
    "Factors": {
      "type": "object",
      "properties": {
        "distance": { "type": "number" },
        "conditions": { "type": "string" },
        "shotType": { "type": "string" },
        "skillLevel": { "type": "string" }
      }
    },
    "ModelUsed": { "type": "string" },
    "GeneratedAt": { "type": "string", "format": "date-time" },
    "FeedbackData": {
      "type": "object",
      "properties": {
        "PlayerNotes": { "type": "string" },
        "ShotResult": { "type": "integer", "minimum": 1, "maximum": 5 },
        "ShotOutcome": { "type": "string" },
        "FeedbackReceivedAt": { "type": "string", "format": "date-time" }
      }
    }
  }
}
```

### Context Used Schema
```json
{
  "type": "object",
  "properties": {
    "WeatherConditions": { "type": "string" },
    "LieConditions": { "type": "string" },
    "ShotType": { "type": "string" },
    "PlayerNotes": { "type": "string" },
    "GolfContext": {
      "type": "object",
      "properties": {
        "User": { "type": "object" },
        "Course": { "type": "object" },
        "CurrentHole": { "type": "object" },
        "Weather": { "type": "object" }
      }
    },
    "SimilarSituationsCount": { "type": "integer" }
  }
}
```

## Validation Rules

### General Validation
- All required fields must be provided
- String length limits must be respected
- Numeric ranges must be within specified bounds
- Email addresses must be valid format
- DateTime values must be valid ISO 8601 format

### Business Rules
- `DistanceToTarget` must be between 1 and 1000 meters
- `ShotResult` must be between 1 and 5 (if provided)
- `ConfidenceScore` must be between 0 and 1 (if provided)
- `UserId` must reference an existing user
- `RoundId` must reference an existing round (if provided)
- `HoleId` must reference an existing hole (if provided)

### Data Integrity
- Recommendations cannot be modified after feedback is provided
- Feedback can only be provided once per recommendation
- Analytics are calculated in real-time based on current data
- Historical data is preserved for learning purposes

## Database Indexes

### Performance Indexes
```sql
-- Primary key index (automatic)
CREATE UNIQUE INDEX PK_ClubRecommendations ON ClubRecommendations (Id);

-- User-based queries
CREATE INDEX IX_ClubRecommendations_UserId ON ClubRecommendations (UserId);
CREATE INDEX IX_ClubRecommendations_UserId_CreatedAt ON ClubRecommendations (UserId, CreatedAt DESC);

-- Round-based queries
CREATE INDEX IX_ClubRecommendations_RoundId ON ClubRecommendations (RoundId);

-- Analytics queries
CREATE INDEX IX_ClubRecommendations_WasAccepted ON ClubRecommendations (WasAccepted);
CREATE INDEX IX_ClubRecommendations_RecommendedClub ON ClubRecommendations (RecommendedClub);

-- Learning queries
CREATE INDEX IX_ClubRecommendations_UserId_DistanceToTarget ON ClubRecommendations (UserId, DistanceToTarget);
CREATE INDEX IX_ClubRecommendations_HoleId_DistanceToTarget ON ClubRecommendations (HoleId, DistanceToTarget);
```

### Foreign Key Indexes
```sql
CREATE INDEX IX_ClubRecommendations_UserId_FK ON ClubRecommendations (UserId);
CREATE INDEX IX_ClubRecommendations_RoundId_FK ON ClubRecommendations (RoundId);
CREATE INDEX IX_ClubRecommendations_HoleId_FK ON ClubRecommendations (HoleId);
CREATE INDEX IX_ClubRecommendations_LocationId_FK ON ClubRecommendations (LocationId);
```

---

*These models form the foundation of the Club Recommendation API and enable comprehensive AI-powered golf club recommendations with machine learning capabilities.*