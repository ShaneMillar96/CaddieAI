using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.Shot;

/// <summary>
/// Request DTO for creating a new shot placement
/// </summary>
public class CreateShotPlacementRequestDto
{
    /// <summary>
    /// User ID creating the shot placement
    /// </summary>
    [Required]
    public int UserId { get; set; }

    /// <summary>
    /// Round ID this shot belongs to
    /// </summary>
    [Required]
    public int RoundId { get; set; }

    /// <summary>
    /// Hole ID (optional for practice shots)
    /// </summary>
    public int? HoleId { get; set; }

    /// <summary>
    /// Shot placement coordinates
    /// </summary>
    [Required]
    [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90")]
    public double Latitude { get; set; }

    [Required]
    [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180")]
    public double Longitude { get; set; }

    /// <summary>
    /// GPS accuracy in meters
    /// </summary>
    [Range(0, 1000, ErrorMessage = "Accuracy must be between 0 and 1000 meters")]
    public double? Accuracy { get; set; }

    /// <summary>
    /// Distance to pin in yards
    /// </summary>
    [Range(0, 800, ErrorMessage = "Distance to pin must be between 0 and 800 yards")]
    public int? DistanceToPin { get; set; }

    /// <summary>
    /// Distance from current location in yards
    /// </summary>
    [Required]
    [Range(0, 800, ErrorMessage = "Distance from current must be between 0 and 800 yards")]
    public int DistanceFromCurrent { get; set; }

    /// <summary>
    /// AI-generated club recommendation
    /// </summary>
    [StringLength(50, ErrorMessage = "Club recommendation must be 50 characters or less")]
    public string? ClubRecommendation { get; set; }

    /// <summary>
    /// Additional metadata as JSON
    /// </summary>
    public string? Metadata { get; set; }
}

/// <summary>
/// Request DTO for updating shot placement progress
/// </summary>
public class UpdateShotProgressRequestDto
{
    /// <summary>
    /// Whether the shot was completed
    /// </summary>
    [Required]
    public bool IsCompleted { get; set; }

    /// <summary>
    /// Timestamp when shot was completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Actual shot outcome coordinates
    /// </summary>
    [Range(-90, 90, ErrorMessage = "Actual latitude must be between -90 and 90")]
    public double? ActualLatitude { get; set; }

    [Range(-180, 180, ErrorMessage = "Actual longitude must be between -180 and 180")]
    public double? ActualLongitude { get; set; }

    /// <summary>
    /// Club actually used
    /// </summary>
    [StringLength(50, ErrorMessage = "Club used must be 50 characters or less")]
    public string? ClubUsed { get; set; }

    /// <summary>
    /// Additional notes or feedback
    /// </summary>
    [StringLength(1000, ErrorMessage = "Notes must be 1000 characters or less")]
    public string? Notes { get; set; }

    /// <summary>
    /// Additional metadata updates
    /// </summary>
    public string? Metadata { get; set; }
}