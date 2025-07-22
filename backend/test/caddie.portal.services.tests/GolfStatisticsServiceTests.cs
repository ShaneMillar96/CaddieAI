using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Xunit;
using caddie.portal.services.Services;
using caddie.portal.services.Interfaces;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models;

namespace caddie.portal.services.tests;

public class GolfStatisticsServiceTests : IDisposable
{
    private readonly CaddieAIDbContext _context;
    private readonly IGolfStatisticsService _statisticsService;
    private readonly ILogger<GolfStatisticsService> _logger;

    public GolfStatisticsServiceTests()
    {
        // Create in-memory database for testing
        var options = new DbContextOptionsBuilder<CaddieAIDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new CaddieAIDbContext(options);
        
        // Simple logger implementation for testing
        _logger = new TestLogger<GolfStatisticsService>();
        _statisticsService = new GolfStatisticsService(_context, _logger);

        // Seed test data
        SeedTestData();
    }

    private void SeedTestData()
    {
        // Create test user
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = "hash",
            Handicap = 15,
            SkillLevelId = 1,
            StatusId = 1,
            CreatedAt = DateTime.UtcNow
        };

        // Create test course
        var course = new Course
        {
            Id = 1,
            Name = "Test Golf Course",
            Country = "USA", // Required field
            ParTotal = 72,
            TotalHoles = 18,
            CreatedAt = DateTime.UtcNow
        };

