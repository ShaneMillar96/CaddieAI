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
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public UserModel? User { get; set; }
    public CourseModel? Course { get; set; }
    public List<HoleScoreModel> HoleScores { get; set; } = new();
}

public class CreateRoundModel
{
    public int UserId { get; set; }
    public int CourseId { get; set; }
    public DateOnly RoundDate { get; set; }
}

public class UpdateRoundModel
{
    public int? CurrentHole { get; set; }
    public RoundStatus? Status { get; set; }
    public int? TotalScore { get; set; }
}

public class RoundStatisticsModel
{
    public int TotalRounds { get; set; }
    public double? AverageScore { get; set; }
    public int? BestScore { get; set; }
    public int? WorstScore { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}

public class StartRoundModel
{
    public int CourseId { get; set; }
    public DateOnly? RoundDate { get; set; }
}

public class CompleteRoundModel
{
    public int TotalScore { get; set; }
}

public class CompleteHoleResult
{
    public HoleScoreModel CompletedHole { get; set; } = null!;
    public int CurrentHole { get; set; }
    public int TotalScore { get; set; }
    public bool IsRoundComplete { get; set; }
    public HoleInfo? NextHole { get; set; }
}

public class RoundProgress
{
    public int HolesCompleted { get; set; }
    public int CurrentHole { get; set; }
    public int TotalScore { get; set; }
    public List<HoleScoreModel> CompletedHoles { get; set; } = new();
    public bool IsRoundComplete { get; set; }
    public int? TotalPar { get; set; }
    public int? ScoreToPar { get; set; }
}

public class HoleInfo
{
    public int HoleNumber { get; set; }
    public int? Par { get; set; }
}