namespace caddie.portal.services.Models;

public enum RoundStatus
{
    NotStarted,
    InProgress,
    Paused,
    Completed,
    Abandoned
}

public class RoundModel
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int CourseId { get; set; }
    public DateOnly RoundDate { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int? CurrentHole { get; set; }
    public RoundStatus Status { get; set; }
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
    public UserModel? User { get; set; }
    public CourseModel? Course { get; set; }
}

public class CreateRoundModel
{
    public int UserId { get; set; }
    public int CourseId { get; set; }
    public DateOnly RoundDate { get; set; }
    public decimal? TemperatureCelsius { get; set; }
    public decimal? WindSpeedKmh { get; set; }
    public string? Notes { get; set; }
    public string? RoundMetadata { get; set; }
}

public class UpdateRoundModel
{
    public int? CurrentHole { get; set; }
    public RoundStatus? Status { get; set; }
    public int? TotalScore { get; set; }
    public int? TotalPutts { get; set; }
    public int? FairwaysHit { get; set; }
    public int? GreensInRegulation { get; set; }
    public decimal? TemperatureCelsius { get; set; }
    public decimal? WindSpeedKmh { get; set; }
    public string? Notes { get; set; }
    public string? RoundMetadata { get; set; }
}

public class RoundStatisticsModel
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

public class StartRoundModel
{
    public int CourseId { get; set; }
    public DateOnly? RoundDate { get; set; }
    public decimal? TemperatureCelsius { get; set; }
    public decimal? WindSpeedKmh { get; set; }
    public string? Notes { get; set; }
    public string? RoundMetadata { get; set; }
}

public class CompleteRoundModel
{
    public int TotalScore { get; set; }
    public int? TotalPutts { get; set; }
    public int? FairwaysHit { get; set; }
    public int? GreensInRegulation { get; set; }
    public string? Notes { get; set; }
}