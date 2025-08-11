using System.ComponentModel.DataAnnotations;

namespace caddie.portal.services.Models;

/// <summary>
/// Comprehensive context for AI caddie response generation
/// </summary>
public class CaddieContext
{
    /// <summary>
    /// Current location and golf course context
    /// </summary>
    public LocationContext? Location { get; set; }

    /// <summary>
    /// Current golf situation and shot context
    /// </summary>
    public GolfSituation? GolfContext { get; set; }

    /// <summary>
    /// Player information and preferences
    /// </summary>
    public PlayerContext? Player { get; set; }

    /// <summary>
    /// Recent conversation history for context
    /// </summary>
    public ConversationContext? History { get; set; }

    /// <summary>
    /// Weather and course conditions
    /// </summary>
    public CourseConditions? Conditions { get; set; }

    /// <summary>
    /// Additional metadata for the caddie context
    /// </summary>
    public Dictionary<string, object>? Metadata { get; set; }
}

/// <summary>
/// Current golf situation context
/// </summary>
public class GolfSituation
{
    /// <summary>
    /// Current hole number (1-18)
    /// </summary>
    [Range(1, 18)]
    public int? CurrentHole { get; set; }

    /// <summary>
    /// Distance to target in yards
    /// </summary>
    public decimal? TargetDistanceYards { get; set; }

    /// <summary>
    /// Recommended club for current shot
    /// </summary>
    public string? RecommendedClub { get; set; }

    /// <summary>
    /// Type of shot being attempted
    /// </summary>
    public ShotType ShotType { get; set; } = ShotType.General;

    /// <summary>
    /// Current position on the hole
    /// </summary>
    public string? PositionOnHole { get; set; }

    /// <summary>
    /// Whether shot placement is currently active
    /// </summary>
    public bool ShotPlacementActive { get; set; } = false;

    /// <summary>
    /// Current score for the hole
    /// </summary>
    public int? CurrentScore { get; set; }

    /// <summary>
    /// Par for current hole
    /// </summary>
    [Range(3, 5)]
    public int? HolePar { get; set; }

    /// <summary>
    /// Shot history for current hole
    /// </summary>
    public List<ShotHistoryItem>? ShotHistory { get; set; }

    /// <summary>
    /// Strategic notes for current situation
    /// </summary>
    public string? StrategicNotes { get; set; }
}

/// <summary>
/// Player context and preferences
/// </summary>
public class PlayerContext
{
    /// <summary>
    /// Player's handicap index
    /// </summary>
    public decimal? HandicapIndex { get; set; }

    /// <summary>
    /// Player's skill level
    /// </summary>
    public SkillLevel SkillLevel { get; set; } = SkillLevel.Intermediate;

    /// <summary>
    /// Player's preferred communication style
    /// </summary>
    public CommunicationStyle CommunicationStyle { get; set; } = CommunicationStyle.Encouraging;

    /// <summary>
    /// Round statistics for current session
    /// </summary>
    public RoundStatistics? CurrentRoundStats { get; set; }

    /// <summary>
    /// Player's typical club distances
    /// </summary>
    public Dictionary<string, int>? ClubDistances { get; set; }

    /// <summary>
    /// Player preferences and settings
    /// </summary>
    public Dictionary<string, object>? Preferences { get; set; }
}

/// <summary>
/// Conversation history context
/// </summary>
public class ConversationContext
{
    /// <summary>
    /// Recent messages in conversation
    /// </summary>
    public List<ConversationMessage>? RecentMessages { get; set; }

    /// <summary>
    /// Last AI response for continuity
    /// </summary>
    public string? LastResponse { get; set; }

    /// <summary>
    /// Conversation topic or theme
    /// </summary>
    public string? ConversationTopic { get; set; }

    /// <summary>
    /// User's recent queries or concerns
    /// </summary>
    public List<string>? RecentQueries { get; set; }
}

/// <summary>
/// Course and weather conditions
/// </summary>
public class CourseConditions
{
    /// <summary>
    /// Wind speed in mph
    /// </summary>
    public decimal? WindSpeedMph { get; set; }

    /// <summary>
    /// Wind direction (N, NE, E, etc.)
    /// </summary>
    public string? WindDirection { get; set; }

    /// <summary>
    /// Temperature in Fahrenheit
    /// </summary>
    public decimal? TemperatureFahrenheit { get; set; }

    /// <summary>
    /// Course condition (wet, dry, firm, soft)
    /// </summary>
    public string? CourseCondition { get; set; }

    /// <summary>
    /// Green speed (stimpmeter reading)
    /// </summary>
    public decimal? GreenSpeed { get; set; }

    /// <summary>
    /// Time of day for lighting considerations
    /// </summary>
    public TimeSpan? TimeOfDay { get; set; }

    /// <summary>
    /// Weather description (sunny, cloudy, rainy)
    /// </summary>
    public string? WeatherDescription { get; set; }
}

/// <summary>
/// Individual shot history item
/// </summary>
public class ShotHistoryItem
{
    /// <summary>
    /// Shot number in sequence
    /// </summary>
    public int ShotNumber { get; set; }

    /// <summary>
    /// Club used for shot
    /// </summary>
    public string? Club { get; set; }

    /// <summary>
    /// Distance of shot in yards
    /// </summary>
    public decimal DistanceYards { get; set; }

    /// <summary>
    /// Shot accuracy description
    /// </summary>
    public string? Accuracy { get; set; }

