namespace caddie.portal.services.Models;

/// <summary>
/// Complete dashboard overview model containing all analytics data
/// </summary>
public class DashboardOverviewModel
{
    /// <summary>
    /// User statistics and performance summary
    /// </summary>
    public UserStatsModel UserStats { get; set; } = new();

    /// <summary>
    /// Recent rounds played by the user
    /// </summary>
    public List<RecentRoundModel> RecentRounds { get; set; } = new();

    /// <summary>
    /// AI-generated performance insights and recommendations
    /// </summary>
    public PerformanceInsightsModel Insights { get; set; } = new();

    /// <summary>
    /// Shot analytics including club usage and accuracy
    /// </summary>
    public ShotAnalyticsModel ShotAnalytics { get; set; } = new();

    /// <summary>
    /// When the dashboard data was last updated
    /// </summary>
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// User statistics and golf performance summary model
/// </summary>
public class UserStatsModel
{
    /// <summary>
    /// Current handicap index
    /// </summary>
    public decimal? CurrentHandicap { get; set; }

    /// <summary>
    /// Handicap change from previous period (positive = improvement)
    /// </summary>
    public decimal HandicapChange { get; set; }

    /// <summary>
    /// Average score across recent rounds
    /// </summary>
    public decimal ScoringAverage { get; set; }

    /// <summary>
    /// Total rounds played this season/year
    /// </summary>
    public int TotalRoundsThisSeason { get; set; }

    /// <summary>
    /// Most frequently played course
    /// </summary>
    public string? FavoriteCourse { get; set; }

    /// <summary>
    /// Best score achieved
    /// </summary>
    public int? BestScore { get; set; }

    /// <summary>
    /// Number of rounds used for statistics calculation
    /// </summary>
    public int RoundsAnalyzed { get; set; }
}

/// <summary>
/// Recent round summary model for dashboard display
/// </summary>
public class RecentRoundModel
{
    /// <summary>
    /// Round identifier
    /// </summary>
    public int RoundId { get; set; }

    /// <summary>
    /// Course name where round was played
    /// </summary>
    public string CourseName { get; set; } = string.Empty;

    /// <summary>
    /// Date when round was played
    /// </summary>
    public DateTime DatePlayed { get; set; }

    /// <summary>
    /// Total score for the round
    /// </summary>
    public int TotalScore { get; set; }

    /// <summary>
    /// Course par total
    /// </summary>
    public int ParTotal { get; set; }

    /// <summary>
    /// Score relative to par (positive = over par, negative = under par)
    /// </summary>
    public int ParDifferential => TotalScore - ParTotal;

    /// <summary>
    /// Time taken to complete the round
    /// </summary>
    public TimeSpan? Duration { get; set; }

    /// <summary>
    /// Best hole performance (lowest score relative to par)
    /// </summary>
    public int? BestHole { get; set; }

    /// <summary>
    /// Worst hole performance (highest score relative to par)
    /// </summary>
    public int? WorstHole { get; set; }

    /// <summary>
    /// Round completion status
    /// </summary>
    public RoundStatus Status { get; set; }
}

/// <summary>
/// AI-generated performance insights and recommendations model
/// </summary>
public class PerformanceInsightsModel
{
    /// <summary>
    /// Overall performance trend analysis
    /// </summary>
    public string TrendAnalysis { get; set; } = string.Empty; // "improving", "stable", "declining"

    /// <summary>
    /// List of identified player strengths
    /// </summary>
    public List<string> Strengths { get; set; } = new();

    /// <summary>
    /// Areas identified for improvement
    /// </summary>
    public List<string> ImprovementAreas { get; set; } = new();

    /// <summary>
    /// Specific actionable recommendations
    /// </summary>
    public List<string> Recommendations { get; set; } = new();

    /// <summary>
    /// Motivational message based on recent performance
    /// </summary>
    public string MotivationalMessage { get; set; } = string.Empty;

    /// <summary>
    /// When these insights were generated
    /// </summary>
    public DateTime GeneratedAt { get; set; }

    /// <summary>
    /// Confidence level of insights (0.0 - 1.0)
    /// </summary>
    public decimal ConfidenceLevel { get; set; }

    /// <summary>
    /// Number of rounds analyzed for insights
    /// </summary>
    public int RoundsAnalyzed { get; set; }
}

/// <summary>
/// Shot analytics including club usage and performance metrics model
/// </summary>
public class ShotAnalyticsModel
{
    /// <summary>
    /// Club usage frequency (club type -> number of shots)
    /// </summary>
    public Dictionary<string, int> ClubUsage { get; set; } = new();

    /// <summary>
    /// Average distances by club type
    /// </summary>
    public Dictionary<string, decimal> AverageDistances { get; set; } = new();

    /// <summary>
    /// Overall shot accuracy percentage
    /// </summary>
    public decimal AccuracyPercentage { get; set; }

    /// <summary>
    /// Total number of shots analyzed
    /// </summary>
    public int TotalShotsAnalyzed { get; set; }

    /// <summary>
    /// Most frequently used club
    /// </summary>
    public string? FavoriteClub { get; set; }

    /// <summary>
    /// Best performing club (highest accuracy)
    /// </summary>
    public string? MostAccurateClub { get; set; }

    /// <summary>
    /// Percentage of greens in regulation
    /// </summary>
    public decimal? GreensInRegulation { get; set; }

    /// <summary>
    /// Average putts per round
    /// </summary>
    public decimal? AveragePutts { get; set; }
}

/// <summary>
/// Model for insights refresh operation
/// </summary>
public class RefreshInsightsModel
{
    /// <summary>
    /// Whether insights were successfully refreshed
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Updated performance insights
    /// </summary>
    public PerformanceInsightsModel? UpdatedInsights { get; set; }

    /// <summary>
    /// Message describing the refresh operation
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Time when insights were refreshed
    /// </summary>
    public DateTime RefreshedAt { get; set; } = DateTime.UtcNow;
}

