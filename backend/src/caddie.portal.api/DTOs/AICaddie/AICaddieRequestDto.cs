using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.AICaddie;

/// <summary>
/// Request to initialize voice session with enhanced AI caddie
/// </summary>
public class AICaddieVoiceSessionRequest
{
    /// <summary>
    /// User ID for the voice session
    /// </summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>
    /// Current round ID (0 for general advice mode without active round)
    /// </summary>
    public int RoundId { get; set; }

    /// <summary>
    /// Current hole number (1-18)
    /// </summary>
    [Range(1, 18)]
    public int? CurrentHole { get; set; }

    /// <summary>
    /// Current location coordinates
    /// </summary>
    public LocationContextDto? Location { get; set; }

    /// <summary>
    /// Additional context metadata
    /// </summary>
    public Dictionary<string, object>? Metadata { get; set; }
}

/// <summary>
/// Response for voice session initialization
/// </summary>
public class AICaddieVoiceSessionResponse
{
    /// <summary>
    /// Session ID for tracking
    /// </summary>
    public string SessionId { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// User context including skill profile
    /// </summary>
    public UserContextResponse UserContext { get; set; } = new();

    /// <summary>
    /// Current golf context
    /// </summary>
    public GolfContextDto GolfContext { get; set; } = new();

    /// <summary>
    /// Session initialization timestamp
    /// </summary>
    public DateTime InitializedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Initial greeting message
    /// </summary>
    public string? GreetingMessage { get; set; }
}

/// <summary>
/// Request for shot analysis and recommendations
/// </summary>
public class ShotAnalysisRequest
{
    /// <summary>
    /// User ID requesting analysis
    /// </summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>
    /// Current round ID (0 for general advice mode without active round)
    /// </summary>
    public int RoundId { get; set; }

    /// <summary>
    /// Current location coordinates
    /// </summary>
    [Required]
    public LocationContextDto Location { get; set; } = new();

    /// <summary>
    /// Target location (if selected)
    /// </summary>
    public LocationContextDto? TargetLocation { get; set; }

    /// <summary>
    /// Current hole number
    /// </summary>
    [Range(1, 18)]
    public int CurrentHole { get; set; }

    /// <summary>
    /// Additional shot context
    /// </summary>
    public ShotContextDto? ShotContext { get; set; }
}

/// <summary>
/// Response with shot analysis and recommendations
/// </summary>
public class ShotAnalysisResponse
{
    /// <summary>
    /// Detected shot type
    /// </summary>
    public ShotTypeDto ShotType { get; set; } = new();

    /// <summary>
    /// Club recommendation based on skill level
    /// </summary>
    public ClubRecommendationDto ClubRecommendation { get; set; } = new();

    /// <summary>
    /// Strategic advice tailored to skill level
    /// </summary>
    public SkillBasedAdviceDto StrategicAdvice { get; set; } = new();

    /// <summary>
    /// Distance calculations
    /// </summary>
    public DistanceAnalysisDto DistanceAnalysis { get; set; } = new();

    /// <summary>
    /// Analysis confidence score (0.0 - 1.0)
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal ConfidenceScore { get; set; }

    /// <summary>
    /// Analysis timestamp
    /// </summary>
    public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// User context with skill profile data
/// </summary>
public class UserContextResponse
{
    /// <summary>
    /// User identifier
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// User's full name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// User's handicap index
    /// </summary>
    public decimal? Handicap { get; set; }

    /// <summary>
    /// Skill level information
    /// </summary>
    public SkillLevelDto SkillLevel { get; set; } = new();

    /// <summary>
    /// Playing style preferences
    /// </summary>
    public string? PlayingStyle { get; set; }

    /// <summary>
    /// User preferences
    /// </summary>
    public Dictionary<string, object>? Preferences { get; set; }

    /// <summary>
    /// Communication style preference
    /// </summary>
    public string CommunicationStyle { get; set; } = "encouraging";
}

/// <summary>
/// Location context for shot analysis
/// </summary>
public class LocationContextDto
{
    /// <summary>
    /// Latitude coordinate
    /// </summary>
    [Required]
    public decimal Latitude { get; set; }

    /// <summary>
    /// Longitude coordinate
    /// </summary>
    [Required]
    public decimal Longitude { get; set; }

    /// <summary>
    /// Altitude if available
    /// </summary>
    public decimal? Altitude { get; set; }

    /// <summary>
    /// Location accuracy in meters
    /// </summary>
    public decimal? Accuracy { get; set; }

    /// <summary>
    /// Timestamp of location capture
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Golf context information
/// </summary>
public class GolfContextDto
{
    /// <summary>
    /// Current course information
    /// </summary>
    public CourseContextDto? Course { get; set; }

    /// <summary>
    /// Current hole information
    /// </summary>
    public HoleContextDto? CurrentHole { get; set; }

    /// <summary>
    /// Round information
    /// </summary>
    public RoundContextDto? Round { get; set; }

    /// <summary>
    /// Weather conditions
    /// </summary>
    public WeatherContextDto? Weather { get; set; }
}

/// <summary>
/// Shot context information
/// </summary>
public class ShotContextDto
{
    /// <summary>
    /// Position on hole (tee, fairway, rough, etc.)
    /// </summary>
    public string? Position { get; set; }

