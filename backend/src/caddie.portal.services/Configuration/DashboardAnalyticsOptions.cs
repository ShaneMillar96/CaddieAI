namespace caddie.portal.services.Configuration;

/// <summary>
/// Configuration options for dashboard analytics functionality
/// </summary>
public class DashboardAnalyticsOptions
{
    /// <summary>
    /// Configuration section name in appsettings.json
    /// </summary>
    public const string SectionName = "DashboardAnalytics";

    /// <summary>
    /// Number of recent rounds to analyze for dashboard
    /// </summary>
    public int RecentRoundsLimit { get; set; } = 10;

    /// <summary>
    /// Minimum number of rounds required for meaningful insights
    /// </summary>
    public int MinRoundsForInsights { get; set; } = 3;

    /// <summary>
    /// Number of days for "recent" rounds analysis
    /// </summary>
    public int RecentRoundsDays { get; set; } = 90;

    /// <summary>
    /// Cache duration for dashboard data in minutes
    /// </summary>
    public int CacheDurationMinutes { get; set; } = 15;

    /// <summary>
    /// Whether to include AI-generated insights
    /// </summary>
    public bool EnableAIInsights { get; set; } = true;

    /// <summary>
    /// Minimum confidence threshold for AI insights
    /// </summary>
    public decimal MinInsightConfidence { get; set; } = 0.7m;

    /// <summary>
    /// Maximum time in seconds for AI insight generation
    /// </summary>
    public int AIInsightTimeoutSeconds { get; set; } = 30;

    /// <summary>
    /// Number of rounds to analyze for performance trends
    /// </summary>
    public int TrendAnalysisRounds { get; set; } = 10;

    /// <summary>
    /// Whether to enable detailed shot analytics
    /// </summary>
    public bool EnableShotAnalytics { get; set; } = true;
}