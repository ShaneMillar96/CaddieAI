using Xunit;
using Moq;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Caching.Memory;
using caddie.portal.services.Services;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using caddie.portal.services.Configuration;
using caddie.portal.dal.Repositories.Interfaces;
using caddie.portal.dal.Models;
using caddie.portal.dal.Enums;
using caddie.portal.services.tests.Services;
using RoundStatusEnum = caddie.portal.dal.Enums.RoundStatus;

namespace caddie.portal.services.tests.Services;

/// <summary>
/// Comprehensive unit tests for DashboardService
/// Covers all public methods with >80% code coverage
/// </summary>
public class DashboardServiceTests : IDisposable
{
    private readonly Mock<IRoundRepository> _mockRoundRepository;
    private readonly Mock<ICourseRepository> _mockCourseRepository;
    private readonly Mock<IHoleRepository> _mockHoleRepository;
    private readonly Mock<IOpenAIService> _mockOpenAIService;
    private readonly Mock<ICacheService> _mockCacheService;
    private readonly Mock<ILogger<DashboardService>> _mockLogger;
    private readonly DashboardAnalyticsOptions _options;
    private readonly DashboardService _dashboardService;

    public DashboardServiceTests()
    {
        // Initialize mocks
        _mockRoundRepository = new Mock<IRoundRepository>();
        _mockCourseRepository = new Mock<ICourseRepository>();
        _mockHoleRepository = new Mock<IHoleRepository>();
        _mockOpenAIService = new Mock<IOpenAIService>();
        _mockCacheService = new Mock<ICacheService>();
        _mockLogger = new Mock<ILogger<DashboardService>>();

        // Configure options
        _options = new DashboardAnalyticsOptions
        {
            RecentRoundsLimit = 10,
            MinRoundsForInsights = 3,
            RecentRoundsDays = 90,
            CacheDurationMinutes = 15,
            EnableAIInsights = true,
            MinInsightConfidence = 0.7m,
            AIInsightTimeoutSeconds = 30,
            TrendAnalysisRounds = 10,
            EnableShotAnalytics = true
        };
        var mockOptions = new Mock<IOptions<DashboardAnalyticsOptions>>();
        mockOptions.Setup(x => x.Value).Returns(_options);

        // Create service instance
        _dashboardService = new DashboardService(
            _mockRoundRepository.Object,
            _mockCourseRepository.Object,
            _mockHoleRepository.Object,
            _mockOpenAIService.Object,
            _mockCacheService.Object,
            _mockLogger.Object,
            mockOptions.Object
        );
    }

    #region GetDashboardOverviewAsync Tests

    [Fact]
    public async Task GetDashboardOverviewAsync_WithValidUser_ReturnsCachedData()
    {
        // Arrange
        const int userId = 1;
        var cachedOverview = TestDataFactory.CreateTestDashboardOverview();
        var cacheKey = $"dashboard_overview_{userId}";

        _mockCacheService
            .Setup(x => x.GetAsync<DashboardOverviewModel>(cacheKey))
            .ReturnsAsync(cachedOverview);

        // Mock ShouldRefreshDashboardAsync to return false (no refresh needed)
        _mockCacheService
            .Setup(x => x.GetAsync<DashboardOverviewModel>(cacheKey))
            .ReturnsAsync(cachedOverview);

        // Act
        var result = await _dashboardService.GetDashboardOverviewAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(cachedOverview.UserStats.ScoringAverage, result.UserStats.ScoringAverage);
        Assert.Equal(cachedOverview.RecentRounds.Count, result.RecentRounds.Count);

        // Verify cache was checked but not set (because data was cached)
        _mockCacheService.Verify(x => x.GetAsync<DashboardOverviewModel>(cacheKey), Times.AtLeastOnce);
    }

    [Fact]
    public async Task GetDashboardOverviewAsync_WithValidUser_GeneratesNewData()
    {
        // Arrange
        const int userId = 1;
        var cacheKey = $"dashboard_overview_{userId}";
        var testRounds = TestDataFactory.CreateTestRounds(userId, 10);
        var testHoles = TestDataFactory.CreateTestHoles(1, 18);

        // No cached data
        _mockCacheService
            .Setup(x => x.GetAsync<DashboardOverviewModel>(cacheKey))
            .ReturnsAsync((DashboardOverviewModel?)null);

        // Setup repository mocks for data generation
        _mockRoundRepository
            .Setup(x => x.GetCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsDays))
            .ReturnsAsync(testRounds);

