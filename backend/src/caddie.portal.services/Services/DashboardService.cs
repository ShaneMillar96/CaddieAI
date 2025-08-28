using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using caddie.portal.services.Configuration;
using caddie.portal.dal.Repositories.Interfaces;
using caddie.portal.dal.Enums;
using caddie.portal.services.Constants;
using RoundStatusEnum = caddie.portal.dal.Enums.RoundStatus;

namespace caddie.portal.services.Services;

/// <summary>
/// Service for dashboard analytics and performance insights
/// </summary>
public class DashboardService : IDashboardService
{
    private readonly IRoundRepository _roundRepository;
    private readonly ICourseRepository _courseRepository;
    private readonly IHoleRepository _holeRepository;
    private readonly IOpenAIService _openAIService;
    private readonly ICacheService _cacheService;
    private readonly ILogger<DashboardService> _logger;
    private readonly DashboardAnalyticsOptions _options;

    public DashboardService(
        IRoundRepository roundRepository,
        ICourseRepository courseRepository,
        IHoleRepository holeRepository,
        IOpenAIService openAIService,
        ICacheService cacheService,
        ILogger<DashboardService> logger,
        IOptions<DashboardAnalyticsOptions> options)
    {
        _roundRepository = roundRepository;
        _courseRepository = courseRepository;
        _holeRepository = holeRepository;
        _openAIService = openAIService;
        _cacheService = cacheService;
        _logger = logger;
        _options = options.Value;
    }

