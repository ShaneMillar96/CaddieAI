using System.ComponentModel.DataAnnotations;

namespace caddie.portal.services.Models;

/// <summary>
/// Request model for voice AI golf advice
/// </summary>
public class VoiceAIRequest
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
    /// Voice input from user (speech-to-text result)
    /// </summary>
    [Required]
    [StringLength(1000, MinimumLength = 1)]
    public string VoiceInput { get; set; } = string.Empty;

    /// <summary>
    /// Current location context
    /// </summary>
    public LocationContext? LocationContext { get; set; }

    /// <summary>
    /// Recent conversation history for context
    /// </summary>
    public List<ConversationMessage>? ConversationHistory { get; set; }

    /// <summary>
    /// Additional metadata for the request
    /// </summary>
    public Dictionary<string, object>? Metadata { get; set; }
}

/// <summary>
/// Response model for voice AI golf advice
/// </summary>
public class VoiceAIResponse
{
    /// <summary>
    /// AI-generated response message (for text-to-speech)
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Unique identifier for this response
    /// </summary>
    public string ResponseId { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Timestamp when response was generated
    /// </summary>
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Token usage information
    /// </summary>
    public TokenUsage? TokenUsage { get; set; }

    /// <summary>
    /// Response confidence score (0.0 to 1.0)
    /// </summary>
    public decimal ConfidenceScore { get; set; } = 0.8m;

    /// <summary>
    /// Suggested follow-up actions
    /// </summary>
    public List<string>? SuggestedActions { get; set; }

    /// <summary>
    /// Whether this response requires user confirmation
    /// </summary>
    public bool RequiresConfirmation { get; set; } = false;
}

/// <summary>
/// Location context for AI decision making
/// </summary>
public class LocationContext
{
    /// <summary>
    /// Current GPS latitude
    /// </summary>
    [Required]
    public decimal Latitude { get; set; }

    /// <summary>
    /// Current GPS longitude
    /// </summary>
    [Required]
    public decimal Longitude { get; set; }

    /// <summary>
    /// GPS accuracy in meters
    /// </summary>
    public decimal? AccuracyMeters { get; set; }

    /// <summary>
    /// Current hole number (auto-detected or manual)
    /// </summary>
    public int? CurrentHole { get; set; }

    /// <summary>
    /// Distance to pin in meters
    /// </summary>
    public decimal? DistanceToPinMeters { get; set; }

    /// <summary>
    /// Distance to tee in meters
    /// </summary>
    public decimal? DistanceToTeeMeters { get; set; }

    /// <summary>
    /// Current position on hole (tee, fairway, rough, green, hazard)
    /// </summary>
    public string? PositionOnHole { get; set; }

    /// <summary>
    /// Player movement speed (meters per second)
    /// </summary>
    public decimal? MovementSpeedMps { get; set; }

    /// <summary>
    /// Whether player is within course boundaries
    /// </summary>
    public bool IsWithinCourseBoundaries { get; set; } = true;

    /// <summary>
    /// Timestamp of location update
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Conversation message for context
/// </summary>
public class ConversationMessage
{
    /// <summary>
    /// Message content
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Role (user or assistant)
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Message timestamp
    /// </summary>
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// Token usage information
/// </summary>
public class TokenUsage
{
    /// <summary>
    /// Input tokens used
    /// </summary>
    public int InputTokens { get; set; }

    /// <summary>
    /// Output tokens generated
    /// </summary>
    public int OutputTokens { get; set; }

    /// <summary>
    /// Total tokens consumed
    /// </summary>
    public int TotalTokens { get; set; }

    /// <summary>
    /// Estimated cost in USD
    /// </summary>
    public decimal EstimatedCost { get; set; }
}

/// <summary>
/// Location update request for real-time tracking
/// </summary>
public class LocationUpdateRequest
{
    /// <summary>
    /// User ID
    /// </summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>
    /// Active round ID
    /// </summary>
    [Required]
    public int RoundId { get; set; }

    /// <summary>
    /// Location context
    /// </summary>
    [Required]
    public LocationContext LocationContext { get; set; } = new();
}

/// <summary>
/// Hole completion commentary request
/// </summary>
public class HoleCompletionRequest
{
    /// <summary>
    /// User ID
    /// </summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>
    /// Round ID
    /// </summary>
    [Required]
    public int RoundId { get; set; }

    /// <summary>
    /// Completed hole number
    /// </summary>
    [Required]
    [Range(1, 18)]
    public int HoleNumber { get; set; }

    /// <summary>
    /// Player's score for the hole
    /// </summary>
    [Required]
    [Range(1, 15)]
    public int Score { get; set; }

    /// <summary>
    /// Hole par value
    /// </summary>
    [Required]
    [Range(3, 5)]
    public int Par { get; set; }

    /// <summary>
    /// Optional shot data for enhanced commentary
    /// </summary>
    public object? ShotData { get; set; }
}

/// <summary>
/// Hole completion commentary response
/// </summary>
public class HoleCompletionResponse
{
    /// <summary>
    /// AI-generated commentary
    /// </summary>
    public string Commentary { get; set; } = string.Empty;

    /// <summary>
    /// Hole performance summary
    /// </summary>
    public string PerformanceSummary { get; set; } = string.Empty;

    /// <summary>
    /// Score description (Eagle, Birdie, Par, etc.)
    /// </summary>
    public string ScoreDescription { get; set; } = string.Empty;

    /// <summary>
    /// Encouragement level (1-5, where 5 is most encouraging)
    /// </summary>
    public int EncouragementLevel { get; set; } = 3;

    /// <summary>
    /// Timestamp of commentary generation
    /// </summary>
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Request for AI-powered hole completion analysis
/// </summary>
public class HoleCompletionAnalysisRequest
{
    /// <summary>
    /// Round ID
    /// </summary>
    [Required]
    public int RoundId { get; set; }

    /// <summary>
    /// Current hole number
    /// </summary>
    [Required]
    [Range(1, 18)]
    public int HoleNumber { get; set; }

    /// <summary>
    /// Shot events detected during the hole
    /// </summary>
    public List<object>? ShotEvents { get; set; }

    /// <summary>
    /// Final location data when hole was completed
    /// </summary>
    public object? FinalLocation { get; set; }
}

/// <summary>
/// Request for validating and recording an AI-detected score
/// </summary>
public class ScoreValidationRequest
{
    /// <summary>
    /// Round ID
    /// </summary>
    [Required]
    public int RoundId { get; set; }

    /// <summary>
    /// Hole number
    /// </summary>
    [Required]
    [Range(1, 18)]
    public int HoleNumber { get; set; }

    /// <summary>
    /// AI-detected score
    /// </summary>
    [Required]
    [Range(1, 15)]
    public int DetectedScore { get; set; }

    /// <summary>
    /// User-confirmed score (if different from detected)
    /// </summary>
    [Range(1, 15)]
    public int? UserConfirmedScore { get; set; }
}