    /// <summary>
    /// Timestamp of shot
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Result of shot (fairway, rough, green, etc.)
    /// </summary>
    public string? Result { get; set; }
}

/// <summary>
/// Round statistics for context
/// </summary>
public class RoundStatistics
{
    /// <summary>
    /// Current total score
    /// </summary>
    public int CurrentScore { get; set; }

    /// <summary>
    /// Score relative to par
    /// </summary>
    public int RelativeToPar { get; set; }

    /// <summary>
    /// Number of holes completed
    /// </summary>
    public int HolesCompleted { get; set; }

    /// <summary>
    /// Fairways hit percentage
    /// </summary>
    public decimal? FairwaysHitPercentage { get; set; }

    /// <summary>
    /// Greens in regulation percentage
    /// </summary>
    public decimal? GreensInRegulationPercentage { get; set; }

    /// <summary>
    /// Average putts per hole
    /// </summary>
    public decimal? AveragePutts { get; set; }

    /// <summary>
    /// Best hole score
    /// </summary>
    public int? BestHole { get; set; }

    /// <summary>
    /// Most challenging hole
    /// </summary>
    public int? WorstHole { get; set; }
}

/// <summary>
/// Caddie response request model
/// </summary>
public class CaddieResponseRequest
{
    /// <summary>
    /// User making the request
    /// </summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>
    /// Current active round ID
    /// </summary>
    [Required]
    public int RoundId { get; set; }

    /// <summary>
    /// Scenario for response generation
    /// </summary>
    [Required]
    public CaddieScenario Scenario { get; set; }

    /// <summary>
    /// Comprehensive context for response generation
    /// </summary>
    public CaddieContext? Context { get; set; }

    /// <summary>
    /// Optional user input for context
    /// </summary>
    public string? UserInput { get; set; }

    /// <summary>
    /// Additional metadata for the request
    /// </summary>
    public Dictionary<string, object>? Metadata { get; set; }
}

/// <summary>
/// Caddie response model
/// </summary>
public class CaddieResponseResponse
{
    /// <summary>
    /// AI-generated caddie response optimized for TTS
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Unique identifier for this response
    /// </summary>
    public string ResponseId { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Scenario that generated this response
    /// </summary>
    public CaddieScenario Scenario { get; set; }

    /// <summary>
    /// Timestamp when response was generated
    /// </summary>
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Response confidence score (0.0 to 1.0)
    /// </summary>
    public decimal ConfidenceScore { get; set; } = 0.8m;

    /// <summary>
    /// Suggested follow-up actions
    /// </summary>
    public List<string>? SuggestedActions { get; set; }

    /// <summary>
    /// Token usage information
    /// </summary>
    public TokenUsage? TokenUsage { get; set; }

    /// <summary>
    /// Whether this response requires user confirmation
    /// </summary>
    public bool RequiresConfirmation { get; set; } = false;

    /// <summary>
    /// Strategic advice category
    /// </summary>
    public string? AdviceCategory { get; set; }
}

/// <summary>
/// Caddie response scenarios
/// </summary>
public enum CaddieScenario
{
    /// <summary>
    /// Welcome to shot placement mode
    /// </summary>
    ShotPlacementWelcome,

    /// <summary>
    /// Club recommendation for target distance
    /// </summary>
    ClubRecommendation,

    /// <summary>
    /// Shot placement confirmation
    /// </summary>
    ShotPlacementConfirmation,

    /// <summary>
    /// Shot tracking activation
    /// </summary>
    ShotTrackingActivation,

    /// <summary>
    /// Shot in progress update
    /// </summary>
    ShotInProgress,

    /// <summary>
    /// Shot completion feedback
    /// </summary>
    ShotCompletion,

    /// <summary>
    /// Movement detected during shot
    /// </summary>
    MovementDetected,

    /// <summary>
    /// Distance announcement
    /// </summary>
    DistanceAnnouncement,

    /// <summary>
    /// Hole completion commentary
    /// </summary>
    HoleCompletion,

    /// <summary>
    /// Error handling and recovery
    /// </summary>
    ErrorHandling,

    /// <summary>
    /// General golf assistance
    /// </summary>
    GeneralAssistance,

    /// <summary>
    /// Course strategy advice
    /// </summary>
    CourseStrategy,

    /// <summary>
    /// Performance encouragement
    /// </summary>
    PerformanceEncouragement,

    /// <summary>
    /// Weather and conditions advice
    /// </summary>
    WeatherConditions
}

/// <summary>
/// Types of golf shots
/// </summary>
public enum ShotType
{
    General,
    Drive,
    Approach,
    ChipShot,
    PitchShot,
    BunkerShot,
    Putt,
    RecoveryShot,
    LayupShot
}

/// <summary>
/// Player skill levels
/// </summary>
public enum SkillLevel
{
    Beginner,
    Intermediate,
    Advanced,
    Professional
}

/// <summary>
/// Communication style preferences
/// </summary>
public enum CommunicationStyle
{
    /// <summary>
    /// Highly encouraging and positive
    /// </summary>
    Encouraging,

    /// <summary>
    /// Direct and technical
    /// </summary>
    Technical,

    /// <summary>
    /// Balanced approach
    /// </summary>
    Balanced,

    /// <summary>
    /// Casual and friendly
    /// </summary>
    Casual,

    /// <summary>
    /// Professional and formal
    /// </summary>
    Professional
}