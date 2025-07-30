using caddie.portal.services.Models;
using LocationContext = caddie.portal.services.Models.LocationContext;

namespace caddie.portal.services.Interfaces;

/// <summary>
/// Service for real-time GPS location tracking and course position analysis
/// </summary>
public interface ILocationTrackingService
{
    /// <summary>
    /// Process a new location update from the mobile app
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Current round ID</param>
    /// <param name="locationData">GPS location data</param>
    Task<LocationProcessingResult> ProcessLocationUpdateAsync(int userId, int roundId, LocationContext locationData);

    /// <summary>
    /// Detect current hole based on GPS coordinates
    /// </summary>
    /// <param name="courseId">Course ID</param>
    /// <param name="latitude">GPS latitude</param>
    /// <param name="longitude">GPS longitude</param>
    Task<int?> DetectCurrentHoleAsync(int courseId, decimal latitude, decimal longitude);

    /// <summary>
    /// Calculate distance to pin for current hole
    /// </summary>
    /// <param name="courseId">Course ID</param>
    /// <param name="holeNumber">Hole number</param>
    /// <param name="latitude">Current latitude</param>
    /// <param name="longitude">Current longitude</param>
    Task<decimal?> CalculateDistanceToPinAsync(int courseId, int holeNumber, decimal latitude, decimal longitude);

    /// <summary>
    /// Calculate distance to tee for current hole
    /// </summary>
    /// <param name="courseId">Course ID</param>
    /// <param name="holeNumber">Hole number</param>
    /// <param name="latitude">Current latitude</param>
    /// <param name="longitude">Current longitude</param>
    Task<decimal?> CalculateDistanceToTeeAsync(int courseId, int holeNumber, decimal latitude, decimal longitude);

    /// <summary>
    /// Determine player's position on hole (tee, fairway, rough, green, hazard)
    /// </summary>
    /// <param name="courseId">Course ID</param>
    /// <param name="holeNumber">Hole number</param>
    /// <param name="latitude">Current latitude</param>
    /// <param name="longitude">Current longitude</param>
    Task<string> DeterminePositionOnHoleAsync(int courseId, int holeNumber, decimal latitude, decimal longitude);

    /// <summary>
    /// Check if player is within course boundaries
    /// </summary>
    /// <param name="courseId">Course ID</param>
    /// <param name="latitude">GPS latitude</param>
    /// <param name="longitude">GPS longitude</param>
    Task<bool> IsWithinCourseBoundariesAsync(int courseId, decimal latitude, decimal longitude);

    /// <summary>
    /// Get recent location history for a round
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Round ID</param>
    /// <param name="limitMinutes">Time limit in minutes (default: 60)</param>
    Task<IEnumerable<LocationHistoryPoint>> GetRecentLocationHistoryAsync(int userId, int roundId, int limitMinutes = 60);

    /// <summary>
    /// Analyze movement pattern to detect potential shots
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Round ID</param>
    /// <param name="currentLocation">Current location</param>
    Task<MovementAnalysisResult> AnalyzeMovementPatternAsync(int userId, int roundId, LocationContext currentLocation);

    /// <summary>
    /// Update AI context with location information
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Round ID</param>
    /// <param name="locationContext">Location context</param>
    Task UpdateAILocationContextAsync(int userId, int roundId, LocationContext locationContext);
}

/// <summary>
/// Result of location processing
/// </summary>
public class LocationProcessingResult
{
    /// <summary>
    /// Successfully processed location
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Detected current hole (if changed)
    /// </summary>
    public int? DetectedHole { get; set; }

    /// <summary>
    /// Distance to pin in meters
    /// </summary>
    public decimal? DistanceToPin { get; set; }

    /// <summary>
    /// Distance to tee in meters
    /// </summary>
    public decimal? DistanceToTee { get; set; }

    /// <summary>
    /// Position on hole
    /// </summary>
    public string? PositionOnHole { get; set; }

    /// <summary>
    /// Whether player is within course boundaries
    /// </summary>
    public bool IsWithinBoundaries { get; set; }

    /// <summary>
    /// Potential shot detected
    /// </summary>
    public bool ShotDetected { get; set; }

    /// <summary>
    /// Processing messages or warnings
    /// </summary>
    public List<string> Messages { get; set; } = new();

    /// <summary>
    /// Processing timestamp
    /// </summary>
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Historical location point
/// </summary>
public class LocationHistoryPoint
{
    /// <summary>
    /// GPS latitude
    /// </summary>
    public decimal Latitude { get; set; }

    /// <summary>
    /// GPS longitude
    /// </summary>
    public decimal Longitude { get; set; }

    /// <summary>
    /// GPS accuracy in meters
    /// </summary>
    public decimal? AccuracyMeters { get; set; }

    /// <summary>
    /// Detected hole at this location
    /// </summary>
    public int? DetectedHole { get; set; }

    /// <summary>
    /// Distance to pin at this location
    /// </summary>
    public decimal? DistanceToPin { get; set; }

    /// <summary>
    /// Position on hole at this location
    /// </summary>
    public string? PositionOnHole { get; set; }

    /// <summary>
    /// Movement speed in meters per second
    /// </summary>
    public decimal? MovementSpeed { get; set; }

    /// <summary>
    /// Timestamp of location
    /// </summary>
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// Movement analysis result for shot detection
/// </summary>
public class MovementAnalysisResult
{
    /// <summary>
    /// Whether a shot was detected
    /// </summary>
    public bool ShotDetected { get; set; }

    /// <summary>
    /// Confidence level of shot detection (0.0 to 1.0)
    /// </summary>
    public decimal Confidence { get; set; }

    /// <summary>
    /// Estimated distance of shot in meters
    /// </summary>
    public decimal? EstimatedShotDistance { get; set; }

    /// <summary>
    /// Estimated club used (if determinable)
    /// </summary>
    public string? EstimatedClub { get; set; }

    /// <summary>
    /// Start location of potential shot
    /// </summary>
    public LocationHistoryPoint? StartLocation { get; set; }

    /// <summary>
    /// End location of potential shot
    /// </summary>
    public LocationHistoryPoint? EndLocation { get; set; }

    /// <summary>
    /// Time taken for movement (seconds)
    /// </summary>
    public decimal? MovementDuration { get; set; }

    /// <summary>
    /// Analysis messages
    /// </summary>
    public List<string> AnalysisNotes { get; set; } = new();

    /// <summary>
    /// Analysis timestamp
    /// </summary>
    public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;
}