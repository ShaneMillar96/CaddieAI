using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.Round;

/// <summary>
/// HoleScore response DTO for API responses
/// </summary>
public class HoleScoreResponseDto
{
    public int Id { get; set; }
    public int RoundId { get; set; }
    public int HoleId { get; set; }
    public int HoleNumber { get; set; }
    public int? Score { get; set; }
    public int? Putts { get; set; }
    public bool? FairwayHit { get; set; }
    public bool? GreenInRegulation { get; set; }
    public bool? UpAndDown { get; set; }
    public bool? SandSave { get; set; }
    public int? PenaltyStrokes { get; set; }
    public int? DistanceToPinYards { get; set; }
    public string? ClubUsed { get; set; }
    public string? LiePosition { get; set; }
    public string? ShotNotes { get; set; }
    public string? PerformanceNotes { get; set; }
    public string? Notes { get; set; }
    public Dictionary<string, object>? HoleMetadata { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Calculated fields
    public int? ScoreToPar { get; set; }
    public int? Par { get; set; }
    public int? YardageWhite { get; set; }
    public int? StrokeIndex { get; set; }
}

/// <summary>
/// Create HoleScore request DTO
/// </summary>
public class CreateHoleScoreRequestDto
{
    [Required]
    [Range(1, 18, ErrorMessage = "Hole number must be between 1 and 18")]
    public int HoleNumber { get; set; }
    
    [Range(1, 15, ErrorMessage = "Score must be between 1 and 15")]
    public int? Score { get; set; }
    
    [Range(0, 10, ErrorMessage = "Putts must be between 0 and 10")]
    public int? Putts { get; set; }
    
    public bool? FairwayHit { get; set; }
    public bool? GreenInRegulation { get; set; }
    public bool? UpAndDown { get; set; }
    public bool? SandSave { get; set; }
    
    [Range(0, 5, ErrorMessage = "Penalty strokes must be between 0 and 5")]
    public int? PenaltyStrokes { get; set; }
    
    [Range(0, 500, ErrorMessage = "Distance to pin must be between 0 and 500 yards")]
    public int? DistanceToPinYards { get; set; }
    
    [StringLength(50, ErrorMessage = "Club used must be less than 50 characters")]
    public string? ClubUsed { get; set; }
    
    [StringLength(20, ErrorMessage = "Lie position must be less than 20 characters")]
    public string? LiePosition { get; set; }
    
    [StringLength(500, ErrorMessage = "Shot notes must be less than 500 characters")]
    public string? ShotNotes { get; set; }
    
    [StringLength(500, ErrorMessage = "Performance notes must be less than 500 characters")]
    public string? PerformanceNotes { get; set; }
    
    public Dictionary<string, object>? HoleMetadata { get; set; }
}

/// <summary>
/// Update HoleScore request DTO
/// </summary>
public class UpdateHoleScoreRequestDto
{
    [Range(1, 15, ErrorMessage = "Score must be between 1 and 15")]
    public int? Score { get; set; }
    
    [Range(0, 10, ErrorMessage = "Putts must be between 0 and 10")]
    public int? Putts { get; set; }
    
    public bool? FairwayHit { get; set; }
    public bool? GreenInRegulation { get; set; }
    public bool? UpAndDown { get; set; }
    public bool? SandSave { get; set; }
    
    [Range(0, 5, ErrorMessage = "Penalty strokes must be between 0 and 5")]
    public int? PenaltyStrokes { get; set; }
    
    [Range(0, 500, ErrorMessage = "Distance to pin must be between 0 and 500 yards")]
    public int? DistanceToPinYards { get; set; }
    
    [StringLength(50, ErrorMessage = "Club used must be less than 50 characters")]
    public string? ClubUsed { get; set; }
    
    [StringLength(20, ErrorMessage = "Lie position must be less than 20 characters")]
    public string? LiePosition { get; set; }
    
    [StringLength(500, ErrorMessage = "Shot notes must be less than 500 characters")]
    public string? ShotNotes { get; set; }
    
    [StringLength(500, ErrorMessage = "Performance notes must be less than 500 characters")]
    public string? PerformanceNotes { get; set; }
    
    public Dictionary<string, object>? HoleMetadata { get; set; }
}

/// <summary>
/// HoleScore list item for simplified listings
/// </summary>
public class HoleScoreListDto
{
    public int Id { get; set; }
    public int HoleNumber { get; set; }
    public int? Score { get; set; }
    public int? Putts { get; set; }
    public bool? FairwayHit { get; set; }
    public bool? GreenInRegulation { get; set; }
    public int? ScoreToPar { get; set; }
    public int? Par { get; set; }
    public string? ClubUsed { get; set; }
}

/// <summary>
/// Hole score summary for round analysis
/// </summary>
public class HoleScoreSummaryDto
{
    public int RoundId { get; set; }
    public int TotalHolesScored { get; set; }
    public int? TotalScore { get; set; }
    public int? TotalPutts { get; set; }
    public int? FairwaysHit { get; set; }
    public int? GreensInRegulation { get; set; }
    public int? UpAndDowns { get; set; }
    public int? SandSaves { get; set; }
    public int? TotalPenaltyStrokes { get; set; }
    public double? AverageScore { get; set; }
    public double? AveragePutts { get; set; }
    public double? FairwayPercentage { get; set; }
    public double? GirPercentage { get; set; }
    public List<HoleScoreListDto> HoleScores { get; set; } = new();
}