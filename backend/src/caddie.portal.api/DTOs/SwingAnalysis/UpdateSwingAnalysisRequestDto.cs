using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.SwingAnalysis;

/// <summary>
/// Request DTO for updating an existing swing analysis record
/// </summary>
public class UpdateSwingAnalysisRequestDto
{
    /// <summary>
    /// Club head speed in miles per hour measured at impact
    /// </summary>
    [Range(40, 150, ErrorMessage = "Swing speed must be between 40 and 150 mph")]
    public decimal? SwingSpeedMph { get; set; }

    /// <summary>
    /// Primary swing plane angle in degrees
    /// </summary>
    [Range(-180, 180, ErrorMessage = "Swing angle must be between -180 and 180 degrees")]
    public decimal? SwingAngleDegrees { get; set; }

    /// <summary>
    /// Maximum backswing angle in degrees
    /// </summary>
    [Range(-180, 180, ErrorMessage = "Backswing angle must be between -180 and 180 degrees")]
    public decimal? BackswingAngleDegrees { get; set; }

    /// <summary>
    /// Follow-through completion angle in degrees
    /// </summary>
    [Range(-180, 180, ErrorMessage = "Follow-through angle must be between -180 and 180 degrees")]
    public decimal? FollowThroughAngleDegrees { get; set; }

    /// <summary>
    /// Confidence score (0.0-1.0) that detected motion was an actual golf swing
    /// </summary>
    [Range(0.0, 1.0, ErrorMessage = "Detection confidence must be between 0.0 and 1.0")]
    public decimal? DetectionConfidence { get; set; }

    /// <summary>
    /// AI-generated swing quality score from 0-10 based on technique analysis
    /// </summary>
    [Range(0, 10, ErrorMessage = "Swing quality score must be between 0 and 10")]
    public decimal? SwingQualityScore { get; set; }

    /// <summary>
    /// AI-generated feedback and improvement suggestions for the swing
    /// </summary>
    public string? AiFeedback { get; set; }

    /// <summary>
    /// Template or pro swing used for comparison analysis
    /// </summary>
    [StringLength(50, ErrorMessage = "Compared to template cannot exceed 50 characters")]
    public string? ComparedToTemplate { get; set; }

    /// <summary>
    /// Golf club used for the shot (driver, 7-iron, etc.)
    /// </summary>
    [StringLength(50, ErrorMessage = "Club used cannot exceed 50 characters")]
    public string? ClubUsed { get; set; }

    /// <summary>
    /// Distance to pin in yards at time of swing
    /// </summary>
    [Range(0, 600, ErrorMessage = "Distance to pin must be between 0 and 600 yards")]
    public int? DistanceToPinYards { get; set; }
}