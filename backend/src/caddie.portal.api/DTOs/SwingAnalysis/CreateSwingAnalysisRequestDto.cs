using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using NetTopologySuite.Geometries;

namespace caddie.portal.api.DTOs.SwingAnalysis;

/// <summary>
/// Request DTO for creating a new swing analysis record
/// </summary>
public class CreateSwingAnalysisRequestDto
{
    /// <summary>
    /// The user who performed the swing
    /// </summary>
    [JsonPropertyName("userId")]
    public int UserId { get; set; }

    /// <summary>
    /// The golf round during which the swing was performed
    /// </summary>
    [JsonPropertyName("roundId")]
    public int RoundId { get; set; }

    /// <summary>
    /// Optional hole ID if swing was during a specific hole
    /// </summary>
    [JsonPropertyName("holeId")]
    public int? HoleId { get; set; }

    /// <summary>
    /// Optional Garmin device ID - only populated when detection source is garmin
    /// </summary>
    [JsonPropertyName("garminDeviceId")]
    public int? GarminDeviceId { get; set; }

    /// <summary>
    /// Club head speed in miles per hour measured at impact
    /// </summary>
    [JsonPropertyName("swingSpeedMph")]
    public decimal? SwingSpeedMph { get; set; }

    /// <summary>
    /// Primary swing plane angle in degrees
    /// </summary>
    [JsonPropertyName("swingAngleDegrees")]
    public decimal? SwingAngleDegrees { get; set; }

    /// <summary>
    /// Maximum backswing angle in degrees
    /// </summary>
    [JsonPropertyName("backswingAngleDegrees")]
    public decimal? BackswingAngleDegrees { get; set; }

    /// <summary>
    /// Follow-through completion angle in degrees
    /// </summary>
    [JsonPropertyName("followThroughAngleDegrees")]
    public decimal? FollowThroughAngleDegrees { get; set; }

    /// <summary>
    /// Source device that detected the swing (garmin or mobile)
    /// </summary>
    [JsonPropertyName("detectionSource")]
    public string DetectionSource { get; set; } = null!;

    /// <summary>
    /// Garmin device model (e.g., "Forerunner 55", "Fenix 7")
    /// </summary>
    [JsonPropertyName("deviceModel")]
    public string? DeviceModel { get; set; }

    /// <summary>
    /// Confidence score (0.0-1.0) that detected motion was an actual golf swing
    /// </summary>
    [JsonPropertyName("detectionConfidence")]
    public decimal? DetectionConfidence { get; set; }

    /// <summary>
    /// Raw sensor data as JSON for future analysis
    /// </summary>
    [JsonPropertyName("rawSensorData")]
    public object? RawSensorData { get; set; }

    /// <summary>
    /// Latitude coordinate where swing was detected
    /// </summary>
    [JsonPropertyName("latitude")]
    public decimal? Latitude { get; set; }

    /// <summary>
    /// Longitude coordinate where swing was detected
    /// </summary>
    [JsonPropertyName("longitude")]
    public decimal? Longitude { get; set; }

    /// <summary>
    /// Golf club used for the shot (driver, 7-iron, etc.)
    /// </summary>
    [JsonPropertyName("clubUsed")]
    public string? ClubUsed { get; set; }

    /// <summary>
    /// Distance to pin in yards at time of swing
    /// </summary>
    [JsonPropertyName("distanceToPinYards")]
    public int? DistanceToPinYards { get; set; }

    /// <summary>
    /// AI-generated swing quality score from 0-10 based on technique analysis
    /// </summary>
    [JsonPropertyName("swingQualityScore")]
    public decimal? SwingQualityScore { get; set; }

    /// <summary>
    /// AI-generated feedback and improvement suggestions for the swing
    /// </summary>
    [JsonPropertyName("aiFeedback")]
    public string? AiFeedback { get; set; }

    /// <summary>
    /// Template or pro swing used for comparison analysis
    /// </summary>
    [JsonPropertyName("comparedToTemplate")]
    public string? ComparedToTemplate { get; set; }
}