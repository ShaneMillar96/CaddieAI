using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.ClubRecommendation;

public class CreateClubRecommendationRequestDto
{
    [Required]
    public int UserId { get; set; }

    public int? RoundId { get; set; }

    public int? HoleId { get; set; }

    public int? LocationId { get; set; }

    [Required]
    [Range(1, 1000)]
    public decimal DistanceToTarget { get; set; }

    [StringLength(200)]
    public string? WeatherConditions { get; set; }

    [StringLength(100)]
    public string? LieConditions { get; set; }

    [StringLength(50)]
    public string? ShotType { get; set; }

    [StringLength(500)]
    public string? PlayerNotes { get; set; }

    public Dictionary<string, object>? AdditionalContext { get; set; }
}