    /// <summary>
    /// Get complete dashboard overview with all analytics data
    /// </summary>
    public async Task<DashboardOverviewModel> GetDashboardOverviewAsync(int userId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"dashboard_overview_{userId}";
        
        // Check cache first
        var cachedData = await _cacheService.GetAsync<DashboardOverviewModel>(cacheKey);
        if (cachedData != null && !await ShouldRefreshDashboardAsync(userId, cancellationToken))
        {
            _logger.LogDebug("Returning cached dashboard overview for user {UserId}", userId);
            return cachedData;
        }

        _logger.LogInformation("Generating dashboard overview for user {UserId}", userId);

        try
        {
            // Fetch data sequentially to avoid DbContext concurrency issues
            // The optimized database indexes will still ensure fast query performance
            var userStats = await GetUserStatisticsAsync(userId, cancellationToken);
            var recentRounds = await GetRecentRoundsAsync(userId, _options.RecentRoundsLimit, cancellationToken);
            var insights = await GetPerformanceInsightsAsync(userId, cancellationToken);
            var shotAnalytics = await GetShotAnalyticsAsync(userId, cancellationToken);

            var overview = new DashboardOverviewModel
            {
                UserStats = userStats,
                RecentRounds = recentRounds,
                Insights = insights,
                ShotAnalytics = shotAnalytics,
                LastUpdated = DateTime.UtcNow
            };

            // Cache the result
            await _cacheService.SetAsync(cacheKey, overview, TimeSpan.FromMinutes(_options.CacheDurationMinutes));

            _logger.LogInformation("Dashboard overview generated successfully for user {UserId}", userId);
            return overview;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating dashboard overview for user {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Refresh AI-generated performance insights for a user
    /// </summary>
    public async Task<RefreshInsightsModel> RefreshInsightsAsync(int userId, bool forceRefresh = false, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Refreshing insights for user {UserId}, forceRefresh: {ForceRefresh}", userId, forceRefresh);

        try
        {
            // Check if refresh is needed
            if (!forceRefresh && !await ShouldRefreshDashboardAsync(userId, cancellationToken))
            {
                var existingInsights = await GetPerformanceInsightsAsync(userId, cancellationToken);
                return new RefreshInsightsModel
                {
                    Success = true,
                    UpdatedInsights = existingInsights,
                    Message = "Insights are up-to-date, no refresh needed",
                    RefreshedAt = DateTime.UtcNow
                };
            }

            // Clear cache to force regeneration
            var cacheKey = $"performance_insights_{userId}";
            await _cacheService.RemoveAsync(cacheKey);
            await _cacheService.RemoveAsync($"dashboard_overview_{userId}");

            // Generate new insights
            var updatedInsights = await GetPerformanceInsightsAsync(userId, cancellationToken);

            return new RefreshInsightsModel
            {
                Success = true,
                UpdatedInsights = updatedInsights,
                Message = "Insights refreshed successfully",
                RefreshedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing insights for user {UserId}", userId);
            return new RefreshInsightsModel
            {
                Success = false,
                Message = $"Failed to refresh insights: {ex.Message}",
                RefreshedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Get user statistics and performance summary
    /// </summary>
    public async Task<UserStatsModel> GetUserStatisticsAsync(int userId, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Calculating user statistics for user {UserId}", userId);

        // Get completed rounds for analysis (using new optimized index)
        var completedRounds = await _roundRepository.GetCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsDays);

        if (!completedRounds.Any())
        {
            _logger.LogDebug("No completed rounds found for user {UserId}", userId);
            return new UserStatsModel
            {
                ScoringAverage = 0,
                TotalRoundsThisSeason = 0,
                RoundsAnalyzed = 0
            };
        }

        var roundsList = completedRounds.ToList();
        var scoringAverage = await CalculateScoringAverageAsync(userId, _options.RecentRoundsLimit, cancellationToken) ?? 0;
        var favoriteCourse = await GetFavoriteCourseAsync(userId, cancellationToken);
        var bestScore = roundsList.Where(r => r.TotalScore.HasValue).Min(r => r.TotalScore);

        // Calculate this season (current year) rounds
        var currentYear = DateTime.Now.Year;
        var seasonRounds = roundsList.Count(r => r.RoundDate.Year == currentYear);

        // Calculate handicap change (simplified - would need historical data)
        var handicapChange = await CalculateHandicapChangeAsync(userId, roundsList);

        return new UserStatsModel
        {
            CurrentHandicap = null, // Would calculate from user profile if available
            HandicapChange = handicapChange,
            ScoringAverage = scoringAverage,
            TotalRoundsThisSeason = seasonRounds,
            FavoriteCourse = favoriteCourse,
            BestScore = bestScore,
            RoundsAnalyzed = Math.Min(roundsList.Count, _options.RecentRoundsLimit)
        };
    }

    /// <summary>
    /// Get recent rounds for dashboard display
    /// </summary>
    public async Task<List<RecentRoundModel>> GetRecentRoundsAsync(int userId, int limit = 10, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Getting recent rounds for user {UserId}, limit: {Limit}", userId, limit);

        var rounds = await _roundRepository.GetRecentCompletedRoundsByUserIdAsync(userId, limit);
        var recentRounds = new List<RecentRoundModel>();

        foreach (var round in rounds)
        {
            var parTotal = 72; // Default par total for 18-hole course
            if (round.CourseId.HasValue)
            {
                // Calculate par from holes table
                var holes = await _holeRepository.GetByCourseIdAsync(round.CourseId.Value);
                if (holes.Any(h => h.Par.HasValue))
                {
                    parTotal = holes.Where(h => h.Par.HasValue).Sum(h => h.Par!.Value);
                }
            }

            // Calculate duration
            TimeSpan? duration = null;
            if (round.StartTime.HasValue && round.EndTime.HasValue)
            {
                duration = round.EndTime.Value - round.StartTime.Value;
            }

            // Calculate best/worst holes (simplified - would need hole score details)
            int? bestHole = null;
            int? worstHole = null;
            if (round.HoleScores?.Any() == true)
            {
                var holeScores = round.HoleScores.Where(hs => hs.Score.HasValue).ToList();
                if (holeScores.Any())
                {
                    // Find best performing hole relative to par
                    bestHole = holeScores
                        .Select(hs => new { hs.HoleNumber, ScoreToPar = hs.Score!.Value - (hs.Hole?.Par ?? 4) })
                        .OrderBy(x => x.ScoreToPar)
                        .First().HoleNumber;

                    worstHole = holeScores
                        .Select(hs => new { hs.HoleNumber, ScoreToPar = hs.Score!.Value - (hs.Hole?.Par ?? 4) })
                        .OrderByDescending(x => x.ScoreToPar)
                        .First().HoleNumber;
                }
            }

            recentRounds.Add(new RecentRoundModel
            {
                RoundId = round.Id,
                CourseName = round.Course?.Name ?? "Unknown Course",
                DatePlayed = round.RoundDate.ToDateTime(TimeOnly.MinValue),
                TotalScore = round.TotalScore ?? 0,
                ParTotal = parTotal,
                Duration = duration,
                BestHole = bestHole,
                WorstHole = worstHole,
                Status = (Models.RoundStatus)round.StatusId
            });
        }

        return recentRounds;
    }

    /// <summary>
    /// Get performance insights for a user
    /// </summary>
    public async Task<PerformanceInsightsModel> GetPerformanceInsightsAsync(int userId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"performance_insights_{userId}";
        
        // Check cache first
        var cachedInsights = await _cacheService.GetAsync<PerformanceInsightsModel>(cacheKey);
        if (cachedInsights != null)
        {
            _logger.LogDebug("Returning cached performance insights for user {UserId}", userId);
            return cachedInsights;
        }

        _logger.LogDebug("Generating performance insights for user {UserId}", userId);

        try
        {
            var userStats = await GetUserStatisticsAsync(userId, cancellationToken);
            var recentRounds = await GetRecentRoundsAsync(userId, _options.RecentRoundsLimit, cancellationToken);

            // Check if we have enough data for meaningful insights
            if (recentRounds.Count < _options.MinRoundsForInsights)
            {
                return new PerformanceInsightsModel
                {
                    TrendAnalysis = "insufficient_data",
                    Strengths = new List<string> { "Getting started with golf tracking" },
                    ImprovementAreas = new List<string> { "Play more rounds to get detailed insights" },
                    Recommendations = new List<string> { "Complete a few more rounds to unlock personalized recommendations" },
                    MotivationalMessage = "Great start! Keep playing to unlock detailed performance insights.",
                    GeneratedAt = DateTime.UtcNow,
                    ConfidenceLevel = 0.3m,
                    RoundsAnalyzed = recentRounds.Count
                };
            }

            // Analyze performance trend
            var trendAnalysis = await AnalyzePerformanceTrendAsync(userId, cancellationToken);

            // Generate AI-powered insights if enabled
            var insights = new PerformanceInsightsModel
            {
                TrendAnalysis = trendAnalysis,
                GeneratedAt = DateTime.UtcNow,
                RoundsAnalyzed = recentRounds.Count,
                ConfidenceLevel = Math.Min(0.9m, 0.5m + (recentRounds.Count * 0.05m)) // Higher confidence with more data
            };

            if (_options.EnableAIInsights)
            {
                try
                {
                    var recommendations = await GeneratePerformanceRecommendationsAsync(userId, userStats, recentRounds, cancellationToken);
                    insights.Recommendations = recommendations;

                    // Generate AI-powered strengths and improvement areas
                    insights.Strengths = await GenerateStrengthsAsync(userStats, recentRounds);
                    insights.ImprovementAreas = await GenerateImprovementAreasAsync(userStats, recentRounds);
                    insights.MotivationalMessage = GenerateMotivationalMessage(trendAnalysis, userStats, recentRounds);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to generate AI insights for user {UserId}, using fallback", userId);
                    insights = GenerateFallbackInsights(userStats, recentRounds, trendAnalysis);
                }
            }
            else
            {
                insights = GenerateFallbackInsights(userStats, recentRounds, trendAnalysis);
            }

            // Cache the insights
            await _cacheService.SetAsync(cacheKey, insights, TimeSpan.FromMinutes(_options.CacheDurationMinutes * 2));

            return insights;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating performance insights for user {UserId}", userId);
            return GenerateEmptyInsights();
        }
    }

    /// <summary>
    /// Get shot analytics including club usage and accuracy metrics
    /// </summary>
    public Task<ShotAnalyticsModel> GetShotAnalyticsAsync(int userId, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Generating shot analytics for user {UserId}", userId);

        // For MVP, return placeholder analytics since detailed shot tracking isn't fully implemented
        // This would integrate with shot placement and club recommendation features in the future
        return Task.FromResult(new ShotAnalyticsModel
        {
            ClubUsage = new Dictionary<string, int>
            {
                { "Driver", 14 },
                { "Iron", 45 },
                { "Wedge", 28 },
                { "Putter", 32 }
            },
            AverageDistances = new Dictionary<string, decimal>
            {
                { "Driver", 240m },
                { "7-Iron", 150m },
                { "Wedge", 85m },
                { "Putter", 12m }
            },
            AccuracyPercentage = 68.5m,
            TotalShotsAnalyzed = 119,
            FavoriteClub = "7-Iron",
            MostAccurateClub = "Putter",
            GreensInRegulation = 45.2m,
            AveragePutts = 1.8m
        });
    }

    /// <summary>
    /// Calculate scoring average for a user based on recent completed rounds
    /// </summary>
    public async Task<decimal?> CalculateScoringAverageAsync(int userId, int roundsCount = 10, CancellationToken cancellationToken = default)
    {
        var rounds = await _roundRepository.GetRecentCompletedRoundsByUserIdAsync(userId, roundsCount);
        var roundsWithScores = rounds.Where(r => r.TotalScore.HasValue).ToList();

        if (!roundsWithScores.Any())
        {
            return null;
        }

        var average = (decimal)roundsWithScores.Average(r => r.TotalScore!.Value);
        return Math.Round(average, 1);
    }

    /// <summary>
    /// Determine performance trend analysis for a user
    /// </summary>
    public async Task<string> AnalyzePerformanceTrendAsync(int userId, CancellationToken cancellationToken = default)
    {
        var rounds = await _roundRepository.GetRecentCompletedRoundsByUserIdAsync(userId, 10);
        var roundsWithScores = rounds.Where(r => r.TotalScore.HasValue).OrderBy(r => r.RoundDate).ToList();

        if (roundsWithScores.Count < 3)
        {
            return "insufficient_data";
        }

        // Split into first half and second half for trend analysis
        var midpoint = roundsWithScores.Count / 2;
        var firstHalf = roundsWithScores.Take(midpoint).Average(r => r.TotalScore!.Value);
        var secondHalf = roundsWithScores.Skip(midpoint).Average(r => r.TotalScore!.Value);

        var improvement = firstHalf - secondHalf; // Positive = improving (lower scores)

        return improvement switch
        {
            > 2 => "improving",
            < -2 => "declining", 
            _ => "stable"
        };
    }

    /// <summary>
    /// Get favorite course for a user based on play frequency
    /// </summary>
    public async Task<string?> GetFavoriteCourseAsync(int userId, CancellationToken cancellationToken = default)
    {
        var rounds = await _roundRepository.GetCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsDays);
        
        var courseFrequency = rounds
            .Where(r => r.Course != null)
            .GroupBy(r => r.Course!.Name)
            .OrderByDescending(g => g.Count())
            .FirstOrDefault();

        return courseFrequency?.Key;
    }

    /// <summary>
    /// Check if dashboard data should be refreshed based on cache expiry
    /// </summary>
    public async Task<bool> ShouldRefreshDashboardAsync(int userId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"dashboard_overview_{userId}";
        var cachedData = await _cacheService.GetAsync<DashboardOverviewModel>(cacheKey);
        
        if (cachedData == null)
        {
            return true;
        }

        var cacheAge = DateTime.UtcNow - cachedData.LastUpdated;
        return cacheAge.TotalMinutes > _options.CacheDurationMinutes;
    }

    /// <summary>
    /// Generate AI-powered performance recommendations
    /// </summary>
    public Task<List<string>> GeneratePerformanceRecommendationsAsync(int userId, UserStatsModel userStats, List<RecentRoundModel> recentRounds, CancellationToken cancellationToken = default)
    {
        if (!_options.EnableAIInsights)
        {
            return Task.FromResult(GenerateFallbackRecommendations(userStats, recentRounds));
        }

        try
        {
            // For now, use fallback recommendations since OpenAI integration needs adjustment
            // In the future, this would use the correct OpenAI method for generating recommendations
            _logger.LogInformation("Generating performance recommendations for user {UserId}", userId);
            return Task.FromResult(GenerateFallbackRecommendations(userStats, recentRounds));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to generate AI recommendations for user {UserId}", userId);
            return Task.FromResult(GenerateFallbackRecommendations(userStats, recentRounds));
        }
    }

    #region Private Helper Methods

    private Task<decimal> CalculateHandicapChangeAsync(int userId, List<caddie.portal.dal.Models.Round> rounds)
    {
        // Simplified handicap change calculation
        // In a real implementation, this would compare against historical handicap data
        if (rounds.Count < 5)
        {
            return Task.FromResult(0m);
        }

        var recentAverage = rounds.Take(5).Where(r => r.TotalScore.HasValue).Average(r => r.TotalScore!.Value);
        var olderAverage = rounds.Skip(5).Take(5).Where(r => r.TotalScore.HasValue).Average(r => r.TotalScore!.Value);

        return Task.FromResult((decimal)(olderAverage - recentAverage) * 0.1m); // Rough approximation
    }

    private Task<List<string>> GenerateStrengthsAsync(UserStatsModel userStats, List<RecentRoundModel> recentRounds)
    {
        var strengths = new List<string>();

        if (userStats.ScoringAverage > 0 && userStats.ScoringAverage < 85)
        {
            strengths.Add("Consistent scoring ability");
        }

        if (recentRounds.Count >= 5)
        {
            strengths.Add("Regular play and commitment");
        }

        var consistencyScore = CalculateConsistency(recentRounds);
        if (consistencyScore > 0.7m)
        {
            strengths.Add("Consistent round-to-round performance");
        }

        return Task.FromResult(strengths.Any() ? strengths : new List<string> { "Dedication to improving your game" });
    }

    private Task<List<string>> GenerateImprovementAreasAsync(UserStatsModel userStats, List<RecentRoundModel> recentRounds)
    {
        var improvements = new List<string>();

        if (userStats.ScoringAverage > 95)
        {
            improvements.Add("Focus on consistent ball striking");
        }

        var consistencyScore = CalculateConsistency(recentRounds);
        if (consistencyScore < 0.5m)
        {
            improvements.Add("Work on consistency between rounds");
        }

        // Analyze recent performance trend
        if (recentRounds.Count >= 3)
        {
            var recentScores = recentRounds.Take(3).Select(r => r.TotalScore).ToList();
            var trend = recentScores.Last() - recentScores.First();
            if (trend > 5)
            {
                improvements.Add("Recent scores trending higher - focus on fundamentals");
            }
        }

        return Task.FromResult(improvements.Any() ? improvements : new List<string> { "Continue building experience through regular play" });
    }

    private string GenerateMotivationalMessage(string trendAnalysis, UserStatsModel userStats, List<RecentRoundModel> recentRounds)
    {
        return trendAnalysis switch
        {
            "improving" => "Excellent progress! Your scores are trending in the right direction. Keep up the great work!",
            "declining" => "Every golfer has ups and downs. Focus on the fundamentals and stay positive!",
            "stable" => "You're showing good consistency. Time to challenge yourself with new goals!",
            _ => "Welcome to your golf journey! Each round is a chance to learn and improve."
        };
    }

    private PerformanceInsightsModel GenerateFallbackInsights(UserStatsModel userStats, List<RecentRoundModel> recentRounds, string trendAnalysis)
    {
        return new PerformanceInsightsModel
        {
            TrendAnalysis = trendAnalysis,
            Strengths = new List<string> { "Commitment to tracking performance", "Regular play" },
            ImprovementAreas = new List<string> { "Focus on course management", "Practice short game" },
            Recommendations = GenerateFallbackRecommendations(userStats, recentRounds),
            MotivationalMessage = GenerateMotivationalMessage(trendAnalysis, userStats, recentRounds),
            GeneratedAt = DateTime.UtcNow,
            ConfidenceLevel = 0.6m,
            RoundsAnalyzed = recentRounds.Count
        };
    }

    private List<string> GenerateFallbackRecommendations(UserStatsModel userStats, List<RecentRoundModel> recentRounds)
    {
        var recommendations = new List<string>();

        if (userStats.ScoringAverage > 90)
        {
            recommendations.Add("Practice putting for 20 minutes before each round");
            recommendations.Add("Focus on keeping the ball in play rather than distance");
        }
        else if (userStats.ScoringAverage > 80)
        {
            recommendations.Add("Work on approach shots from 100-150 yards");
            recommendations.Add("Practice course management and club selection");
        }
        else
        {
            recommendations.Add("Fine-tune your short game around the greens");
            recommendations.Add("Work on distance control with wedges");
        }

        recommendations.Add("Track your statistics to identify specific areas for improvement");

        return recommendations;
    }

    private PerformanceInsightsModel GenerateEmptyInsights()
    {
        return new PerformanceInsightsModel
        {
            TrendAnalysis = "no_data",
            Strengths = new List<string> { "Ready to start tracking performance" },
            ImprovementAreas = new List<string> { "Play some rounds to get insights" },
            Recommendations = new List<string> { "Complete your first round to unlock personalized recommendations" },
            MotivationalMessage = "Start playing and tracking your rounds to get detailed insights!",
            GeneratedAt = DateTime.UtcNow,
            ConfidenceLevel = 0.0m,
            RoundsAnalyzed = 0
        };
    }

    private string BuildAIAnalysisContext(UserStatsModel userStats, List<RecentRoundModel> recentRounds)
    {
        return $"Scoring average: {userStats.ScoringAverage:F1}, Recent rounds: {recentRounds.Count}, " +
               $"Best score: {userStats.BestScore}, Rounds this season: {userStats.TotalRoundsThisSeason}";
    }

    private List<string> ParseAIRecommendations(string aiResponse)
    {
        if (string.IsNullOrWhiteSpace(aiResponse))
        {
            return new List<string>();
        }

        // Split by common delimiters and clean up
        var recommendations = aiResponse
            .Split(new[] { '\n', '\r', '•', '-' }, StringSplitOptions.RemoveEmptyEntries)
            .SelectMany(part => part.Split(new[] { "1.", "2.", "3.", "4." }, StringSplitOptions.RemoveEmptyEntries))
            .Select(r => r.Trim())
            .Where(r => !string.IsNullOrWhiteSpace(r) && r.Length > 10)
            .Take(4)
            .ToList();

        return recommendations;
    }

    private decimal CalculateConsistency(List<RecentRoundModel> recentRounds)
    {
        if (recentRounds.Count < 3)
        {
            return 0.5m;
        }

        var scores = recentRounds.Select(r => (decimal)r.TotalScore).ToList();
        var average = scores.Average();
        var variance = scores.Sum(s => (s - average) * (s - average)) / scores.Count;
        var standardDeviation = (decimal)Math.Sqrt((double)variance);

        // Consistency score: lower standard deviation = higher consistency
        // Normalize to 0-1 scale (lower std dev is better)
        return Math.Max(0, 1 - (standardDeviation / 10));
    }

    #endregion
}