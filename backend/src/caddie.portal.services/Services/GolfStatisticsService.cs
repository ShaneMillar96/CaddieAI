using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models;

namespace caddie.portal.services.Services;

public class GolfStatisticsService : IGolfStatisticsService
{
    private readonly CaddieAIDbContext _context;
    private readonly ILogger<GolfStatisticsService> _logger;

    public GolfStatisticsService(
        CaddieAIDbContext context,
        ILogger<GolfStatisticsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PerformanceAnalysisModel?> GetPerformanceAnalysisAsync(int userId, DateOnly? startDate = null, DateOnly? endDate = null)
    {
        try
        {
            var query = _context.Rounds
                .Where(r => r.UserId == userId && r.StatusId == 4) // Completed rounds only
                .Include(r => r.Course)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(r => r.RoundDate >= startDate.Value);
            if (endDate.HasValue)
                query = query.Where(r => r.RoundDate <= endDate.Value);

            var rounds = await query.OrderBy(r => r.RoundDate).ToListAsync();

            if (!rounds.Any())
                return null;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            
            var totalRounds = rounds.Count;
            var scores = rounds.Where(r => r.TotalScore.HasValue).Select(r => r.TotalScore!.Value).ToList();
            var putts = rounds.Where(r => r.TotalPutts.HasValue).Select(r => r.TotalPutts!.Value).ToList();
            var fairways = rounds.Where(r => r.FairwaysHit.HasValue).Select(r => r.FairwaysHit!.Value).ToList();
            var greens = rounds.Where(r => r.GreensInRegulation.HasValue).Select(r => r.GreensInRegulation!.Value).ToList();

            // Calculate scoring performance
            var avgScore = scores.Any() ? scores.Average() : 0;
            var bestScore = scores.Any() ? scores.Min() : 0;
            var worstScore = scores.Any() ? scores.Max() : 0;
            
            // Calculate score to par
            var scoresToPar = new List<double>();
            foreach (var round in rounds.Where(r => r.TotalScore.HasValue))
            {
                var coursePar = round.Course?.ParTotal ?? 72;
                scoresToPar.Add(round.TotalScore!.Value - coursePar);
            }
            var avgScoreToPar = scoresToPar.Any() ? scoresToPar.Average() : 0;

            // Calculate scoring trend (linear regression slope)
            var scoringTrend = CalculateLinearTrend(rounds.Where(r => r.TotalScore.HasValue)
                .Select((r, i) => new { Index = i, Score = r.TotalScore!.Value }));

            // Calculate consistency metrics
            var scoreStdDev = scores.Any() ? CalculateStandardDeviation(scores.Select(s => (double)s)) : 0;
            var consistencyRating = CalculateConsistencyRating(scoreStdDev, avgScore);

            var roundsUnderPar = scoresToPar.Count(s => s < 0);
            var roundsOverPar = scoresToPar.Count(s => s > 0);

            return new PerformanceAnalysisModel
            {
                UserId = userId,
                TotalRounds = totalRounds,
                StartDate = startDate,
                EndDate = endDate,
                
                // Scoring Performance
                AverageScore = scores.Any() ? avgScore : null,
                BestScore = scores.Any() ? bestScore : null,
                WorstScore = scores.Any() ? worstScore : null,
                AverageScoreToPar = scoresToPar.Any() ? avgScoreToPar : null,
                ScoringTrend = scoringTrend,
                
                // Short Game Performance
                AveragePutts = putts.Any() ? putts.Average() : null,
                PuttingAverage = putts.Any() ? putts.Average() / 18.0 : null,
                
                // Long Game Performance
                AverageFairwaysHit = fairways.Any() ? fairways.Average() : null,
                FairwayPercentage = fairways.Any() ? fairways.Average() / 14.0 * 100 : null, // Assuming 14 fairways per round
                AverageGreensInRegulation = greens.Any() ? greens.Average() : null,
                GreensInRegulationPercentage = greens.Any() ? greens.Average() / 18.0 * 100 : null,
                
                // Consistency Metrics
                ScoreStandardDeviation = scoreStdDev,
                ConsistencyRating = consistencyRating,
                RoundsUnderPar = roundsUnderPar,
                RoundsOverPar = roundsOverPar
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating performance analysis for user {UserId}", userId);
            throw;
        }
    }

    public async Task<HandicapTrendModel?> GetHandicapTrendAsync(int userId, int monthsBack = 6)
    {
        try
        {
            var startDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-monthsBack));
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            
            if (user == null)
                return null;

            var rounds = await _context.Rounds
                .Where(r => r.UserId == userId && r.StatusId == 4 && r.RoundDate >= startDate)
                .Include(r => r.Course)
                .OrderBy(r => r.RoundDate)
                .ToListAsync();

            if (!rounds.Any())
                return null;

            var handicapHistory = new List<HandicapDataPoint>();
            var scores = rounds.Where(r => r.TotalScore.HasValue).ToList();
            
            // Create handicap data points (simplified handicap calculation)
            foreach (var round in scores)
            {
                var coursePar = round.Course?.ParTotal ?? 72;
                var scoreToPar = round.TotalScore!.Value - coursePar;
                
                handicapHistory.Add(new HandicapDataPoint
                {
                    Date = round.RoundDate,
                    Score = round.TotalScore,
                    ScoreToPar = scoreToPar
                });
            }

            // Calculate trend
            var recentScores = scores.TakeLast(8).Select(r => r.TotalScore!.Value - (r.Course?.ParTotal ?? 72)).ToList();
            var handicapTrend = recentScores.Count >= 2 ? CalculateLinearTrend(recentScores.Select((s, i) => new { Index = i, Score = s })) : 0;

            var last5Average = scores.TakeLast(5).Any() ? 
                scores.TakeLast(5).Average(r => r.TotalScore!.Value - (r.Course?.ParTotal ?? 72)) : 0;
            var last10Average = scores.TakeLast(10).Any() ? 
                scores.TakeLast(10).Average(r => r.TotalScore!.Value - (r.Course?.ParTotal ?? 72)) : 0;

            var isImproving = handicapTrend < 0; // Negative trend means improving (lower scores)

            return new HandicapTrendModel
            {
                UserId = userId,
                CurrentHandicap = user.Handicap,
                HandicapTrend = handicapTrend,
                MonthsAnalyzed = monthsBack,
                HandicapHistory = handicapHistory,
                Last5RoundsAverage = last5Average,
                Last10RoundsAverage = last10Average,
                IsImproving = isImproving,
                ImprovementRate = Math.Abs(handicapTrend),
                TrendDescription = GetTrendDescription(handicapTrend)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating handicap trend for user {UserId}", userId);
            throw;
        }
    }

    public async Task<CoursePerformanceModel?> GetCoursePerformanceAsync(int userId, int courseId, DateOnly? startDate = null, DateOnly? endDate = null)
    {
        try
        {
            var query = _context.Rounds
                .Where(r => r.UserId == userId && r.CourseId == courseId && r.StatusId == 4)
                .Include(r => r.Course)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(r => r.RoundDate >= startDate.Value);
            if (endDate.HasValue)
                query = query.Where(r => r.RoundDate <= endDate.Value);

            var rounds = await query.OrderBy(r => r.RoundDate).ToListAsync();
            
            if (!rounds.Any())
                return null;

            var course = rounds.First().Course;
            var scores = rounds.Where(r => r.TotalScore.HasValue).Select(r => r.TotalScore!.Value).ToList();
            var coursePar = course?.ParTotal ?? 72;
            
            var scoresToPar = scores.Select(s => s - coursePar).ToList();
            var improvementTrend = scoresToPar.Count >= 2 ? 
                CalculateLinearTrend(scoresToPar.Select((s, i) => new { Index = i, Score = s })) : 0;

            // Calculate familiarity score based on rounds played and recent performance
            var familiarityScore = Math.Min(100, rounds.Count * 5 + Math.Max(0, 50 - scoresToPar.LastOrDefault()));

            return new CoursePerformanceModel
            {
                UserId = userId,
                CourseId = courseId,
                CourseName = course?.Name,
                RoundsPlayed = rounds.Count,
                FirstPlayed = rounds.Min(r => r.RoundDate),
                LastPlayed = rounds.Max(r => r.RoundDate),
                AverageScore = scores.Any() ? scores.Average() : null,
                BestScore = scores.Any() ? scores.Min() : null,
                WorstScore = scores.Any() ? scores.Max() : null,
                AverageScoreToPar = scoresToPar.Any() ? scoresToPar.Average() : null,
                ImprovementTrend = improvementTrend,
                FamiliarityScore = familiarityScore,
                IsFavoriteCourse = rounds.Count >= 3 // Simple logic for favorite course
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating course performance for user {UserId} and course {CourseId}", userId, courseId);
            throw;
        }
    }

    public async Task<ScoringTrendsModel?> GetScoringTrendsAsync(int userId, DateOnly? startDate = null, DateOnly? endDate = null)
    {
        try
        {
            var query = _context.Rounds
                .Where(r => r.UserId == userId && r.StatusId == 4 && r.TotalScore.HasValue)
                .Include(r => r.Course)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(r => r.RoundDate >= startDate.Value);
            if (endDate.HasValue)
                query = query.Where(r => r.RoundDate <= endDate.Value);

            var rounds = await query.OrderBy(r => r.RoundDate).ToListAsync();

            if (!rounds.Any())
                return null;

            var scoresToPar = rounds.Select(r => r.TotalScore!.Value - (r.Course?.ParTotal ?? 72)).ToList();
            var overallTrend = CalculateLinearTrend(scoresToPar.Select((s, i) => new { Index = i, Score = s }));
            
            var last5Average = scoresToPar.TakeLast(5).Any() ? scoresToPar.TakeLast(5).Average() : 0;
            var last10Average = scoresToPar.TakeLast(10).Any() ? scoresToPar.TakeLast(10).Average() : 0;
            var seasonAverage = scoresToPar.Average();

            // Create monthly trends
            var monthlyTrends = rounds
                .GroupBy(r => new { r.RoundDate.Year, r.RoundDate.Month })
                .Select(g => new MonthlyTrendData
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    AverageScore = g.Average(r => r.TotalScore!.Value - (r.Course?.ParTotal ?? 72)),
                    RoundsPlayed = g.Count()
                })
                .OrderBy(m => m.Year).ThenBy(m => m.Month)
                .ToList();

            // Calculate month-over-month improvements
            for (int i = 1; i < monthlyTrends.Count; i++)
            {
                monthlyTrends[i].ImprovementFromPreviousMonth = 
                    monthlyTrends[i - 1].AverageScore - monthlyTrends[i].AverageScore;
            }

            // Create score trend data points
            var scoreTrends = rounds.Select(r => new ScoreTrendDataPoint
            {
                RoundDate = r.RoundDate,
                Score = r.TotalScore!.Value,
                ScoreToPar = r.TotalScore!.Value - (r.Course?.ParTotal ?? 72)
            }).ToList();

            // Calculate moving averages
            for (int i = 0; i < scoreTrends.Count; i++)
            {
                var windowStart = Math.Max(0, i - 4); // 5-round moving average
                var windowScores = scoreTrends.Skip(windowStart).Take(i - windowStart + 1).Select(s => s.ScoreToPar);
                scoreTrends[i].MovingAverage = windowScores.Average();
            }

            return new ScoringTrendsModel
            {
                UserId = userId,
                StartDate = startDate,
                EndDate = endDate,
                OverallTrend = overallTrend,
                IsImproving = overallTrend < 0,
                Last5RoundsAverage = last5Average,
                Last10RoundsAverage = last10Average,
                SeasonAverage = seasonAverage,
                MonthlyTrends = monthlyTrends,
                ScoreTrends = scoreTrends
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating scoring trends for user {UserId}", userId);
            throw;
        }
    }

    public async Task<AdvancedMetricsModel?> GetAdvancedMetricsAsync(int userId, DateOnly? startDate = null, DateOnly? endDate = null)
    {
        try
        {
            var query = _context.Rounds
                .Where(r => r.UserId == userId && r.StatusId == 4)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(r => r.RoundDate >= startDate.Value);
            if (endDate.HasValue)
                query = query.Where(r => r.RoundDate <= endDate.Value);

            var rounds = await query.ToListAsync();

            if (!rounds.Any())
                return null;

            var scores = rounds.Where(r => r.TotalScore.HasValue).Select(r => r.TotalScore!.Value).ToList();
            var putts = rounds.Where(r => r.TotalPutts.HasValue).Select(r => r.TotalPutts!.Value).ToList();
            var fairways = rounds.Where(r => r.FairwaysHit.HasValue).Select(r => r.FairwaysHit!.Value).ToList();
            var greens = rounds.Where(r => r.GreensInRegulation.HasValue).Select(r => r.GreensInRegulation!.Value).ToList();

            // Calculate consistency metrics (lower values = more consistent)
            var scoreConsistency = scores.Any() ? CalculateStandardDeviation(scores.Select(s => (double)s)) : 0;
            var puttingConsistency = putts.Any() ? CalculateStandardDeviation(putts.Select(p => (double)p)) : 0;
            var fairwayConsistency = fairways.Any() ? CalculateStandardDeviation(fairways.Select(f => (double)f)) : 0;
            var greenConsistency = greens.Any() ? CalculateStandardDeviation(greens.Select(g => (double)g)) : 0;

            var completedRounds = rounds.Where(r => r.StatusId == 4).Count();
            var abandonedRounds = rounds.Where(r => r.StatusId == 5).Count();
            var completionRate = rounds.Any() ? (double)completedRounds / rounds.Count * 100 : 0;

            // Calculate average round time
            var roundsWithTime = rounds.Where(r => r.StartTime.HasValue && r.EndTime.HasValue).ToList();
            var avgRoundTime = roundsWithTime.Any() ? 
                roundsWithTime.Average(r => (r.EndTime!.Value - r.StartTime!.Value).TotalMinutes) : 0;

            return new AdvancedMetricsModel
            {
                UserId = userId,
                StartDate = startDate,
                EndDate = endDate,
                ScoreConsistency = scoreConsistency,
                PuttingConsistency = puttingConsistency,
                FairwayConsistency = fairwayConsistency,
                GreenConsistency = greenConsistency,
                AverageRoundTime = avgRoundTime,
                RoundsCompleted = completedRounds,
                RoundsAbandoned = abandonedRounds,
                CompletionRate = completionRate
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating advanced metrics for user {UserId}", userId);
            throw;
        }
    }

    public async Task<IEnumerable<CourseComparisonModel>> GetCourseComparisonAsync(int userId, IEnumerable<int>? courseIds = null, DateOnly? startDate = null, DateOnly? endDate = null)
    {
        try
        {
            var query = _context.Rounds
                .Where(r => r.UserId == userId && r.StatusId == 4)
                .Include(r => r.Course)
                .AsQueryable();

            if (courseIds != null && courseIds.Any())
                query = query.Where(r => courseIds.Contains(r.CourseId));

            if (startDate.HasValue)
                query = query.Where(r => r.RoundDate >= startDate.Value);
            if (endDate.HasValue)
                query = query.Where(r => r.RoundDate <= endDate.Value);

            var rounds = await query.ToListAsync();

            var courseComparisons = rounds
                .Where(r => r.TotalScore.HasValue)
                .GroupBy(r => new { r.CourseId, r.Course!.Name })
                .Select(g => new CourseComparisonModel
                {
                    CourseId = g.Key.CourseId,
                    CourseName = g.Key.Name,
                    RoundsPlayed = g.Count(),
                    AverageScore = g.Average(r => r.TotalScore!.Value),
                    BestScore = g.Min(r => r.TotalScore!.Value),
                    IsFavorite = g.Count() >= 3 // Simple favorite logic
                })
                .OrderByDescending(c => c.RoundsPlayed)
                .ToList();

            // Calculate relative difficulty and improvement rates
            var overallAverage = rounds.Where(r => r.TotalScore.HasValue).Average(r => r.TotalScore!.Value);
            
            foreach (var comparison in courseComparisons)
            {
                comparison.AverageScoreToPar = comparison.AverageScore - 72; // Assuming par 72
                comparison.DifficultyRating = comparison.AverageScore - overallAverage;
                
                var courseRounds = rounds.Where(r => r.CourseId == comparison.CourseId && r.TotalScore.HasValue)
                    .OrderBy(r => r.RoundDate).ToList();
                
                if (courseRounds.Count >= 2)
                {
                    var scores = courseRounds.Select(r => r.TotalScore!.Value).ToList();
                    comparison.ImprovementRate = CalculateLinearTrend(scores.Select((s, i) => new { Index = i, Score = s }));
                }
            }

            return courseComparisons;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating course comparison for user {UserId}", userId);
            throw;
        }
    }

    public async Task<WeatherPerformanceModel?> GetWeatherPerformanceAsync(int userId, (decimal? min, decimal? max)? temperatureRange = null, (decimal? min, decimal? max)? windSpeedRange = null, DateOnly? startDate = null, DateOnly? endDate = null)
    {
        try
        {
            var query = _context.Rounds
                .Where(r => r.UserId == userId && r.StatusId == 4 && r.TotalScore.HasValue)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(r => r.RoundDate >= startDate.Value);
            if (endDate.HasValue)
                query = query.Where(r => r.RoundDate <= endDate.Value);

            var rounds = await query.ToListAsync();

            if (!rounds.Any())
                return null;

            // Define good vs bad weather (simplified)
            var goodWeatherRounds = rounds.Where(r => 
                (r.TemperatureCelsius ?? 20) >= 15 && (r.TemperatureCelsius ?? 20) <= 25 &&
                (r.WindSpeedKmh ?? 5) <= 15).ToList();

            var badWeatherRounds = rounds.Where(r => 
                (r.TemperatureCelsius ?? 20) < 10 || (r.TemperatureCelsius ?? 20) > 30 ||
                (r.WindSpeedKmh ?? 5) > 20).ToList();

            var avgScoreGoodWeather = goodWeatherRounds.Any() ? 
                goodWeatherRounds.Average(r => r.TotalScore!.Value) : 0;
            var avgScoreBadWeather = badWeatherRounds.Any() ? 
                badWeatherRounds.Average(r => r.TotalScore!.Value) : 0;

            // Create weather breakdown
            var weatherBreakdown = new List<WeatherDataPoint>
            {
                new WeatherDataPoint
                {
                    Conditions = "Good Weather",
                    RoundsPlayed = goodWeatherRounds.Count,
                    AverageScore = goodWeatherRounds.Any() ? avgScoreGoodWeather : null,
                    AverageTemperature = goodWeatherRounds.Any() ? (double?)goodWeatherRounds.Average(r => r.TemperatureCelsius ?? 20) : null,
                    AverageWindSpeed = goodWeatherRounds.Any() ? (double?)goodWeatherRounds.Average(r => r.WindSpeedKmh ?? 5) : null
                },
                new WeatherDataPoint
                {
                    Conditions = "Poor Weather",
                    RoundsPlayed = badWeatherRounds.Count,
                    AverageScore = badWeatherRounds.Any() ? avgScoreBadWeather : null,
                    AverageTemperature = badWeatherRounds.Any() ? (double?)badWeatherRounds.Average(r => r.TemperatureCelsius ?? 20) : null,
                    AverageWindSpeed = badWeatherRounds.Any() ? (double?)badWeatherRounds.Average(r => r.WindSpeedKmh ?? 5) : null
                }
            };

            return new WeatherPerformanceModel
            {
                UserId = userId,
                StartDate = startDate,
                EndDate = endDate,
                AverageScoreGoodWeather = avgScoreGoodWeather,
                AverageScoreBadWeather = avgScoreBadWeather,
                WeatherBreakdown = weatherBreakdown,
                PreferredConditions = avgScoreGoodWeather < avgScoreBadWeather ? "Good Weather" : "All Conditions"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating weather performance for user {UserId}", userId);
            throw;
        }
    }

    public async Task<IEnumerable<RoundPerformanceModel>> GetRoundPerformanceHistoryAsync(int userId, int limit = 20)
    {
        try
        {
            var rounds = await _context.Rounds
                .Where(r => r.UserId == userId && r.StatusId == 4)
                .Include(r => r.Course)
                .OrderByDescending(r => r.RoundDate)
                .Take(limit)
                .ToListAsync();

            return rounds.Select(r => new RoundPerformanceModel
            {
                RoundId = r.Id,
                RoundDate = r.RoundDate,
                CourseName = r.Course?.Name,
                TotalScore = r.TotalScore,
                ScoreToPar = r.TotalScore.HasValue ? r.TotalScore.Value - (r.Course?.ParTotal ?? 72) : null,
                TotalPutts = r.TotalPutts,
                PuttingAverage = r.TotalPutts.HasValue ? r.TotalPutts.Value / 18.0 : null,
                FairwaysHit = r.FairwaysHit,
                FairwayPercentage = r.FairwaysHit.HasValue ? r.FairwaysHit.Value / 14.0 * 100 : null,
                GreensInRegulation = r.GreensInRegulation,
                GirPercentage = r.GreensInRegulation.HasValue ? r.GreensInRegulation.Value / 18.0 * 100 : null,
                Temperature = r.TemperatureCelsius,
                WindSpeed = r.WindSpeedKmh,
                RoundDuration = r.StartTime.HasValue && r.EndTime.HasValue ? 
                    r.EndTime.Value - r.StartTime.Value : null,
                Notes = r.Notes
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting round performance history for user {UserId}", userId);
            throw;
        }
    }

    public async Task<EnhancedRoundStatisticsModel?> GetEnhancedRoundStatisticsAsync(int userId, DateOnly? startDate = null, DateOnly? endDate = null)
    {
        try
        {
            var query = _context.Rounds
                .Where(r => r.UserId == userId && r.StatusId == 4)
                .Include(r => r.Course)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(r => r.RoundDate >= startDate.Value);
            if (endDate.HasValue)
                query = query.Where(r => r.RoundDate <= endDate.Value);

            var rounds = await query.ToListAsync();

            if (!rounds.Any())
                return null;

            var scores = rounds.Where(r => r.TotalScore.HasValue).Select(r => r.TotalScore!.Value).ToList();
            var putts = rounds.Where(r => r.TotalPutts.HasValue).Select(r => r.TotalPutts!.Value).ToList();
            var fairways = rounds.Where(r => r.FairwaysHit.HasValue).Select(r => r.FairwaysHit!.Value).ToList();
            var greens = rounds.Where(r => r.GreensInRegulation.HasValue).Select(r => r.GreensInRegulation!.Value).ToList();

            // Calculate basic statistics
            var totalRounds = rounds.Count;
            var avgScore = scores.Any() ? scores.Average() : 0;
            var bestScore = scores.Any() ? scores.Min() : 0;
            var worstScore = scores.Any() ? scores.Max() : 0;

            // Enhanced statistics
            var medianScore = scores.Any() ? CalculateMedian(scores.Select(s => (double)s)) : 0;
            var scoreStdDev = scores.Any() ? CalculateStandardDeviation(scores.Select(s => (double)s)) : 0;
            var consistencyRating = CalculateConsistencyRating(scoreStdDev, avgScore);

            // Performance distribution
            var scoresToPar = rounds.Where(r => r.TotalScore.HasValue)
                .Select(r => r.TotalScore!.Value - (r.Course?.ParTotal ?? 72)).ToList();
            
            var roundsUnderPar = scoresToPar.Count(s => s < 0);
            var roundsAtPar = scoresToPar.Count(s => s == 0);
            var roundsOverPar = scoresToPar.Count(s => s > 0);

            var uniqueCourses = rounds.Select(r => r.CourseId).Distinct().Count();
            var mostPlayedCourse = rounds.GroupBy(r => r.Course?.Name)
                .OrderByDescending(g => g.Count())
                .FirstOrDefault()?.Key;

            var roundsWithTime = rounds.Where(r => r.StartTime.HasValue && r.EndTime.HasValue).ToList();
            var avgRoundDuration = roundsWithTime.Any() ? 
                roundsWithTime.Average(r => (r.EndTime!.Value - r.StartTime!.Value).TotalMinutes) : 0;

            return new EnhancedRoundStatisticsModel
            {
                // Base statistics
                TotalRounds = totalRounds,
                AverageScore = avgScore,
                BestScore = bestScore,
                WorstScore = worstScore,
                AveragePutts = putts.Any() ? putts.Average() : null,
                AverageFairwaysHit = fairways.Any() ? fairways.Average() : null,
                AverageGreensInRegulation = greens.Any() ? greens.Average() : null,
                StartDate = startDate,
                EndDate = endDate,
                
                // Enhanced metrics
                MedianScore = medianScore,
                ScoreStandardDeviation = scoreStdDev,
                ConsistencyRating = consistencyRating,
                RoundsUnderPar = roundsUnderPar,
                RoundsAtPar = roundsAtPar,
                RoundsOverPar = roundsOverPar,
                PercentageUnderPar = scoresToPar.Any() ? (double)roundsUnderPar / scoresToPar.Count * 100 : 0,
                UniqueCourses = uniqueCourses,
                MostPlayedCourse = mostPlayedCourse,
                AverageRoundDuration = avgRoundDuration
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating enhanced round statistics for user {UserId}", userId);
            throw;
        }
    }

    public async Task<ConsistencyMetricsModel?> GetConsistencyMetricsAsync(int userId, DateOnly? startDate = null, DateOnly? endDate = null)
    {
        try
        {
            var query = _context.Rounds
                .Where(r => r.UserId == userId && r.StatusId == 4)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(r => r.RoundDate >= startDate.Value);
            if (endDate.HasValue)
                query = query.Where(r => r.RoundDate <= endDate.Value);

            var rounds = await query.OrderBy(r => r.RoundDate).ToListAsync();

            if (!rounds.Any())
                return null;

            var scores = rounds.Where(r => r.TotalScore.HasValue).Select(r => r.TotalScore!.Value).ToList();
            var putts = rounds.Where(r => r.TotalPutts.HasValue).Select(r => r.TotalPutts!.Value).ToList();
            var fairways = rounds.Where(r => r.FairwaysHit.HasValue).Select(r => r.FairwaysHit!.Value).ToList();
            var greens = rounds.Where(r => r.GreensInRegulation.HasValue).Select(r => r.GreensInRegulation!.Value).ToList();

            // Calculate consistency scores (0-100, higher = more consistent)
            var scoringConsistency = CalculateConsistencyScore(scores.Select(s => (double)s));
            var puttingConsistency = CalculateConsistencyScore(putts.Select(p => (double)p));
            var fairwayConsistency = CalculateConsistencyScore(fairways.Select(f => (double)f));
            var greenConsistency = CalculateConsistencyScore(greens.Select(g => (double)g));

            var overallConsistency = new[] { scoringConsistency, puttingConsistency, fairwayConsistency, greenConsistency }
                .Where(c => c > 0).DefaultIfEmpty(0).Average();

            // Variability metrics
            var scoreVariance = CalculateVariance(scores.Select(s => (double)s));
            var scoreStdDev = CalculateStandardDeviation(scores.Select(s => (double)s));
            var coefficientOfVariation = scores.Any() && scores.Average() > 0 ? scoreStdDev / scores.Average() : 0;

            var consistencyBreakdown = new List<ConsistencyBreakdown>
            {
                new ConsistencyBreakdown 
                { 
                    Category = "Scoring", 
                    ConsistencyScore = scoringConsistency,
                    StandardDeviation = scoreStdDev,
                    ConsistencyLevel = GetConsistencyLevel(scoringConsistency)
                },
                new ConsistencyBreakdown 
                { 
                    Category = "Putting", 
                    ConsistencyScore = puttingConsistency,
                    StandardDeviation = CalculateStandardDeviation(putts.Select(p => (double)p)),
                    ConsistencyLevel = GetConsistencyLevel(puttingConsistency)
                },
                new ConsistencyBreakdown 
                { 
                    Category = "Fairways", 
                    ConsistencyScore = fairwayConsistency,
                    StandardDeviation = CalculateStandardDeviation(fairways.Select(f => (double)f)),
                    ConsistencyLevel = GetConsistencyLevel(fairwayConsistency)
                },
                new ConsistencyBreakdown 
                { 
                    Category = "Greens", 
                    ConsistencyScore = greenConsistency,
                    StandardDeviation = CalculateStandardDeviation(greens.Select(g => (double)g)),
                    ConsistencyLevel = GetConsistencyLevel(greenConsistency)
                }
            };

            return new ConsistencyMetricsModel
            {
                UserId = userId,
                StartDate = startDate,
                EndDate = endDate,
                OverallConsistency = overallConsistency,
                ScoringConsistency = scoringConsistency,
                PuttingConsistency = puttingConsistency,
                FairwayConsistency = fairwayConsistency,
                GreenConsistency = greenConsistency,
                ScoreVariance = scoreVariance,
                ScoreStandardDeviation = scoreStdDev,
                CoefficientOfVariation = coefficientOfVariation,
                ConsistencyBreakdown = consistencyBreakdown
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating consistency metrics for user {UserId}", userId);
            throw;
        }
    }

    #region Helper Methods

    private double CalculateLinearTrend(IEnumerable<dynamic> dataPoints)
    {
        var points = dataPoints.ToList();
        if (points.Count < 2) return 0;

        var n = points.Count;
        var sumX = points.Sum(p => (double)p.Index);
        var sumY = points.Sum(p => (double)p.Score);
        var sumXY = points.Sum(p => (double)p.Index * (double)p.Score);
        var sumXX = points.Sum(p => (double)p.Index * (double)p.Index);

        var slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope;
    }

    private double CalculateStandardDeviation(IEnumerable<double> values)
    {
        var valuesList = values.ToList();
        if (!valuesList.Any()) return 0;

        var average = valuesList.Average();
        var sumOfSquares = valuesList.Sum(x => (x - average) * (x - average));
        return Math.Sqrt(sumOfSquares / valuesList.Count);
    }

    private double CalculateVariance(IEnumerable<double> values)
    {
        var valuesList = values.ToList();
        if (!valuesList.Any()) return 0;

        var average = valuesList.Average();
        return valuesList.Sum(x => (x - average) * (x - average)) / valuesList.Count;
    }

    private double CalculateMedian(IEnumerable<double> values)
    {
        var sortedValues = values.OrderBy(x => x).ToList();
        if (!sortedValues.Any()) return 0;

        var mid = sortedValues.Count / 2;
        if (sortedValues.Count % 2 == 0)
            return (sortedValues[mid - 1] + sortedValues[mid]) / 2.0;
        else
            return sortedValues[mid];
    }

    private double CalculateConsistencyRating(double standardDeviation, double average)
    {
        if (average <= 0) return 0;
        var coefficientOfVariation = standardDeviation / average;
        return Math.Max(0, 100 - (coefficientOfVariation * 100));
    }

    private double CalculateConsistencyScore(IEnumerable<double> values)
    {
        var valuesList = values.ToList();
        if (!valuesList.Any()) return 0;

        var stdDev = CalculateStandardDeviation(valuesList);
        var average = valuesList.Average();
        
        if (average <= 0) return 0;
        
        var coefficientOfVariation = stdDev / average;
        return Math.Max(0, 100 - (coefficientOfVariation * 50)); // Scale factor of 50 for golf metrics
    }

    private string GetTrendDescription(double trend)
    {
        return trend switch
        {
            < -0.5 => "Rapidly Improving",
            < -0.2 => "Improving",
            < 0.2 => "Stable",
            < 0.5 => "Declining",
            _ => "Rapidly Declining"
        };
    }

    private string GetConsistencyLevel(double consistencyScore)
    {
        return consistencyScore switch
        {
            >= 80 => "Very Consistent",
            >= 65 => "Consistent",
            >= 50 => "Moderately Consistent",
            >= 35 => "Inconsistent",
            _ => "Very Inconsistent"
        };
    }

    #endregion
}