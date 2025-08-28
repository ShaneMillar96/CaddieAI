using caddie.portal.services.Models;

namespace caddie.portal.services.Interfaces;

/// <summary>
/// Service interface for dashboard analytics and performance insights
/// </summary>
public interface IDashboardService
{
    /// <summary>
    /// Get complete dashboard overview with all analytics data
    /// </summary>
    /// <param name="userId">User ID to get dashboard for</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Complete dashboard overview model</returns>
    Task<DashboardOverviewModel> GetDashboardOverviewAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Refresh AI-generated performance insights for a user
    /// </summary>
    /// <param name="userId">User ID to refresh insights for</param>
    /// <param name="forceRefresh">Whether to force refresh even if recently updated</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Refresh operation result with updated insights</returns>
    Task<RefreshInsightsModel> RefreshInsightsAsync(int userId, bool forceRefresh = false, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get user statistics and performance summary
    /// </summary>
    /// <param name="userId">User ID to get statistics for</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>User statistics model</returns>
    Task<UserStatsModel> GetUserStatisticsAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get recent rounds for dashboard display
    /// </summary>
    /// <param name="userId">User ID to get rounds for</param>
    /// <param name="limit">Maximum number of rounds to return</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of recent round models</returns>
    Task<List<RecentRoundModel>> GetRecentRoundsAsync(int userId, int limit = 10, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get performance insights for a user
    /// </summary>
    /// <param name="userId">User ID to get insights for</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Performance insights model</returns>
    Task<PerformanceInsightsModel> GetPerformanceInsightsAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get shot analytics including club usage and accuracy metrics
    /// </summary>
    /// <param name="userId">User ID to get analytics for</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Shot analytics model</returns>
    Task<ShotAnalyticsModel> GetShotAnalyticsAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculate scoring average for a user based on recent completed rounds
    /// </summary>
    /// <param name="userId">User ID to calculate average for</param>
    /// <param name="roundsCount">Number of recent rounds to include in calculation</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Scoring average or null if insufficient data</returns>
    Task<decimal?> CalculateScoringAverageAsync(int userId, int roundsCount = 10, CancellationToken cancellationToken = default);

    /// <summary>
    /// Determine performance trend analysis for a user
    /// </summary>
    /// <param name="userId">User ID to analyze trends for</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Trend analysis string (improving, stable, declining)</returns>
    Task<string> AnalyzePerformanceTrendAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get favorite course for a user based on play frequency
    /// </summary>
    /// <param name="userId">User ID to find favorite course for</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Favorite course name or null if no rounds played</returns>
    Task<string?> GetFavoriteCourseAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if dashboard data should be refreshed based on cache expiry
    /// </summary>
    /// <param name="userId">User ID to check cache for</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if data should be refreshed</returns>
    Task<bool> ShouldRefreshDashboardAsync(int userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generate AI-powered performance recommendations
    /// </summary>
    /// <param name="userId">User ID to generate recommendations for</param>
    /// <param name="userStats">User statistics for context</param>
    /// <param name="recentRounds">Recent rounds for analysis</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of recommendation strings</returns>
    Task<List<string>> GeneratePerformanceRecommendationsAsync(int userId, UserStatsModel userStats, List<RecentRoundModel> recentRounds, CancellationToken cancellationToken = default);
}