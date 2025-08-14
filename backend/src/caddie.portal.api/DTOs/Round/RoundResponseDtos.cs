using caddie.portal.api.DTOs.Course;

namespace caddie.portal.api.DTOs.Round;

public class RoundResponseDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int CourseId { get; set; }
    public DateOnly RoundDate { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int? CurrentHole { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? TotalScore { get; set; }
    public int? TotalPutts { get; set; }
    public int? FairwaysHit { get; set; }
    public int? GreensInRegulation { get; set; }
    public decimal? TemperatureCelsius { get; set; }
    public decimal? WindSpeedKmh { get; set; }
    public string? Notes { get; set; }
    public string? RoundMetadata { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public CourseResponseDto? Course { get; set; }
    public List<HoleScoreResponseDto> HoleScores { get; set; } = new();
}

public class RoundListResponseDto
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public DateOnly RoundDate { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int? CurrentHole { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? TotalScore { get; set; }
    public string? Notes { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class RoundStatisticsResponseDto
{
    public int TotalRounds { get; set; }
    public double? AverageScore { get; set; }
    public int? BestScore { get; set; }
    public int? WorstScore { get; set; }
    public double? AveragePutts { get; set; }
    public double? AverageFairwaysHit { get; set; }
    public double? AverageGreensInRegulation { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}

public class PaginatedRoundResponseDto
{
    public List<RoundListResponseDto> Items { get; set; } = new List<RoundListResponseDto>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}

public class CompleteHoleResponseDto
{
    public int CurrentHole { get; set; }
    public int TotalScore { get; set; }
    public bool IsRoundComplete { get; set; }
    public HoleInfoDto? NextHole { get; set; }
    public HoleScoreResponseDto CompletedHole { get; set; } = null!;
}

public class RoundProgressResponseDto
{
    public int HolesCompleted { get; set; }
    public int CurrentHole { get; set; }
    public int TotalScore { get; set; }
    public List<HoleScoreListDto> CompletedHoles { get; set; } = new();
    public bool IsRoundComplete { get; set; }
    public int? TotalPar { get; set; }
    public int? ScoreToPar { get; set; }
}

public class HoleInfoDto
{
    public int HoleNumber { get; set; }
    public int? Par { get; set; }
    public string? HoleName { get; set; }
    public string? HoleDescription { get; set; }
}