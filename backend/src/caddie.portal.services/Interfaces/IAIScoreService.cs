using caddie.portal.services.Models;
using LocationContext = caddie.portal.services.Models.LocationContext;

namespace caddie.portal.services.Interfaces;

/// <summary>
/// Service for AI-powered automatic score recording and validation
/// </summary>
public interface IAIScoreService
{
    /// <summary>
    /// Automatically detect and record hole score based on shot events and location data
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Round ID</param>
    /// <param name="holeNumber">Hole number</param>
    /// <param name="shotEvents">Shot events for the hole</param>
    /// <param name="finalLocation">Final location data</param>
    Task<AutoScoreResult> ProcessHoleCompletionAsync(int userId, int roundId, int holeNumber, 
        IEnumerable<object> shotEvents, object finalLocation);

    /// <summary>
    /// Validate and confirm an AI-detected score
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Round ID</param>
    /// <param name="holeNumber">Hole number</param>
    /// <param name="detectedScore">AI-detected score</param>
    /// <param name="userConfirmedScore">User-confirmed score (if different)</param>
    Task<ScoreValidationResult> ValidateAndRecordScoreAsync(int userId, int roundId, int holeNumber, 
        int detectedScore, int? userConfirmedScore = null);

    /// <summary>
    /// Get score suggestions for a hole based on shot analysis
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Round ID</param>
    /// <param name="holeNumber">Hole number</param>
    Task<ScoreSuggestion> GetScoreSuggestionAsync(int userId, int roundId, int holeNumber);

    /// <summary>
    /// Analyze hole completion based on GPS location and course layout
    /// </summary>
    /// <param name="courseId">Course ID</param>
    /// <param name="holeNumber">Hole number</param>
    /// <param name="currentLocation">Current GPS location</param>
    Task<HoleCompletionAnalysis> AnalyzeHoleCompletionAsync(int courseId, int holeNumber, LocationContext currentLocation);

    /// <summary>
    /// Update score with AI-generated commentary
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Round ID</param>
    /// <param name="holeNumber">Hole number</param>
    /// <param name="score">Final score</param>
    /// <param name="par">Hole par</param>
    Task<string> GenerateScoreCommentaryAsync(int userId, int roundId, int holeNumber, int score, int par);

    /// <summary>
    /// Get AI scoring statistics for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="fromDate">Start date for statistics</param>
    Task<AIScoreStatistics> GetScoringStatisticsAsync(int userId, DateTime? fromDate = null);
}

/// <summary>
/// Result of automatic score processing
/// </summary>
public class AutoScoreResult
{
    /// <summary>
    /// Whether hole completion was successfully detected
    /// </summary>
    public bool HoleCompleted { get; set; }

    /// <summary>
    /// AI-detected score
    /// </summary>
    public int DetectedScore { get; set; }

    /// <summary>
    /// Confidence level of score detection (0.0-1.0)
    /// </summary>
    public decimal Confidence { get; set; }

    /// <summary>
    /// Shot events that contributed to the score
    /// </summary>
    public List<ShotEventSummary> ShotEvents { get; set; } = new();

    /// <summary>
    /// Distance from final location to hole
    /// </summary>
    public decimal? DistanceToHole { get; set; }

    /// <summary>
    /// Whether the score requires user confirmation
    /// </summary>
    public bool RequiresConfirmation { get; set; }

    /// <summary>
    /// Reasons for the score detection
    /// </summary>
    public List<string> DetectionReasons { get; set; } = new();

    /// <summary>
    /// Generated commentary for the hole
    /// </summary>
    public string? Commentary { get; set; }

    /// <summary>
    /// Processing timestamp
    /// </summary>
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Result of score validation
/// </summary>
public class ScoreValidationResult
{
    /// <summary>
    /// Final recorded score
    /// </summary>
    public int FinalScore { get; set; }

    /// <summary>
    /// Whether score was user-corrected
    /// </summary>
    public bool UserCorrected { get; set; }

    /// <summary>
    /// Original AI-detected score
    /// </summary>
    public int OriginalDetectedScore { get; set; }

    /// <summary>
    /// Validation confidence
    /// </summary>
    public decimal ValidationConfidence { get; set; }

    /// <summary>
    /// Validation notes
    /// </summary>
    public List<string> ValidationNotes { get; set; } = new();

    /// <summary>
    /// Whether score was successfully recorded
    /// </summary>
    public bool RecordingSuccessful { get; set; }

    /// <summary>
    /// Generated commentary
    /// </summary>
    public string? Commentary { get; set; }
}

/// <summary>
/// Score suggestion based on analysis
/// </summary>
public class ScoreSuggestion
{
    /// <summary>
    /// Suggested score
    /// </summary>
    public int SuggestedScore { get; set; }

    /// <summary>
    /// Confidence in suggestion
    /// </summary>
    public decimal Confidence { get; set; }

    /// <summary>
    /// Alternative score suggestions
    /// </summary>
    public List<int> AlternativeScores { get; set; } = new();

    /// <summary>
    /// Reasoning for the suggestion
    /// </summary>
    public List<string> Reasoning { get; set; } = new();

    /// <summary>
    /// Shot count detected
    /// </summary>
    public int DetectedShotCount { get; set; }

    /// <summary>
    /// Notable events during the hole
    /// </summary>
    public List<string> NotableEvents { get; set; } = new();
}

/// <summary>
/// Analysis of hole completion status
/// </summary>
public class HoleCompletionAnalysis
{
    /// <summary>
    /// Whether player is near the hole
    /// </summary>
    public bool IsNearHole { get; set; }

    /// <summary>
    /// Distance to hole in meters
    /// </summary>
    public decimal DistanceToHole { get; set; }

    /// <summary>
    /// Whether player is on the green
    /// </summary>
    public bool IsOnGreen { get; set; }

    /// <summary>
    /// Completion confidence
    /// </summary>
    public decimal CompletionConfidence { get; set; }

    /// <summary>
    /// Recommended action
    /// </summary>
    public string RecommendedAction { get; set; } = string.Empty;

    /// <summary>
    /// Analysis notes
    /// </summary>
    public List<string> AnalysisNotes { get; set; } = new();
}

/// <summary>
/// Summary of a shot event
/// </summary>
public class ShotEventSummary
{
    public int ShotNumber { get; set; }
    public decimal Distance { get; set; }
    public string? EstimatedClub { get; set; }
    public string? ShotType { get; set; }
    public decimal Confidence { get; set; }
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// AI scoring statistics
/// </summary>
public class AIScoreStatistics
{
    /// <summary>
    /// Total holes with AI scoring
    /// </summary>
    public int TotalHolesWithAIScoring { get; set; }

    /// <summary>
    /// AI scoring accuracy percentage
    /// </summary>
    public decimal AccuracyPercentage { get; set; }

    /// <summary>
    /// Average confidence score
    /// </summary>
    public decimal AverageConfidence { get; set; }

    /// <summary>
    /// Number of user corrections
    /// </summary>
    public int UserCorrections { get; set; }

    /// <summary>
    /// User correction rate
    /// </summary>
    public decimal CorrectionRate { get; set; }

    /// <summary>
    /// Most common correction reasons
    /// </summary>
    public List<string> CommonCorrectionReasons { get; set; } = new();

    /// <summary>
    /// Statistics period
    /// </summary>
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
}