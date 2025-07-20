using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.ClubRecommendation;

public class ClubRecommendationFeedbackDto
{
    [Required]
    public bool WasAccepted { get; set; }

    [StringLength(50)]
    public string? ActualClubUsed { get; set; }

    [StringLength(500)]
    public string? PlayerNotes { get; set; }

    [Range(1, 5)]
    public int? ShotResult { get; set; }

    [StringLength(50)]
    public string? ShotOutcome { get; set; }
}