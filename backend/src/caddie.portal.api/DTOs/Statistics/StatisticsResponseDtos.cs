namespace caddie.portal.api.DTOs.Statistics;

/// <summary>
/// Response DTO for comprehensive performance analysis
/// </summary>
public class PerformanceAnalysisResponseDto
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
    public double? ScoringTrend { get; set; }
    
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
    public double? ConsistencyRating { get; set; }
    public int? RoundsUnderPar { get; set; }
    public int? RoundsOverPar { get; set; }
    
    // Performance by Par
    public double? Par3Average { get; set; }
    public double? Par4Average { get; set; }
    public double? Par5Average { get; set; }
}

/// <summary>
/// Response DTO for handicap trend analysis
/// </summary>
public class HandicapTrendResponseDto
{
    public int UserId { get; set; }
    public decimal? CurrentHandicap { get; set; }
    public decimal? ProjectedHandicap { get; set; }
    public double? HandicapTrend { get; set; }
    public int MonthsAnalyzed { get; set; }
    
    public IEnumerable<HandicapDataPointDto> HandicapHistory { get; set; } = new List<HandicapDataPointDto>();
    
    // Recent performance indicators
    public double? Last5RoundsAverage { get; set; }
    public double? Last10RoundsAverage { get; set; }
    public decimal? HandicapChange30Days { get; set; }
    public decimal? HandicapChange90Days { get; set; }
    
    // Improvement metrics
    public bool IsImproving { get; set; }
    public double? ImprovementRate { get; set; }
    public string? TrendDescription { get; set; }
}

public class HandicapDataPointDto
{
    public DateOnly Date { get; set; }
    public decimal? Handicap { get; set; }
    public int? Score { get; set; }
    public double? ScoreToPar { get; set; }
}

/// <summary>
/// Response DTO for course-specific performance
/// </summary>
public class CoursePerformanceResponseDto
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
    public double? FamiliarityScore { get; set; }
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
/// Response DTO for scoring trends
/// </summary>
public class ScoringTrendsResponseDto
{
    public int UserId { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    
    // Trend analysis
    public double? OverallTrend { get; set; }
    public double? TrendConfidence { get; set; }
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
    public IEnumerable<MonthlyTrendDataDto> MonthlyTrends { get; set; } = new List<MonthlyTrendDataDto>();
    public IEnumerable<ScoreTrendDataPointDto> ScoreTrends { get; set; } = new List<ScoreTrendDataPointDto>();
}

public class MonthlyTrendDataDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public double? AverageScore { get; set; }
    public int RoundsPlayed { get; set; }
    public double? ImprovementFromPreviousMonth { get; set; }
}

public class ScoreTrendDataPointDto
{
    public DateOnly RoundDate { get; set; }
    public int Score { get; set; }
    public double ScoreToPar { get; set; }
    public double? MovingAverage { get; set; }
}

/// <summary>
/// Response DTO for advanced golf metrics
/// </summary>
public class AdvancedMetricsResponseDto
{
    public int UserId { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    
    // Consistency metrics
    public double? ScoreConsistency { get; set; }
    public double? PuttingConsistency { get; set; }
    public double? FairwayConsistency { get; set; }
    public double? GreenConsistency { get; set; }
    
    // Performance ratios
    public double? ScoringEfficiency { get; set; }
    public double? RecoveryRate { get; set; }
    public double? PressurePerformance { get; set; }
    
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
/// Response DTO for course comparison
/// </summary>
public class CourseComparisonResponseDto
{
    public int CourseId { get; set; }
    public string CourseName { get; set; } = null!;
    public int RoundsPlayed { get; set; }
    public double? AverageScore { get; set; }
    public double? AverageScoreToPar { get; set; }
    public int? BestScore { get; set; }
    public double? DifficultyRating { get; set; }
    public double? ImprovementRate { get; set; }
    public bool IsFavorite { get; set; }
}

/// <summary>
/// Response DTO for weather performance
/// </summary>
public class WeatherPerformanceResponseDto
{
    public int UserId { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    
    // Temperature performance
    public double? AverageScoreGoodWeather { get; set; }
    public double? AverageScoreBadWeather { get; set; }
    public double? TemperatureImpact { get; set; }
    
    // Wind performance  
    public double? AverageScoreLowWind { get; set; }
    public double? AverageScoreHighWind { get; set; }
    public double? WindImpact { get; set; }
    
    // Weather adaptation
    public double? WeatherAdaptability { get; set; }
    public string? PreferredConditions { get; set; }
    
    public IEnumerable<WeatherDataPointDto> WeatherBreakdown { get; set; } = new List<WeatherDataPointDto>();
}

public class WeatherDataPointDto
{
    public string? Conditions { get; set; }
    public int RoundsPlayed { get; set; }
    public double? AverageScore { get; set; }
    public double? AverageTemperature { get; set; }
    public double? AverageWindSpeed { get; set; }
}

/// <summary>
/// Response DTO for individual round performance
/// </summary>
public class RoundPerformanceResponseDto
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
    public double? PerformanceRating { get; set; }
    public string? PerformanceCategory { get; set; }
}

/// <summary>
/// Response DTO for enhanced round statistics
/// </summary>
public class EnhancedRoundStatisticsResponseDto
{
    // Base statistics
    public int TotalRounds { get; set; }
    public double? AverageScore { get; set; }
    public int? BestScore { get; set; }
    public int? WorstScore { get; set; }
    public double? AveragePutts { get; set; }
    public double? AverageFairwaysHit { get; set; }
    public double? AverageGreensInRegulation { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    
    // Enhanced metrics
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
/// Response DTO for consistency metrics
/// </summary>
public class ConsistencyMetricsResponseDto
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
    public double? StreakThreshold { get; set; }
    
    // Performance stability
    public double? StabilityIndex { get; set; }
    public bool IsImprovingConsistency { get; set; }
    public double? ConsistencyTrend { get; set; }
    
    // Breakdown by performance area
    public IEnumerable<ConsistencyBreakdownDto> ConsistencyBreakdown { get; set; } = new List<ConsistencyBreakdownDto>();
}

public class ConsistencyBreakdownDto
{
    public string Category { get; set; } = null!;
    public double ConsistencyScore { get; set; }
    public double StandardDeviation { get; set; }
    public string ConsistencyLevel { get; set; } = null!;
}