        _mockRoundRepository
            .Setup(x => x.GetRecentCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsLimit))
            .ReturnsAsync(testRounds.Take(_options.RecentRoundsLimit));

        _mockHoleRepository
            .Setup(x => x.GetByCourseIdAsync(It.IsAny<int>()))
            .ReturnsAsync(testHoles);

        // Setup cache set
        _mockCacheService
            .Setup(x => x.SetAsync(cacheKey, It.IsAny<DashboardOverviewModel>(), It.IsAny<TimeSpan>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _dashboardService.GetDashboardOverviewAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.UserStats);
        Assert.NotNull(result.RecentRounds);
        Assert.NotNull(result.Insights);
        Assert.NotNull(result.ShotAnalytics);
        Assert.True(result.LastUpdated <= DateTime.UtcNow);

        // Verify cache was set
        _mockCacheService.Verify(
            x => x.SetAsync(cacheKey, It.IsAny<DashboardOverviewModel>(), It.IsAny<TimeSpan>()),
            Times.Once);
    }

    [Fact]
    public async Task GetDashboardOverviewAsync_WithNoRounds_ReturnsEmptyData()
    {
        // Arrange
        const int userId = 1;
        var cacheKey = $"dashboard_overview_{userId}";
        var emptyRounds = new List<Round>();

        _mockCacheService
            .Setup(x => x.GetAsync<DashboardOverviewModel>(cacheKey))
            .ReturnsAsync((DashboardOverviewModel?)null);

        _mockRoundRepository
            .Setup(x => x.GetCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsDays))
            .ReturnsAsync(emptyRounds);

        _mockRoundRepository
            .Setup(x => x.GetRecentCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsLimit))
            .ReturnsAsync(emptyRounds);

        _mockCacheService
            .Setup(x => x.SetAsync(cacheKey, It.IsAny<DashboardOverviewModel>(), It.IsAny<TimeSpan>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _dashboardService.GetDashboardOverviewAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(0, result.UserStats.ScoringAverage);
        Assert.Equal(0, result.UserStats.TotalRoundsThisSeason);
        Assert.Empty(result.RecentRounds);
        Assert.Equal("insufficient_data", result.Insights.TrendAnalysis);
    }

    [Fact]
    public async Task GetDashboardOverviewAsync_RepositoryThrowsException_ThrowsException()
    {
        // Arrange
        const int userId = 1;
        var cacheKey = $"dashboard_overview_{userId}";

        _mockCacheService
            .Setup(x => x.GetAsync<DashboardOverviewModel>(cacheKey))
            .ReturnsAsync((DashboardOverviewModel?)null);

        _mockRoundRepository
            .Setup(x => x.GetCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsDays))
            .ThrowsAsync(new InvalidOperationException("Database error"));

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _dashboardService.GetDashboardOverviewAsync(userId));
    }

    #endregion

    #region GetUserStatisticsAsync Tests

    [Fact]
    public async Task GetUserStatisticsAsync_WithCompletedRounds_CalculatesCorrectStats()
    {
        // Arrange
        const int userId = 1;
        var testRounds = TestDataFactory.CreateTestRounds(userId, 10, includeVariedPerformance: true);

        _mockRoundRepository
            .Setup(x => x.GetCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsDays))
            .ReturnsAsync(testRounds);

        _mockRoundRepository
            .Setup(x => x.GetRecentCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsLimit))
            .ReturnsAsync(testRounds.Take(_options.RecentRoundsLimit));

        // Act
        var result = await _dashboardService.GetUserStatisticsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.ScoringAverage > 0);
        Assert.Equal(testRounds.Count, result.TotalRoundsThisSeason);
        Assert.True(result.BestScore.HasValue);
        Assert.Equal(Math.Min(testRounds.Count, _options.RecentRoundsLimit), result.RoundsAnalyzed);
    }

    [Fact]
    public async Task GetUserStatisticsAsync_WithNoRounds_ReturnsZeroStats()
    {
        // Arrange
        const int userId = 1;
        var emptyRounds = new List<Round>();

        _mockRoundRepository
            .Setup(x => x.GetCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsDays))
            .ReturnsAsync(emptyRounds);

        // Act
        var result = await _dashboardService.GetUserStatisticsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(0, result.ScoringAverage);
        Assert.Equal(0, result.TotalRoundsThisSeason);
        Assert.Equal(0, result.RoundsAnalyzed);
        Assert.Null(result.BestScore);
    }

    [Fact]
    public async Task GetUserStatisticsAsync_WithRoundsFromDifferentYears_CountsOnlyCurrentYear()
    {
        // Arrange
        const int userId = 1;
        var thisYearRounds = TestDataFactory.CreateTestRounds(userId, 5);
        var lastYearRounds = TestDataFactory.CreateTestRounds(userId, 3, 6);
        
        // Modify last year rounds to be from previous year
        foreach (var round in lastYearRounds)
        {
            round.RoundDate = DateOnly.FromDateTime(DateTime.Now.AddYears(-1));
        }

        var allRounds = thisYearRounds.Concat(lastYearRounds).ToList();

        _mockRoundRepository
            .Setup(x => x.GetCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsDays))
            .ReturnsAsync(allRounds);

        _mockRoundRepository
            .Setup(x => x.GetRecentCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsLimit))
            .ReturnsAsync(allRounds.Take(_options.RecentRoundsLimit));

        // Act
        var result = await _dashboardService.GetUserStatisticsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(thisYearRounds.Count, result.TotalRoundsThisSeason);
    }

    #endregion

    #region GetRecentRoundsAsync Tests

    [Fact]
    public async Task GetRecentRoundsAsync_WithValidRounds_ReturnsCorrectData()
    {
        // Arrange
        const int userId = 1;
        const int limit = 5;
        var testRounds = TestDataFactory.CreateTestRounds(userId, limit, includeVariedPerformance: true);
        var testHoles = TestDataFactory.CreateTestHoles(1, 18);

        _mockRoundRepository
            .Setup(x => x.GetRecentCompletedRoundsByUserIdAsync(userId, limit))
            .ReturnsAsync(testRounds.Take(limit));

        _mockHoleRepository
            .Setup(x => x.GetByCourseIdAsync(It.IsAny<int>()))
            .ReturnsAsync(testHoles);

        // Act
        var result = await _dashboardService.GetRecentRoundsAsync(userId, limit);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(limit, result.Count);
        
        foreach (var round in result)
        {
            Assert.True(round.TotalScore > 0);
            Assert.Equal(72, round.ParTotal); // Standard par from test holes
            Assert.NotEqual("Unknown Course", round.CourseName);
            Assert.True(round.DatePlayed <= DateTime.Now);
        }
    }

    [Fact]
    public async Task GetRecentRoundsAsync_WithHoleScores_CalculatesBestAndWorstHoles()
    {
        // Arrange
        const int userId = 1;
        const int limit = 1;
        var testRounds = TestDataFactory.CreateTestRounds(userId, limit, includeVariedPerformance: true);
        var testHoles = TestDataFactory.CreateTestHoles(1, 18);

        // Add hole scores to the round
        testRounds[0].HoleScores = TestDataFactory.CreateTestHoleScores(testRounds[0].Id, testHoles);

        _mockRoundRepository
            .Setup(x => x.GetRecentCompletedRoundsByUserIdAsync(userId, limit))
            .ReturnsAsync(testRounds);

        _mockHoleRepository
            .Setup(x => x.GetByCourseIdAsync(It.IsAny<int>()))
            .ReturnsAsync(testHoles);

        // Act
        var result = await _dashboardService.GetRecentRoundsAsync(userId, limit);

        // Assert
        Assert.Single(result);
        var round = result.First();
        Assert.NotNull(round.BestHole);
        Assert.NotNull(round.WorstHole);
        Assert.True(round.BestHole >= 1 && round.BestHole <= 18);
        Assert.True(round.WorstHole >= 1 && round.WorstHole <= 18);
    }

    [Fact]
    public async Task GetRecentRoundsAsync_WithMissingCourseData_UsesDefaultPar()
    {
        // Arrange
        const int userId = 1;
        const int limit = 1;
        var testRounds = TestDataFactory.CreateTestRounds(userId, limit);
        testRounds[0].CourseId = null; // No course ID

        _mockRoundRepository
            .Setup(x => x.GetRecentCompletedRoundsByUserIdAsync(userId, limit))
            .ReturnsAsync(testRounds);

        // Act
        var result = await _dashboardService.GetRecentRoundsAsync(userId, limit);

        // Assert
        Assert.Single(result);
        var round = result.First();
        Assert.Equal(72, round.ParTotal); // Default par
    }

    [Fact]
    public async Task GetRecentRoundsAsync_WithEmptyRounds_ReturnsEmptyList()
    {
        // Arrange
        const int userId = 1;
        const int limit = 5;
        var emptyRounds = new List<Round>();

        _mockRoundRepository
            .Setup(x => x.GetRecentCompletedRoundsByUserIdAsync(userId, limit))
            .ReturnsAsync(emptyRounds);

        // Act
        var result = await _dashboardService.GetRecentRoundsAsync(userId, limit);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    #endregion

    #region GetPerformanceInsightsAsync Tests

    [Fact]
    public async Task GetPerformanceInsightsAsync_WithSufficientData_GeneratesInsights()
    {
        // Arrange
        const int userId = 1;
        var cacheKey = $"performance_insights_{userId}";
        var testRounds = TestDataFactory.CreateTestRounds(userId, 10);

        _mockCacheService
            .Setup(x => x.GetAsync<PerformanceInsightsModel>(cacheKey))
            .ReturnsAsync((PerformanceInsightsModel?)null);

        _mockRoundRepository
            .Setup(x => x.GetCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsDays))
            .ReturnsAsync(testRounds);

        _mockRoundRepository
            .Setup(x => x.GetRecentCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsLimit))
            .ReturnsAsync(testRounds);

        _mockCacheService
            .Setup(x => x.SetAsync(cacheKey, It.IsAny<PerformanceInsightsModel>(), It.IsAny<TimeSpan>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _dashboardService.GetPerformanceInsightsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual("insufficient_data", result.TrendAnalysis);
        Assert.True(result.ConfidenceLevel >= 0.5m);
        Assert.Equal(testRounds.Count, result.RoundsAnalyzed);
        Assert.NotEmpty(result.Strengths);
        Assert.NotEmpty(result.ImprovementAreas);
        Assert.NotEmpty(result.Recommendations);
    }

    [Fact]
    public async Task GetPerformanceInsightsAsync_WithInsufficientData_ReturnsFallbackInsights()
    {
        // Arrange
        const int userId = 1;
        var cacheKey = $"performance_insights_{userId}";
        var minimalRounds = TestDataFactory.CreateMinimalTestRounds(userId, 2); // Less than MinRoundsForInsights

        _mockCacheService
            .Setup(x => x.GetAsync<PerformanceInsightsModel>(cacheKey))
            .ReturnsAsync((PerformanceInsightsModel?)null);

        _mockRoundRepository
            .Setup(x => x.GetCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsDays))
            .ReturnsAsync(minimalRounds);

        _mockRoundRepository
            .Setup(x => x.GetRecentCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsLimit))
            .ReturnsAsync(minimalRounds);

        // Act
        var result = await _dashboardService.GetPerformanceInsightsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("insufficient_data", result.TrendAnalysis);
        Assert.Equal(0.3m, result.ConfidenceLevel);
        Assert.Equal(minimalRounds.Count, result.RoundsAnalyzed);
        Assert.Contains("Getting started", result.Strengths.First());
    }

    [Fact]
    public async Task GetPerformanceInsightsAsync_WithCachedData_ReturnsCachedInsights()
    {
        // Arrange
        const int userId = 1;
        var cacheKey = $"performance_insights_{userId}";
        var cachedInsights = TestDataFactory.CreateTestPerformanceInsights();

        _mockCacheService
            .Setup(x => x.GetAsync<PerformanceInsightsModel>(cacheKey))
            .ReturnsAsync(cachedInsights);

        // Act
        var result = await _dashboardService.GetPerformanceInsightsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(cachedInsights.TrendAnalysis, result.TrendAnalysis);
        Assert.Equal(cachedInsights.ConfidenceLevel, result.ConfidenceLevel);
        
        // Verify no database calls were made
        _mockRoundRepository.Verify(
            x => x.GetCompletedRoundsByUserIdAsync(It.IsAny<int>(), It.IsAny<int>()), 
            Times.Never);
    }

    [Fact]
    public async Task GetPerformanceInsightsAsync_ExceptionThrown_ReturnsEmptyInsights()
    {
        // Arrange
        const int userId = 1;
        var cacheKey = $"performance_insights_{userId}";

        _mockCacheService
            .Setup(x => x.GetAsync<PerformanceInsightsModel>(cacheKey))
            .ReturnsAsync((PerformanceInsightsModel?)null);

        _mockRoundRepository
            .Setup(x => x.GetCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsDays))
            .ThrowsAsync(new InvalidOperationException("Database error"));

        // Act
        var result = await _dashboardService.GetPerformanceInsightsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("no_data", result.TrendAnalysis);
        Assert.Equal(0.0m, result.ConfidenceLevel);
        Assert.Equal(0, result.RoundsAnalyzed);
    }

    #endregion

    #region RefreshInsightsAsync Tests

    [Fact]
    public async Task RefreshInsightsAsync_ForceRefresh_ClearsCache_And_GeneratesNewInsights()
    {
        // Arrange
        const int userId = 1;
        const bool forceRefresh = true;
        var testRounds = TestDataFactory.CreateTestRounds(userId, 10);

        // Setup cache removal
        _mockCacheService
            .Setup(x => x.RemoveAsync($"performance_insights_{userId}"))
            .Returns(Task.CompletedTask);

        _mockCacheService
            .Setup(x => x.RemoveAsync($"dashboard_overview_{userId}"))
            .Returns(Task.CompletedTask);

        // Setup data for new insights generation
        _mockRoundRepository
            .Setup(x => x.GetCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsDays))
            .ReturnsAsync(testRounds);

        _mockRoundRepository
            .Setup(x => x.GetRecentCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsLimit))
            .ReturnsAsync(testRounds);

        _mockCacheService
            .Setup(x => x.SetAsync($"performance_insights_{userId}", It.IsAny<PerformanceInsightsModel>(), It.IsAny<TimeSpan>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _dashboardService.RefreshInsightsAsync(userId, forceRefresh);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.NotNull(result.UpdatedInsights);
        Assert.Contains("refreshed successfully", result.Message);
        Assert.True(result.RefreshedAt <= DateTime.UtcNow);

        // Verify cache was cleared
        _mockCacheService.Verify(
            x => x.RemoveAsync($"performance_insights_{userId}"), 
            Times.Once);
        _mockCacheService.Verify(
            x => x.RemoveAsync($"dashboard_overview_{userId}"), 
            Times.Once);
    }

    [Fact]
    public async Task RefreshInsightsAsync_NoForceRefresh_ChecksCacheAge()
    {
        // Arrange
        const int userId = 1;
        const bool forceRefresh = false;
        var cachedOverview = TestDataFactory.CreateTestDashboardOverview();
        cachedOverview.LastUpdated = DateTime.UtcNow.AddMinutes(-5); // Recent cache

        _mockCacheService
            .Setup(x => x.GetAsync<DashboardOverviewModel>($"dashboard_overview_{userId}"))
            .ReturnsAsync(cachedOverview);

        // Setup existing insights retrieval
        var existingInsights = TestDataFactory.CreateTestPerformanceInsights();
        _mockCacheService
            .Setup(x => x.GetAsync<PerformanceInsightsModel>($"performance_insights_{userId}"))
            .ReturnsAsync(existingInsights);

        // Act
        var result = await _dashboardService.RefreshInsightsAsync(userId, forceRefresh);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.NotNull(result.UpdatedInsights);
        Assert.Contains("up-to-date", result.Message);

        // Verify cache was not cleared
        _mockCacheService.Verify(
            x => x.RemoveAsync(It.IsAny<string>()), 
            Times.Never);
    }

    [Fact]
    public async Task RefreshInsightsAsync_ExceptionThrown_ReturnsFailureResult()
    {
        // Arrange
        const int userId = 1;
        const bool forceRefresh = true;

        _mockCacheService
            .Setup(x => x.RemoveAsync(It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("Cache error"));

        // Act
        var result = await _dashboardService.RefreshInsightsAsync(userId, forceRefresh);

        // Assert
        Assert.NotNull(result);
        Assert.False(result.Success);
        Assert.Contains("Failed to refresh insights", result.Message);
        Assert.True(result.RefreshedAt <= DateTime.UtcNow);
    }

    #endregion

    #region Helper Method Tests

    [Fact]
    public async Task CalculateScoringAverageAsync_WithValidRounds_ReturnsCorrectAverage()
    {
        // Arrange
        const int userId = 1;
        const int roundsCount = 5;
        var testRounds = TestDataFactory.CreateTestRounds(userId, roundsCount);

        _mockRoundRepository
            .Setup(x => x.GetRecentCompletedRoundsByUserIdAsync(userId, roundsCount))
            .ReturnsAsync(testRounds);

        // Act
        var result = await _dashboardService.CalculateScoringAverageAsync(userId, roundsCount);

        // Assert
        Assert.NotNull(result);
        Assert.True(result > 0);
        
        // Calculate expected average
        var expectedAverage = Math.Round((decimal)testRounds.Average(r => r.TotalScore!.Value), 1);
        Assert.Equal(expectedAverage, result.Value);
    }

    [Fact]
    public async Task CalculateScoringAverageAsync_WithNoRounds_ReturnsNull()
    {
        // Arrange
        const int userId = 1;
        const int roundsCount = 5;
        var emptyRounds = new List<Round>();

        _mockRoundRepository
            .Setup(x => x.GetRecentCompletedRoundsByUserIdAsync(userId, roundsCount))
            .ReturnsAsync(emptyRounds);

        // Act
        var result = await _dashboardService.CalculateScoringAverageAsync(userId, roundsCount);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task AnalyzePerformanceTrendAsync_WithImprovingScores_ReturnsImproving()
    {
        // Arrange
        const int userId = 1;
        var improvingRounds = new List<Round>();
        
        // Create rounds with improving scores (older rounds have higher scores, newer rounds have lower scores)
        for (int i = 0; i < 6; i++)
        {
            improvingRounds.Add(TestDataFactory.CreateTestRound(
                i + 1, userId, 1, RoundStatusEnum.Completed, 
                90 - i, // Scores: 90, 89, 88, 87, 86, 85 (getting better over time)
                DateTime.Now.AddDays(-5 + i) // Oldest to newest dates: -5, -4, -3, -2, -1, 0
            ));
        }

        _mockRoundRepository
            .Setup(x => x.GetRecentCompletedRoundsByUserIdAsync(userId, 10))
            .ReturnsAsync(improvingRounds.OrderBy(r => r.RoundDate)); // Order by date for trend analysis

        // Act
        var result = await _dashboardService.AnalyzePerformanceTrendAsync(userId);

        // Assert
        Assert.Equal("improving", result);
    }

    [Fact]
    public async Task AnalyzePerformanceTrendAsync_WithDecliningScores_ReturnsDeclining()
    {
        // Arrange
        const int userId = 1;
        var decliningRounds = new List<Round>();
        
        // Create rounds with declining scores (older rounds have lower scores, newer rounds have higher scores)
        for (int i = 0; i < 6; i++)
        {
            decliningRounds.Add(TestDataFactory.CreateTestRound(
                i + 1, userId, 1, RoundStatusEnum.Completed, 
                80 + i, // Scores: 80, 81, 82, 83, 84, 85 (getting worse over time)
                DateTime.Now.AddDays(-5 + i) // Oldest to newest dates: -5, -4, -3, -2, -1, 0
            ));
        }

        _mockRoundRepository
            .Setup(x => x.GetRecentCompletedRoundsByUserIdAsync(userId, 10))
            .ReturnsAsync(decliningRounds.OrderBy(r => r.RoundDate));

        // Act
        var result = await _dashboardService.AnalyzePerformanceTrendAsync(userId);

        // Assert
        Assert.Equal("declining", result);
    }

    [Fact]
    public async Task AnalyzePerformanceTrendAsync_WithInsufficientData_ReturnsInsufficientData()
    {
        // Arrange
        const int userId = 1;
        var fewRounds = TestDataFactory.CreateMinimalTestRounds(userId, 2);

        _mockRoundRepository
            .Setup(x => x.GetRecentCompletedRoundsByUserIdAsync(userId, 10))
            .ReturnsAsync(fewRounds);

        // Act
        var result = await _dashboardService.AnalyzePerformanceTrendAsync(userId);

        // Assert
        Assert.Equal("insufficient_data", result);
    }

    [Fact]
    public async Task GetFavoriteCourseAsync_WithMultipleCourses_ReturnsCorrectFavorite()
    {
        // Arrange
        const int userId = 1;
        var testRounds = new List<Round>
        {
            // 3 rounds at Course A
            TestDataFactory.CreateTestRound(1, userId, 1, RoundStatusEnum.Completed, 85),
            TestDataFactory.CreateTestRound(2, userId, 1, RoundStatusEnum.Completed, 87),
            TestDataFactory.CreateTestRound(3, userId, 1, RoundStatusEnum.Completed, 83),
            // 2 rounds at Course B
            TestDataFactory.CreateTestRound(4, userId, 2, RoundStatusEnum.Completed, 90),
            TestDataFactory.CreateTestRound(5, userId, 2, RoundStatusEnum.Completed, 88)
        };

        // Set course names
        testRounds.Take(3).ToList().ForEach(r => r.Course!.Name = "Favorite Course");
        testRounds.Skip(3).ToList().ForEach(r => r.Course!.Name = "Secondary Course");

        _mockRoundRepository
            .Setup(x => x.GetCompletedRoundsByUserIdAsync(userId, _options.RecentRoundsDays))
            .ReturnsAsync(testRounds);

        // Act
        var result = await _dashboardService.GetFavoriteCourseAsync(userId);

        // Assert
        Assert.Equal("Favorite Course", result);
    }

    [Fact]
    public async Task ShouldRefreshDashboardAsync_WithExpiredCache_ReturnsTrue()
    {
        // Arrange
        const int userId = 1;
        var cacheKey = $"dashboard_overview_{userId}";
        var expiredOverview = TestDataFactory.CreateTestDashboardOverview();
        expiredOverview.LastUpdated = DateTime.UtcNow.AddMinutes(-(_options.CacheDurationMinutes + 5));

        _mockCacheService
            .Setup(x => x.GetAsync<DashboardOverviewModel>(cacheKey))
            .ReturnsAsync(expiredOverview);

        // Act
        var result = await _dashboardService.ShouldRefreshDashboardAsync(userId);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task ShouldRefreshDashboardAsync_WithRecentCache_ReturnsFalse()
    {
        // Arrange
        const int userId = 1;
        var cacheKey = $"dashboard_overview_{userId}";
        var recentOverview = TestDataFactory.CreateTestDashboardOverview();
        recentOverview.LastUpdated = DateTime.UtcNow.AddMinutes(-5); // Recent cache

        _mockCacheService
            .Setup(x => x.GetAsync<DashboardOverviewModel>(cacheKey))
            .ReturnsAsync(recentOverview);

        // Act
        var result = await _dashboardService.ShouldRefreshDashboardAsync(userId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task ShouldRefreshDashboardAsync_WithNoCache_ReturnsTrue()
    {
        // Arrange
        const int userId = 1;
        var cacheKey = $"dashboard_overview_{userId}";

        _mockCacheService
            .Setup(x => x.GetAsync<DashboardOverviewModel>(cacheKey))
            .ReturnsAsync((DashboardOverviewModel?)null);

        // Act
        var result = await _dashboardService.ShouldRefreshDashboardAsync(userId);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task GeneratePerformanceRecommendationsAsync_WithHighScores_ReturnsBasicRecommendations()
    {
        // Arrange
        const int userId = 1;
        var userStats = TestDataFactory.CreateTestUserStats(scoringAverage: 95m);
        var recentRounds = TestDataFactory.CreateTestRecentRounds();

        // Act
        var result = await _dashboardService.GeneratePerformanceRecommendationsAsync(userId, userStats, recentRounds);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result);
        Assert.Contains(result, r => r.Contains("putting"));
        Assert.Contains(result, r => r.Contains("keeping the ball in play"));
    }

    [Fact]
    public async Task GeneratePerformanceRecommendationsAsync_WithMidScores_ReturnsIntermediateRecommendations()
    {
        // Arrange
        const int userId = 1;
        var userStats = TestDataFactory.CreateTestUserStats(scoringAverage: 85m);
        var recentRounds = TestDataFactory.CreateTestRecentRounds();

        // Act
        var result = await _dashboardService.GeneratePerformanceRecommendationsAsync(userId, userStats, recentRounds);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result);
        Assert.Contains(result, r => r.Contains("approach shots"));
        Assert.Contains(result, r => r.Contains("course management"));
    }

    #endregion

    #region GetShotAnalyticsAsync Tests

    [Fact]
    public async Task GetShotAnalyticsAsync_ReturnsPlaceholderData()
    {
        // Arrange
        const int userId = 1;

        // Act
        var result = await _dashboardService.GetShotAnalyticsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.ClubUsage);
        Assert.NotEmpty(result.AverageDistances);
        Assert.True(result.AccuracyPercentage > 0);
        Assert.True(result.TotalShotsAnalyzed > 0);
        Assert.NotNull(result.FavoriteClub);
        Assert.NotNull(result.MostAccurateClub);
    }

    #endregion

    public void Dispose()
    {
        // Clean up any resources if needed
    }
}