    /// <summary>
    /// Lie quality (good, average, poor)
    /// </summary>
    public string? LieQuality { get; set; }

    /// <summary>
    /// Slope information (uphill, downhill, sidehill)
    /// </summary>
    public string? Slope { get; set; }

    /// <summary>
    /// Hazards near target area
    /// </summary>
    public List<string>? Hazards { get; set; }

    /// <summary>
    /// Shot intention (aggressive, conservative, normal)
    /// </summary>
    public string? Intention { get; set; }
}

/// <summary>
/// Shot type classification
/// </summary>
public class ShotTypeDto
{
    /// <summary>
    /// Primary shot type
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Shot type confidence (0.0 - 1.0)
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal Confidence { get; set; }

    /// <summary>
    /// Reasoning for shot type classification
    /// </summary>
    public string? Reasoning { get; set; }

    /// <summary>
    /// Alternative shot types considered
    /// </summary>
    public List<string>? Alternatives { get; set; }
}

/// <summary>
/// Club recommendation with reasoning
/// </summary>
public class ClubRecommendationDto
{
    /// <summary>
    /// Primary club recommendation
    /// </summary>
    public string Club { get; set; } = string.Empty;

    /// <summary>
    /// Alternative club options
    /// </summary>
    public List<string>? Alternatives { get; set; }

    /// <summary>
    /// Reasoning for recommendation
    /// </summary>
    public string? Reasoning { get; set; }

    /// <summary>
    /// Confidence in recommendation (0.0 - 1.0)
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal Confidence { get; set; }

    /// <summary>
    /// Skill level adjustments made
    /// </summary>
    public List<string>? SkillAdjustments { get; set; }
}

/// <summary>
/// Skill-based strategic advice
/// </summary>
public class SkillBasedAdviceDto
{
    /// <summary>
    /// Primary strategic advice
    /// </summary>
    public string Advice { get; set; } = string.Empty;

    /// <summary>
    /// Target area recommendation
    /// </summary>
    public string? TargetArea { get; set; }

    /// <summary>
    /// Risk assessment
    /// </summary>
    public string? RiskAssessment { get; set; }

    /// <summary>
    /// Course management tips
    /// </summary>
    public List<string>? CourseManagement { get; set; }

    /// <summary>
    /// Skill-specific tips
    /// </summary>
    public List<string>? SkillTips { get; set; }
}

/// <summary>
/// Distance analysis information
/// </summary>
public class DistanceAnalysisDto
{
    /// <summary>
    /// Distance to pin in yards
    /// </summary>
    public decimal DistanceToPinYards { get; set; }

    /// <summary>
    /// Carry distance needed in yards
    /// </summary>
    public decimal? CarryDistanceYards { get; set; }

    /// <summary>
    /// Elevation change in yards
    /// </summary>
    public decimal? ElevationChangeYards { get; set; }

    /// <summary>
    /// Effective playing distance (adjusted for conditions)
    /// </summary>
    public decimal? EffectiveDistanceYards { get; set; }

    /// <summary>
    /// Distance to hazards
    /// </summary>
    public Dictionary<string, decimal>? HazardDistances { get; set; }
}

/// <summary>
/// Skill level information
/// </summary>
public class SkillLevelDto
{
    /// <summary>
    /// Skill level ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Skill level name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Skill level description
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Typical handicap range
    /// </summary>
    public string? HandicapRange { get; set; }
}

/// <summary>
/// Course context information
/// </summary>
public class CourseContextDto
{
    /// <summary>
    /// Course identifier
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Course name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Course location
    /// </summary>
    public string? Location { get; set; }

    /// <summary>
    /// Total course par
    /// </summary>
    public int ParTotal { get; set; }

    /// <summary>
    /// Course difficulty rating
    /// </summary>
    public string? Difficulty { get; set; }
}

/// <summary>
/// Hole context information
/// </summary>
public class HoleContextDto
{
    /// <summary>
    /// Hole number
    /// </summary>
    public int Number { get; set; }

    /// <summary>
    /// Hole par
    /// </summary>
    public int Par { get; set; }

    /// <summary>
    /// Hole yardage
    /// </summary>
    public int? Yardage { get; set; }

    /// <summary>
    /// Hole description
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Hole difficulty rating
    /// </summary>
    public int? Handicap { get; set; }
}

/// <summary>
/// Round context information
/// </summary>
public class RoundContextDto
{
    /// <summary>
    /// Round identifier
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Round start time
    /// </summary>
    public DateTime StartTime { get; set; }

    /// <summary>
    /// Current hole in round
    /// </summary>
    public int CurrentHole { get; set; }

    /// <summary>
    /// Round status
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Current score
    /// </summary>
    public int? CurrentScore { get; set; }
}

/// <summary>
/// Weather context information
/// </summary>
public class WeatherContextDto
{
    /// <summary>
    /// Weather conditions
    /// </summary>
    public string? Conditions { get; set; }

    /// <summary>
    /// Temperature in Fahrenheit
    /// </summary>
    public decimal? Temperature { get; set; }

    /// <summary>
    /// Wind speed in mph
    /// </summary>
    public decimal? WindSpeed { get; set; }

    /// <summary>
    /// Wind direction
    /// </summary>
    public string? WindDirection { get; set; }

    /// <summary>
    /// Humidity percentage
    /// </summary>
    public decimal? Humidity { get; set; }
}