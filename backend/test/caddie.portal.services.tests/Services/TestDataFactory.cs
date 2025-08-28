using caddie.portal.dal.Models;
using caddie.portal.services.Models;
using caddie.portal.dal.Enums;
using RoundStatusEnum = caddie.portal.dal.Enums.RoundStatus;
using ServiceRoundStatus = caddie.portal.services.Models.RoundStatus;

namespace caddie.portal.services.tests.Services;

/// <summary>
/// Factory class for creating consistent test data across dashboard service tests
/// </summary>
public static class TestDataFactory
{
    #region Test Users
    
    public static User CreateTestUser(int id = 1, string email = "test@example.com")
    {
        return new User
        {
            Id = id,
            Email = email,
            FirstName = "John",
            LastName = "Doe",
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow
        };
    }
    
    #endregion

    #region Test Courses

    public static Course CreateTestCourse(int id = 1, string name = "Test Golf Course", int par = 72)
    {
        return new Course
        {
            Id = id,
            Name = name,
            CreatedAt = DateTime.UtcNow.AddDays(-100),
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static List<Hole> CreateTestHoles(int courseId = 1, int holeCount = 18)
    {
        var holes = new List<Hole>();
        var parPattern = new[] { 4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5 }; // Standard par pattern
        
        for (int i = 1; i <= holeCount; i++)
        {
            holes.Add(new Hole
            {
                Id = i,
                CourseId = courseId,
                HoleNumber = i,
                Par = parPattern[(i - 1) % parPattern.Length],
                CreatedAt = DateTime.UtcNow.AddDays(-100),
                UpdatedAt = DateTime.UtcNow
            });
        }
        
        return holes;
    }
    
    #endregion

    #region Test Rounds

    /// <summary>
    /// Create a single test round with realistic data
    /// </summary>
    public static Round CreateTestRound(
        int id = 1, 
        int userId = 1, 
        int courseId = 1, 
        RoundStatusEnum status = RoundStatusEnum.Completed,
        int? totalScore = 85,
        DateTime? roundDate = null,
        bool includeHoleScores = false)
    {
        var round = new Round
        {
            Id = id,
            UserId = userId,
            CourseId = courseId,
            StatusId = (int)status,
            RoundDate = DateOnly.FromDateTime(roundDate ?? DateTime.Now.AddDays(-id)),
            TotalScore = totalScore,
            CurrentHole = status == RoundStatusEnum.Completed ? 18 : 1,
            StartTime = roundDate?.AddHours(-4) ?? DateTime.Now.AddDays(-id).AddHours(-4),
            EndTime = status == RoundStatusEnum.Completed ? 
                (roundDate?.AddHours(-0.5) ?? DateTime.Now.AddDays(-id).AddHours(-0.5)) : null,
            CreatedAt = DateTime.UtcNow.AddDays(-id - 1),
            UpdatedAt = DateTime.UtcNow,
            Course = CreateTestCourse(courseId)
        };

        if (includeHoleScores && status == RoundStatusEnum.Completed)
        {
            round.HoleScores = CreateTestHoleScores(id, CreateTestHoles(courseId));
        }

        return round;
    }

    /// <summary>
    /// Create multiple test rounds for a user with varying dates and scores
    /// </summary>
    public static List<Round> CreateTestRounds(
        int userId = 1, 
        int count = 10, 
        int startingRoundId = 1,
        bool includeVariedPerformance = true)
    {
        var rounds = new List<Round>();
        var baseScore = 85;
        var courseIds = new[] { 1, 2, 1, 3, 1, 2, 1, 1, 2, 3 }; // Some course variety
        
        for (int i = 0; i < count; i++)
        {
            var roundId = startingRoundId + i;
            var courseId = courseIds[i % courseIds.Length];
            
            // Create score variation for realistic testing
            var score = baseScore;
            if (includeVariedPerformance)
            {
                // Create improving trend in first half, declining in second half
                if (i < count / 2)
                {
                    score = baseScore + (5 - i); // Improving scores (90, 89, 88, 87, 86)
                }
                else
                {
                    score = baseScore - (i - count / 2); // Declining scores (85, 84, 83, 82, 81)
                }
            }
            
            rounds.Add(CreateTestRound(
                roundId, 
                userId, 
                courseId, 
                RoundStatusEnum.Completed, 
                score,
                DateTime.Now.AddDays(-count + i), // Recent to oldest
                true
            ));
        }
        
        return rounds;
    }

    /// <summary>
    /// Create test rounds with minimal data (new user scenario)
    /// </summary>
    public static List<Round> CreateMinimalTestRounds(int userId = 1, int count = 2)
    {
        var rounds = new List<Round>();
        
        for (int i = 0; i < count; i++)
        {
            rounds.Add(CreateTestRound(
                i + 1, 
                userId, 
                1, 
                RoundStatusEnum.Completed, 
                90 + i * 2, // 90, 92
                DateTime.Now.AddDays(-i - 1)
            ));
        }
        
        return rounds;
    }

    public static List<HoleScore> CreateTestHoleScores(int roundId, List<Hole> holes)
    {
        var holeScores = new List<HoleScore>();
        var random = new Random(roundId); // Consistent random for same round
        
        foreach (var hole in holes)
        {
            var par = hole.Par ?? 4;
            var score = par; // Start with par
            
            // Add some realistic variation
            var variation = random.Next(-1, 3); // -1 (birdie), 0 (par), 1 (bogey), 2 (double bogey)
            score += variation;
            score = Math.Max(1, score); // No scores below 1
            
            holeScores.Add(new HoleScore
            {
                Id = roundId * 100 + hole.HoleNumber,
                RoundId = roundId,
                HoleId = hole.Id,
                HoleNumber = hole.HoleNumber,
                Score = score,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Hole = hole
            });
        }
        
        return holeScores;
    }
    
    #endregion

    #region Service Models

    public static UserStatsModel CreateTestUserStats(
        decimal scoringAverage = 85.5m,
        int totalRoundsThisSeason = 12,
        string favoriteCourse = "Test Golf Course",
        int? bestScore = 78)
    {
        return new UserStatsModel
        {
            CurrentHandicap = 15.2m,
            HandicapChange = -1.5m, // Improving
            ScoringAverage = scoringAverage,
            TotalRoundsThisSeason = totalRoundsThisSeason,
            FavoriteCourse = favoriteCourse,
            BestScore = bestScore,
            RoundsAnalyzed = Math.Min(totalRoundsThisSeason, 10)
        };
    }

    public static List<RecentRoundModel> CreateTestRecentRounds(int count = 5)
    {
        var rounds = new List<RecentRoundModel>();
        var baseScore = 85;
        
        for (int i = 0; i < count; i++)
        {
            rounds.Add(new RecentRoundModel
            {
                RoundId = i + 1,
                CourseName = i % 2 == 0 ? "Test Golf Course" : "Another Test Course",
                DatePlayed = DateTime.Now.AddDays(-i - 1),
                TotalScore = baseScore + i - 2, // Some variation
                ParTotal = 72,
                Duration = TimeSpan.FromHours(3.5 + (i * 0.1)),
                BestHole = 1 + (i % 18),
                WorstHole = 10 + (i % 8),
                Status = ServiceRoundStatus.Completed
            });
        }
        
        return rounds;
    }

    public static PerformanceInsightsModel CreateTestPerformanceInsights(
        string trendAnalysis = "improving",
        int roundsAnalyzed = 10,
        decimal confidenceLevel = 0.85m)
    {
        return new PerformanceInsightsModel
        {
            TrendAnalysis = trendAnalysis,
            Strengths = new List<string> { "Consistent scoring", "Regular play", "Course management" },
            ImprovementAreas = new List<string> { "Short game", "Putting accuracy" },
            Recommendations = new List<string> 
            { 
                "Practice putting for 20 minutes before each round",
                "Focus on approach shots from 100-150 yards",
                "Work on course management and club selection"
            },
            MotivationalMessage = "Excellent progress! Your scores are trending in the right direction.",
            GeneratedAt = DateTime.UtcNow,
            ConfidenceLevel = confidenceLevel,
            RoundsAnalyzed = roundsAnalyzed
        };
    }

    public static ShotAnalyticsModel CreateTestShotAnalytics()
    {
        return new ShotAnalyticsModel
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
        };
    }

    public static DashboardOverviewModel CreateTestDashboardOverview()
    {
        return new DashboardOverviewModel
        {
            UserStats = CreateTestUserStats(),
            RecentRounds = CreateTestRecentRounds(),
            Insights = CreateTestPerformanceInsights(),
            ShotAnalytics = CreateTestShotAnalytics(),
            LastUpdated = DateTime.UtcNow
        };
    }
    
    #endregion

    #region Edge Case Data

    /// <summary>
    /// Create empty/minimal data for new user scenarios
    /// </summary>
    public static class EmptyData
    {
        public static UserStatsModel CreateEmptyUserStats()
        {
            return new UserStatsModel
            {
                ScoringAverage = 0,
                TotalRoundsThisSeason = 0,
                RoundsAnalyzed = 0
            };
        }

        public static List<Round> CreateEmptyRounds()
        {
            return new List<Round>();
        }

        public static PerformanceInsightsModel CreateInsufficientDataInsights()
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
                RoundsAnalyzed = 0
            };
        }
    }
    
    #endregion
}