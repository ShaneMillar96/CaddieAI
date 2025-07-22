# Statistics Models

**Version**: v1.0.0  
**Last Updated**: July 22, 2025

## Overview

This document describes all data models used in the Golf Statistics Service, including request DTOs, response DTOs, and internal service models. All models follow consistent naming conventions and include comprehensive validation.

## Request Models

### StatisticsRequestDto

Base request model for statistics endpoints with date range filtering.

```csharp
public class StatisticsRequestDto
{
    /// <summary>
    /// Start date for analysis period (optional)
    /// </summary>
    public DateOnly? StartDate { get; set; }

    /// <summary>
    /// End date for analysis period (optional)
    /// </summary>
    public DateOnly? EndDate { get; set; }
}
```

**Validation Rules:**
- `EndDate` must be greater than or equal to `StartDate` when both are provided
- Date range cannot exceed 2 years
- Dates cannot be in the future

### CourseComparisonRequestDto

Request model for course comparison analysis.

```csharp
public class CourseComparisonRequestDto : StatisticsRequestDto
{
    /// <summary>
    /// List of course IDs to compare (if null, compares all played courses)
    /// </summary>
    public IEnumerable<int>? CourseIds { get; set; }

    /// <summary>
    /// Minimum number of rounds required per course to include in comparison
    /// </summary>
    [Range(1, 50)]
    public int? MinimumRounds { get; set; } = 1;
}
```

### WeatherPerformanceRequestDto

Request model for weather-based performance analysis.

```csharp
public class WeatherPerformanceRequestDto : StatisticsRequestDto
{
    /// <summary>
    /// Minimum temperature filter (Celsius)
    /// </summary>
    [Range(-20, 50)]
    public decimal? MinTemperature { get; set; }

    /// <summary>
    /// Maximum temperature filter (Celsius)
    /// </summary>
    [Range(-20, 50)]
    public decimal? MaxTemperature { get; set; }

    /// <summary>
    /// Minimum wind speed filter (km/h)
    /// </summary>
    [Range(0, 100)]
    public decimal? MinWindSpeed { get; set; }

    /// <summary>
    /// Maximum wind speed filter (km/h)
    /// </summary>
    [Range(0, 100)]
    public decimal? MaxWindSpeed { get; set; }
}
```

## Response Models

### PerformanceAnalysisResponseDto

Comprehensive performance analysis response.

```csharp
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
    
    // Performance by Par (future enhancement)
    public double? Par3Average { get; set; }
    public double? Par4Average { get; set; }
    public double? Par5Average { get; set; }
}
```

### HandicapTrendResponseDto

Handicap progression and trend analysis response.

```csharp
public class HandicapTrendResponseDto
{
    public int UserId { get; set; }
    public decimal? CurrentHandicap { get; set; }
    public decimal? ProjectedHandicap { get; set; }
    public double? HandicapTrend { get; set; } // Positive = getting worse, Negative = improving
    public int MonthsAnalyzed { get; set; }
    
    public IEnumerable<HandicapDataPointDto> HandicapHistory { get; set; }
    
    // Recent performance indicators
    public double? Last5RoundsAverage { get; set; }
    public double? Last10RoundsAverage { get; set; }
    public decimal? HandicapChange30Days { get; set; }
    public decimal? HandicapChange90Days { get; set; }
    
    // Improvement metrics
    public bool IsImproving { get; set; }
    public double? ImprovementRate { get; set; } // Strokes per month
    public string? TrendDescription { get; set; } // "Rapidly Improving", "Stable", etc.
}

public class HandicapDataPointDto
{
    public DateOnly Date { get; set; }
    public decimal? Handicap { get; set; }
    public int? Score { get; set; }
    public double? ScoreToPar { get; set; }
}
```

### CoursePerformanceResponseDto

Course-specific performance analysis response.

```csharp
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
    public double? FamiliarityScore { get; set; } // Based on rounds played and recent performance
    public bool IsFavoriteCourse { get; set; }
    
    // Performance breakdown by hole type (future enhancement)
    public double? Par3Performance { get; set; }
    public double? Par4Performance { get; set; }
    public double? Par5Performance { get; set; }
    
    // Weather impact on this course (future enhancement)
    public double? AverageScoreGoodWeather { get; set; }
    public double? AverageScorePoorWeather { get; set; }
}
```

### ScoringTrendsResponseDto

Scoring trends and improvement patterns response.

```csharp
public class ScoringTrendsResponseDto
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
    public IEnumerable<MonthlyTrendDataDto> MonthlyTrends { get; set; }
    public IEnumerable<ScoreTrendDataPointDto> ScoreTrends { get; set; }
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
    public double? MovingAverage { get; set; } // 5-round moving average
}
```

### AdvancedMetricsResponseDto

Advanced golf metrics and consistency analysis response.

