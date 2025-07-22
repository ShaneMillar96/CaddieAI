namespace caddie.portal.services.Models;

/// <summary>
/// Comprehensive performance analysis model
/// </summary>
public class PerformanceAnalysisModel
{
    public int UserId { get; set; }
    public int TotalRounds { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    
    // Scoring Performance
    public double? AverageScore { get; set; }
    public int? BestScore { get; set; }
    public int? WorstScore { get; set; }
    public double? AverageScoreToPar { get; set; }
    public double? ScoringTrend { get; set; } // Positive = improving, Negative = declining
    
    // Short Game Performance
    public double? AveragePutts { get; set; }
    public double? PuttingAverage { get; set; }
    public double? UpAndDownPercentage { get; set; }
    public double? SandSavePercentage { get; set; }
    
    // Long Game Performance
    public double? AverageFairwaysHit { get; set; }
    public double? FairwayPercentage { get; set; }
    public double? AverageGreensInRegulation { get; set; }
    public double? GreensInRegulationPercentage { get; set; }
    
    // Consistency Metrics
    public double? ScoreStandardDeviation { get; set; }
    public double? ConsistencyRating { get; set; } // 0-100 scale
    public int? RoundsUnderPar { get; set; }
    public int? RoundsOverPar { get; set; }
    
    // Performance by Par
    public double? Par3Average { get; set; }
    public double? Par4Average { get; set; }
    public double? Par5Average { get; set; }
}

/// <summary>
/// Handicap trend analysis and projections
/// </summary>
public class HandicapTrendModel
{
    public int UserId { get; set; }
    public decimal? CurrentHandicap { get; set; }
    public decimal? ProjectedHandicap { get; set; }
    public double? HandicapTrend { get; set; } // Positive = getting worse, Negative = improving
    public int MonthsAnalyzed { get; set; }
    
    public IEnumerable<HandicapDataPoint> HandicapHistory { get; set; } = new List<HandicapDataPoint>();
    
    // Recent performance indicators
    public double? Last5RoundsAverage { get; set; }
    public double? Last10RoundsAverage { get; set; }
    public decimal? HandicapChange30Days { get; set; }
    public decimal? HandicapChange90Days { get; set; }
    
    // Improvement metrics
    public bool IsImproving { get; set; }
    public double? ImprovementRate { get; set; } // Strokes per month
    public string? TrendDescription { get; set; }
}

public class HandicapDataPoint
{
    public DateOnly Date { get; set; }
    public decimal? Handicap { get; set; }
    public int? Score { get; set; }
    public double? ScoreToPar { get; set; }
}

/// <summary>
/// Course-specific performance analysis
/// </summary>
public class CoursePerformanceModel
{
    public int UserId { get; set; }
    public int CourseId { get; set; }
    public string? CourseName { get; set; }
    public int RoundsPlayed { get; set; }
    public DateOnly? FirstPlayed { get; set; }
    public DateOnly? LastPlayed { get; set; }
    
    // Course-specific scoring
    public double? AverageScore { get; set; }
    public int? BestScore { get; set; }
    public int? WorstScore { get; set; }
    public double? AverageScoreToPar { get; set; }
    public double? ImprovementTrend { get; set; }
    
    // Course familiarity metrics
    public double? FamiliarityScore { get; set; } // Based on rounds played and recent performance
    public bool IsFavoriteCourse { get; set; }
    
    // Performance breakdown by hole type
    public double? Par3Performance { get; set; }
    public double? Par4Performance { get; set; }
    public double? Par5Performance { get; set; }
    
