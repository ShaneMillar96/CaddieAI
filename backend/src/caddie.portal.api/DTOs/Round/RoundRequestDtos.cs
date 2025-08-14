using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.Round;

public class CreateRoundRequestDto
{
    [Required]
    public int? CourseId { get; set; }

    [Required]
    public DateOnly RoundDate { get; set; }

    [Range(-50, 60)]
    public decimal? TemperatureCelsius { get; set; }

    [Range(0, 200)]
    public decimal? WindSpeedKmh { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MaxLength(2000)]
    public string? RoundMetadata { get; set; }
}

public class UpdateRoundRequestDto
{
    [Range(1, 18)]
    public int? CurrentHole { get; set; }

    public string? Status { get; set; }

    [Range(18, 300)]
    public int? TotalScore { get; set; }

    [Range(0, 100)]
    public int? TotalPutts { get; set; }

    [Range(0, 18)]
    public int? FairwaysHit { get; set; }

    [Range(0, 18)]
    public int? GreensInRegulation { get; set; }

    [Range(-50, 60)]
    public decimal? TemperatureCelsius { get; set; }

    [Range(0, 200)]
    public decimal? WindSpeedKmh { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MaxLength(2000)]
    public string? RoundMetadata { get; set; }
}

public class StartRoundRequestDto
{
    [Required]
    public int? CourseId { get; set; }

    public DateOnly? RoundDate { get; set; }

    [Range(-50, 60)]
    public decimal? TemperatureCelsius { get; set; }

    [Range(0, 200)]
    public decimal? WindSpeedKmh { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MaxLength(2000)]
    public string? RoundMetadata { get; set; }
}

public class CompleteRoundRequestDto
{
    [Required]
    [Range(18, 300)]
    public int TotalScore { get; set; }

    [Range(0, 100)]
    public int? TotalPutts { get; set; }

    [Range(0, 18)]
    public int? FairwaysHit { get; set; }

    [Range(0, 18)]
    public int? GreensInRegulation { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class UpdateCurrentHoleRequestDto
{
    [Required]
    [Range(1, 18)]
    public int HoleNumber { get; set; }
}

public class AbandonRoundRequestDto
{
    [MaxLength(500)]
    public string? Reason { get; set; }
}