```csharp
public class AdvancedMetricsResponseDto
{
    public int UserId { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    
    // Consistency metrics (lower values = more consistent)
    public double? ScoreConsistency { get; set; }
    public double? PuttingConsistency { get; set; }
    public double? FairwayConsistency { get; set; }
    public double? GreenConsistency { get; set; }
    
    // Performance ratios (future enhancement)
    public double? ScoringEfficiency { get; set; }
    public double? RecoveryRate { get; set; }
    public double? PressurePerformance { get; set; }
    
    // Strokes gained approximation (future enhancement)
    public double? StrokesGainedPutting { get; set; }
    public double? StrokesGainedApproach { get; set; }
    public double? StrokesGainedTeeToGreen { get; set; }
    
    // Round completion metrics
    public double? AverageRoundTime { get; set; } // Minutes
    public int? RoundsCompleted { get; set; }
    public int? RoundsAbandoned { get; set; }
    public double? CompletionRate { get; set; } // Percentage
}
```

### CourseComparisonResponseDto

Course comparison analysis response.

```csharp
public class CourseComparisonResponseDto
{
    public int CourseId { get; set; }
    public string CourseName { get; set; }
    public int RoundsPlayed { get; set; }
    public double? AverageScore { get; set; }
    public double? AverageScoreToPar { get; set; }
    public int? BestScore { get; set; }
    public double? DifficultyRating { get; set; } // Relative to user's other courses
    public double? ImprovementRate { get; set; }
    public bool IsFavorite { get; set; }
}
```

### WeatherPerformanceResponseDto

Weather-based performance analysis response.

```csharp
public class WeatherPerformanceResponseDto
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
    
    public IEnumerable<WeatherDataPointDto> WeatherBreakdown { get; set; }
}

public class WeatherDataPointDto
{
    public string? Conditions { get; set; } // "Good Weather", "Poor Weather"
    public int RoundsPlayed { get; set; }
    public double? AverageScore { get; set; }
    public double? AverageTemperature { get; set; }
    public double? AverageWindSpeed { get; set; }
}
```

### RoundPerformanceResponseDto

Individual round performance details response.

```csharp
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
    
    // Performance rating for this round (future enhancement)
    public double? PerformanceRating { get; set; } // Compared to user's average
    public string? PerformanceCategory { get; set; } // "Excellent", "Good", "Average", "Poor"
}
```

### EnhancedRoundStatisticsResponseDto

Enhanced round statistics response with distribution analysis.

```csharp
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
```

### ConsistencyMetricsResponseDto

Consistency metrics and variability analysis response.

```csharp
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
    public double? StreakThreshold { get; set; } // Score range considered "consistent"
    
    // Performance stability
    public double? StabilityIndex { get; set; } // Measures how stable performance is over time
    public bool IsImprovingConsistency { get; set; }
    public double? ConsistencyTrend { get; set; }
    
    // Breakdown by performance area
    public IEnumerable<ConsistencyBreakdownDto> ConsistencyBreakdown { get; set; }
}

public class ConsistencyBreakdownDto
{
    public string Category { get; set; } // "Scoring", "Putting", "Fairways", "Greens"
    public double ConsistencyScore { get; set; } // 0-100 scale
    public double StandardDeviation { get; set; }
    public string ConsistencyLevel { get; set; } // "Very Consistent", "Consistent", "Inconsistent", "Very Inconsistent"
}
```

## Internal Service Models

### PerformanceAnalysisModel

Core performance analysis model used by the service layer.

```csharp
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
    
    // Performance by Par (future enhancement)
    public double? Par3Average { get; set; }
    public double? Par4Average { get; set; }
    public double? Par5Average { get; set; }
}
```

## Model Conventions

### Naming Conventions
- **Request DTOs**: End with `RequestDto`
- **Response DTOs**: End with `ResponseDto`  
- **Service Models**: End with `Model`
- **Data Points**: End with `DataPoint` or `DataPointDto`

### Data Types
- **Scores**: `int?` for total scores, `double?` for averages
- **Percentages**: `double?` with values 0-100
- **Dates**: `DateOnly` for date-only fields, `DateTime` for timestamps
- **Trends**: `double?` where negative = improving, positive = declining
- **Consistency**: `double?` with 0-100 scale (higher = more consistent)
- **IDs**: `int` for entity identifiers

### Nullable Guidelines
- Most statistical fields are nullable (`double?`, `int?`) to handle cases with insufficient data
- Required fields like `UserId` are non-nullable
- Collection properties default to empty collections, not null

### Validation Attributes
- `[Range]` for numeric constraints
- Date validation handled at service layer
- Custom validation for complex business rules

## AutoMapper Configuration

All models use AutoMapper for conversion between service models and DTOs:

```csharp
CreateMap<PerformanceAnalysisModel, PerformanceAnalysisResponseDto>();
CreateMap<HandicapTrendModel, HandicapTrendResponseDto>();
CreateMap<HandicapDataPoint, HandicapDataPointDto>();
// ... additional mappings for all models
```

## Future Enhancements

### Planned Model Extensions
- **Strokes Gained Fields**: PGA-style strokes gained analysis
- **Course Difficulty**: More sophisticated difficulty calculations
- **Weather Details**: Precipitation, humidity, and wind direction
- **Performance Categories**: Automated performance categorization
- **Peer Comparison**: Anonymous comparison with similar handicap golfers

### Model Versioning
- Models follow semantic versioning
- Breaking changes increment major version
- New optional fields increment minor version
- Bug fixes increment patch version

---

*Last Updated: July 22, 2025*