    // Weather impact on this course
    public double? AverageScoreGoodWeather { get; set; }
    public double? AverageScorePoorWeather { get; set; }
}

/// <summary>
/// Scoring trends and improvement patterns
/// </summary>
public class ScoringTrendsModel
{
    public int UserId { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    
    // Trend analysis
    public double? OverallTrend { get; set; } // Linear regression slope
    public double? TrendConfidence { get; set; } // R-squared value
    public bool IsImproving { get; set; }
    
    // Moving averages
    public double? Last5RoundsAverage { get; set; }
    public double? Last10RoundsAverage { get; set; }
    public double? SeasonAverage { get; set; }
    
    // Streak analysis
    public int? CurrentImprovementStreak { get; set; }
    public int? LongestImprovementStreak { get; set; }
    public int? ConsecutiveRoundsUnderAverage { get; set; }
    
    // Performance patterns
    public IEnumerable<MonthlyTrendData> MonthlyTrends { get; set; } = new List<MonthlyTrendData>();
    public IEnumerable<ScoreTrendDataPoint> ScoreTrends { get; set; } = new List<ScoreTrendDataPoint>();
}

public class MonthlyTrendData
{
    public int Year { get; set; }
    public int Month { get; set; }
    public double? AverageScore { get; set; }
    public int RoundsPlayed { get; set; }
    public double? ImprovementFromPreviousMonth { get; set; }
}

public class ScoreTrendDataPoint
{
    public DateOnly RoundDate { get; set; }
    public int Score { get; set; }
    public double ScoreToPar { get; set; }
    public double? MovingAverage { get; set; }
}

/// <summary>
/// Advanced golf metrics and consistency analysis
/// </summary>
public class AdvancedMetricsModel
{
    public int UserId { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    
    // Consistency metrics
    public double? ScoreConsistency { get; set; } // Lower is more consistent
    public double? PuttingConsistency { get; set; }
    public double? FairwayConsistency { get; set; }
    public double? GreenConsistency { get; set; }
    
    // Performance ratios
    public double? ScoringEfficiency { get; set; } // Scores relative to skill level
    public double? RecoveryRate { get; set; } // Ability to recover from bad shots
    public double? PressurePerformance { get; set; } // Performance in important rounds
    
    // Strokes gained approximation
    public double? StrokesGainedPutting { get; set; }
    public double? StrokesGainedApproach { get; set; }
    public double? StrokesGainedTeeToGreen { get; set; }
    
    // Round completion metrics
    public double? AverageRoundTime { get; set; }
    public int? RoundsCompleted { get; set; }
    public int? RoundsAbandoned { get; set; }
    public double? CompletionRate { get; set; }
}

/// <summary>
/// Course comparison analysis
/// </summary>
public class CourseComparisonModel
{
    public int CourseId { get; set; }
    public string CourseName { get; set; } = null!;
    public int RoundsPlayed { get; set; }
    public double? AverageScore { get; set; }
    public double? AverageScoreToPar { get; set; }
    public int? BestScore { get; set; }
    public double? DifficultyRating { get; set; } // Relative to user's other courses
    public double? ImprovementRate { get; set; }
    public bool IsFavorite { get; set; }
}

/// <summary>
/// Weather-based performance analysis
/// </summary>
public class WeatherPerformanceModel
{
    public int UserId { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    
    // Temperature performance
    public double? AverageScoreGoodWeather { get; set; }
    public double? AverageScoreBadWeather { get; set; }
    public double? TemperatureImpact { get; set; } // Score difference per 10°C
    
    // Wind performance  
    public double? AverageScoreLowWind { get; set; }
    public double? AverageScoreHighWind { get; set; }
    public double? WindImpact { get; set; } // Score difference per 10 km/h wind
    
    // Weather adaptation
    public double? WeatherAdaptability { get; set; } // How well user adapts to conditions
    public string? PreferredConditions { get; set; }
    
    public IEnumerable<WeatherDataPoint> WeatherBreakdown { get; set; } = new List<WeatherDataPoint>();
}

public class WeatherDataPoint
{
    public string? Conditions { get; set; }
    public int RoundsPlayed { get; set; }
    public double? AverageScore { get; set; }
    public double? AverageTemperature { get; set; }
    public double? AverageWindSpeed { get; set; }
}

/// <summary>
/// Individual round performance details
/// </summary>
public class RoundPerformanceModel
{
    public int RoundId { get; set; }
    public DateOnly RoundDate { get; set; }
    public string? CourseName { get; set; }
    public int? TotalScore { get; set; }
    public double? ScoreToPar { get; set; }
    
    // Performance metrics for this round
    public int? TotalPutts { get; set; }
    public double? PuttingAverage { get; set; }
    public int? FairwaysHit { get; set; }
    public double? FairwayPercentage { get; set; }
    public int? GreensInRegulation { get; set; }
    public double? GirPercentage { get; set; }
    
    // Round context
    public decimal? Temperature { get; set; }
    public decimal? WindSpeed { get; set; }
    public TimeSpan? RoundDuration { get; set; }
    public string? Notes { get; set; }
    
    // Performance rating for this round
    public double? PerformanceRating { get; set; } // Compared to user's average
    public string? PerformanceCategory { get; set; } // "Excellent", "Good", "Average", "Poor"
}

/// <summary>
/// Enhanced round statistics extending the basic RoundStatisticsModel
/// </summary>
public class EnhancedRoundStatisticsModel : RoundStatisticsModel
{
    // Additional enhanced metrics
    public double? MedianScore { get; set; }
    public double? ScoreStandardDeviation { get; set; }
    public double? ConsistencyRating { get; set; }
    
    // Performance distribution
    public int RoundsUnderPar { get; set; }
    public int RoundsAtPar { get; set; }
    public int RoundsOverPar { get; set; }
    public double? PercentageUnderPar { get; set; }
    
    // Improvement metrics
    public double? ImprovementTrend { get; set; }
    public double? MonthOverMonthChange { get; set; }
    
    // Course variety
    public int UniqueCourses { get; set; }
    public string? MostPlayedCourse { get; set; }
    public double? AverageRoundDuration { get; set; }
    
    // Weather impact
    public double? AverageScoreGoodWeather { get; set; }
    public double? AverageScoreBadWeather { get; set; }
}

/// <summary>
/// Consistency metrics and variability analysis
/// </summary>
public class ConsistencyMetricsModel
{
    public int UserId { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    
    // Overall consistency scores (0-100, higher = more consistent)
    public double? OverallConsistency { get; set; }
    public double? ScoringConsistency { get; set; }
    public double? PuttingConsistency { get; set; }
    public double? FairwayConsistency { get; set; }
    public double? GreenConsistency { get; set; }
    
    // Variability metrics
    public double? ScoreVariance { get; set; }
    public double? ScoreStandardDeviation { get; set; }
    public double? CoefficientOfVariation { get; set; }
    
    // Streak analysis
    public int? LongestConsistentStreak { get; set; }
    public int? CurrentConsistentStreak { get; set; }
    public double? StreakThreshold { get; set; } // Score range considered "consistent"
    
    // Performance stability
    public double? StabilityIndex { get; set; } // Measures how stable performance is over time
    public bool IsImprovingConsistency { get; set; }
    public double? ConsistencyTrend { get; set; }
    
    // Breakdown by performance area
    public IEnumerable<ConsistencyBreakdown> ConsistencyBreakdown { get; set; } = new List<ConsistencyBreakdown>();
}

public class ConsistencyBreakdown
{
    public string Category { get; set; } = null!; // "Scoring", "Putting", "Fairways", "Greens"
    public double ConsistencyScore { get; set; }
    public double StandardDeviation { get; set; }
    public string ConsistencyLevel { get; set; } = null!; // "Very Consistent", "Consistent", "Inconsistent", "Very Inconsistent"
}