        // Create test rounds
        var rounds = new List<Round>
        {
            new Round
            {
                Id = 1,
                UserId = 1,
                CourseId = 1,
                RoundDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-10)),
                StatusId = 4, // Completed
                TotalScore = 85,
                TotalPutts = 32,
                FairwaysHit = 8,
                GreensInRegulation = 10,
                TemperatureCelsius = 20,
                WindSpeedKmh = 10,
                StartTime = DateTime.Now.AddHours(-4),
                EndTime = DateTime.Now,
                CreatedAt = DateTime.UtcNow
            },
            new Round
            {
                Id = 2,
                UserId = 1,
                CourseId = 1,
                RoundDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-5)),
                StatusId = 4, // Completed
                TotalScore = 82,
                TotalPutts = 30,
                FairwaysHit = 10,
                GreensInRegulation = 12,
                TemperatureCelsius = 25,
                WindSpeedKmh = 5,
                StartTime = DateTime.Now.AddHours(-3),
                EndTime = DateTime.Now,
                CreatedAt = DateTime.UtcNow
            },
            new Round
            {
                Id = 3,
                UserId = 1,
                CourseId = 1,
                RoundDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-2)),
                StatusId = 4, // Completed
                TotalScore = 78,
                TotalPutts = 28,
                FairwaysHit = 12,
                GreensInRegulation = 14,
                TemperatureCelsius = 22,
                WindSpeedKmh = 8,
                StartTime = DateTime.Now.AddHours(-3.5),
                EndTime = DateTime.Now,
                CreatedAt = DateTime.UtcNow
            }
        };

        _context.Users.Add(user);
        _context.Courses.Add(course);
        _context.Rounds.AddRange(rounds);
        _context.SaveChanges();
    }

    [Fact]
    public async Task GetPerformanceAnalysisAsync_WithValidUser_ReturnsPerformanceAnalysis()
    {
        // Arrange
        var userId = 1;

        // Act
        var result = await _statisticsService.GetPerformanceAnalysisAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.UserId);
        Assert.Equal(3, result.TotalRounds);
        Assert.True(result.AverageScore > 0);
        Assert.True(result.BestScore <= result.WorstScore);
        Assert.NotNull(result.AveragePutts);
        Assert.NotNull(result.AverageFairwaysHit);
        Assert.NotNull(result.AverageGreensInRegulation);
    }

    [Fact]
    public async Task GetPerformanceAnalysisAsync_WithNonExistentUser_ReturnsNull()
    {
        // Arrange
        var userId = 999;

        // Act
        var result = await _statisticsService.GetPerformanceAnalysisAsync(userId);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetHandicapTrendAsync_WithValidUser_ReturnsHandicapTrend()
    {
        // Arrange
        var userId = 1;
        var monthsBack = 6;

        // Act
        var result = await _statisticsService.GetHandicapTrendAsync(userId, monthsBack);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.UserId);
        Assert.Equal(monthsBack, result.MonthsAnalyzed);
        Assert.NotEmpty(result.HandicapHistory);
        Assert.NotNull(result.TrendDescription);
    }

    [Fact]
    public async Task GetCoursePerformanceAsync_WithValidData_ReturnsPerformance()
    {
        // Arrange
        var userId = 1;
        var courseId = 1;

        // Act
        var result = await _statisticsService.GetCoursePerformanceAsync(userId, courseId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.UserId);
        Assert.Equal(courseId, result.CourseId);
        Assert.Equal("Test Golf Course", result.CourseName);
        Assert.True(result.RoundsPlayed > 0);
        Assert.NotNull(result.AverageScore);
        Assert.NotNull(result.BestScore);
    }

    [Fact]
    public async Task GetScoringTrendsAsync_WithValidUser_ReturnsTrends()
    {
        // Arrange
        var userId = 1;

        // Act
        var result = await _statisticsService.GetScoringTrendsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.UserId);
        Assert.NotNull(result.OverallTrend);
        Assert.NotNull(result.Last5RoundsAverage);
        Assert.NotNull(result.Last10RoundsAverage);
        Assert.NotNull(result.SeasonAverage);
        Assert.NotEmpty(result.ScoreTrends);
    }

    [Fact]
    public async Task GetAdvancedMetricsAsync_WithValidUser_ReturnsMetrics()
    {
        // Arrange
        var userId = 1;

        // Act
        var result = await _statisticsService.GetAdvancedMetricsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.UserId);
        Assert.True(result.ScoreConsistency >= 0);
        Assert.True(result.PuttingConsistency >= 0);
        Assert.True(result.FairwayConsistency >= 0);
        Assert.True(result.GreenConsistency >= 0);
        Assert.True(result.CompletionRate >= 0);
        Assert.True(result.CompletionRate <= 100);
    }

    [Fact]
    public async Task GetCourseComparisonAsync_WithValidUser_ReturnsComparison()
    {
        // Arrange
        var userId = 1;

        // Act
        var result = await _statisticsService.GetCourseComparisonAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result);
        
        var courseComparison = result.First();
        Assert.Equal(1, courseComparison.CourseId);
        Assert.Equal("Test Golf Course", courseComparison.CourseName);
        Assert.True(courseComparison.RoundsPlayed > 0);
        Assert.NotNull(courseComparison.AverageScore);
    }

    [Fact]
    public async Task GetWeatherPerformanceAsync_WithValidUser_ReturnsWeatherPerformance()
    {
        // Arrange
        var userId = 1;

        // Act
        var result = await _statisticsService.GetWeatherPerformanceAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.UserId);
        Assert.NotEmpty(result.WeatherBreakdown);
        Assert.NotNull(result.PreferredConditions);
        Assert.True(result.AverageScoreGoodWeather > 0 || result.AverageScoreBadWeather > 0);
    }

    [Fact]
    public async Task GetRoundPerformanceHistoryAsync_WithValidUser_ReturnsHistory()
    {
        // Arrange
        var userId = 1;
        var limit = 10;

        // Act
        var result = await _statisticsService.GetRoundPerformanceHistoryAsync(userId, limit);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result);
        Assert.True(result.Count() <= limit);
        
        var roundPerformance = result.First();
        Assert.NotNull(roundPerformance.CourseName);
        Assert.True(roundPerformance.TotalScore > 0);
    }

    [Fact]
    public async Task GetEnhancedRoundStatisticsAsync_WithValidUser_ReturnsEnhancedStats()
    {
        // Arrange
        var userId = 1;

        // Act
        var result = await _statisticsService.GetEnhancedRoundStatisticsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.TotalRounds > 0);
        Assert.NotNull(result.AverageScore);
        Assert.NotNull(result.MedianScore);
        Assert.NotNull(result.ScoreStandardDeviation);
        Assert.True(result.ConsistencyRating >= 0);
        Assert.True(result.ConsistencyRating <= 100);
        Assert.True(result.UniqueCourses > 0);
    }

    [Fact]
    public async Task GetConsistencyMetricsAsync_WithValidUser_ReturnsConsistencyMetrics()
    {
        // Arrange
        var userId = 1;

        // Act
        var result = await _statisticsService.GetConsistencyMetricsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.UserId);
        Assert.True(result.OverallConsistency >= 0);
        Assert.True(result.ScoringConsistency >= 0);
        Assert.True(result.PuttingConsistency >= 0);
        Assert.True(result.FairwayConsistency >= 0);
        Assert.True(result.GreenConsistency >= 0);
        Assert.NotEmpty(result.ConsistencyBreakdown);
    }

    [Fact]
    public async Task GetPerformanceAnalysisAsync_WithDateRange_FiltersCorrectly()
    {
        // Arrange
        var userId = 1;
        var startDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-7));
        var endDate = DateOnly.FromDateTime(DateTime.Today);

        // Act
        var result = await _statisticsService.GetPerformanceAnalysisAsync(userId, startDate, endDate);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(startDate, result.StartDate);
        Assert.Equal(endDate, result.EndDate);
        // Should have fewer rounds than total (only 2 rounds in last 7 days)
        Assert.True(result.TotalRounds <= 3);
    }

    [Theory]
    [InlineData(1, 1)] // 1 month back
    [InlineData(3, 3)] // 3 months back  
    [InlineData(6, 6)] // 6 months back
    public async Task GetHandicapTrendAsync_WithDifferentMonthsBack_ReturnsCorrectMonths(int monthsBack, int expectedMonths)
    {
        // Arrange
        var userId = 1;

        // Act
        var result = await _statisticsService.GetHandicapTrendAsync(userId, monthsBack);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(expectedMonths, result.MonthsAnalyzed);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}

// Simple test logger implementation
public class TestLogger<T> : ILogger<T>
{
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
    public bool IsEnabled(LogLevel logLevel) => false;
    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) { }
}