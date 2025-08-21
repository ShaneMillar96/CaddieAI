using NetTopologySuite.Geometries;

namespace caddie.portal.api.DTOs.SwingAnalysis;

/// <summary>
/// Response DTO for swing analysis data
/// </summary>
public class SwingAnalysisResponseDto
{
    /// <summary>
    /// Unique identifier for the swing analysis
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The user who performed the swing
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// The golf round during which the swing was performed
    /// </summary>
    public int RoundId { get; set; }

    /// <summary>
    /// Optional hole ID if swing was during a specific hole
    /// </summary>
    public int? HoleId { get; set; }

    /// <summary>
    /// Club head speed in miles per hour measured at impact
    /// </summary>
    public decimal? SwingSpeedMph { get; set; }

    /// <summary>
    /// Primary swing plane angle in degrees
    /// </summary>
    public decimal? SwingAngleDegrees { get; set; }

    /// <summary>
    /// Maximum backswing angle in degrees
    /// </summary>
    public decimal? BackswingAngleDegrees { get; set; }

    /// <summary>
    /// Follow-through completion angle in degrees
    /// </summary>
    public decimal? FollowThroughAngleDegrees { get; set; }

    /// <summary>
    /// Raw sensor data as JSON for future analysis
    /// </summary>
    public object? RawSensorData { get; set; }

    /// <summary>
    /// Source device that detected the swing (garmin or mobile)
    /// </summary>
    public string DetectionSource { get; set; } = null!;

    /// <summary>
    /// Garmin device model (e.g., "Forerunner 55", "Fenix 7")
    /// </summary>
    public string? DeviceModel { get; set; }

    /// <summary>
    /// Confidence score (0.0-1.0) that detected motion was an actual golf swing
    /// </summary>
    public decimal? DetectionConfidence { get; set; }

    /// <summary>
    /// AI-generated swing quality score from 0-10 based on technique analysis
    /// </summary>
    public decimal? SwingQualityScore { get; set; }

    /// <summary>
    /// AI-generated feedback and improvement suggestions for the swing
    /// </summary>
    public string? AiFeedback { get; set; }

    /// <summary>
    /// Template or pro swing used for comparison analysis
    /// </summary>
    public string? ComparedToTemplate { get; set; }

    /// <summary>
    /// GPS location where swing was detected
    /// </summary>
    public Point? ShotLocation { get; set; }

    /// <summary>
    /// Golf club used for the shot (driver, 7-iron, etc.)
    /// </summary>
    public string? ClubUsed { get; set; }

    /// <summary>
    /// Distance to pin in yards at time of swing
    /// </summary>
    public int? DistanceToPinYards { get; set; }

    /// <summary>
    /// Timestamp when the swing was detected
    /// </summary>
    public DateTime? DetectedAt { get; set; }

    /// <summary>
    /// Timestamp when the record was created
    /// </summary>
    public DateTime? CreatedAt { get; set; }

    /// <summary>
    /// Timestamp when the record was last updated
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}