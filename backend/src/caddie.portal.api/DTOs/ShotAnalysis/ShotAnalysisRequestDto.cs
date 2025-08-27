using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.ShotAnalysis;

/// <summary>
/// Request model for shot analysis with weather integration
/// </summary>
public class ShotAnalysisRequestDto
{
    /// <summary>
    /// User identifier for personalized recommendations
    /// </summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>
    /// Active round identifier for context
    /// </summary>
    [Required]
    public int RoundId { get; set; }

    /// <summary>
    /// Current hole number
    /// </summary>
    [Required]
    [Range(1, 18, ErrorMessage = "Hole number must be between 1 and 18")]
    public int HoleNumber { get; set; }

    /// <summary>
    /// Distance to target in yards
    /// </summary>
    [Required]
    [Range(10, 600, ErrorMessage = "Distance must be between 10 and 600 yards")]
    public int DistanceYards { get; set; }

    /// <summary>
    /// Current latitude position
    /// </summary>
    [Required]
    [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90")]
    public double Latitude { get; set; }

    /// <summary>
    /// Current longitude position
    /// </summary>
    [Required]
    [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180")]
    public double Longitude { get; set; }

    /// <summary>
    /// Player skill level for personalized recommendations
    /// </summary>
    [StringLength(20, ErrorMessage = "Skill level cannot exceed 20 characters")]
    public string? PlayerSkillLevel { get; set; }
}