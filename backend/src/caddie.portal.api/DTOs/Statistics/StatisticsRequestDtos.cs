using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.Statistics;

/// <summary>
/// Base request DTO for statistics with date range filtering
/// </summary>
public class StatisticsRequestDto
{
    /// <summary>
    /// Start date for analysis period
    /// </summary>
    public DateOnly? StartDate { get; set; }

    /// <summary>
    /// End date for analysis period
    /// </summary>
    public DateOnly? EndDate { get; set; }

    /// <summary>
    /// Validate that end date is not before start date
    /// </summary>
    public bool IsValidDateRange => !StartDate.HasValue || !EndDate.HasValue || EndDate >= StartDate;
}

/// <summary>
/// Request DTO for course comparison analysis
/// </summary>
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

/// <summary>
/// Request DTO for weather performance analysis
/// </summary>
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

    /// <summary>
    /// Validate temperature range
    /// </summary>
    public bool IsValidTemperatureRange => !MinTemperature.HasValue || !MaxTemperature.HasValue || MaxTemperature >= MinTemperature;

    /// <summary>
    /// Validate wind speed range
    /// </summary>
    public bool IsValidWindSpeedRange => !MinWindSpeed.HasValue || !MaxWindSpeed.HasValue || MaxWindSpeed >= MinWindSpeed;
}

/// <summary>
/// Request DTO for handicap trend analysis
/// </summary>
public class HandicapTrendRequestDto
{
    /// <summary>
    /// Number of months to analyze (default: 6, max: 24)
    /// </summary>
    [Range(1, 24)]
    public int MonthsBack { get; set; } = 6;

    /// <summary>
    /// Include projected handicap calculation
    /// </summary>
    public bool IncludeProjection { get; set; } = true;
}

/// <summary>
/// Request DTO for round performance history
/// </summary>
public class RoundPerformanceHistoryRequestDto
{
    /// <summary>
    /// Maximum number of recent rounds to retrieve (max: 50)
    /// </summary>
    [Range(1, 50)]
    public int Limit { get; set; } = 20;

    /// <summary>
    /// Filter by specific course ID
    /// </summary>
    public int? CourseId { get; set; }

    /// <summary>
    /// Include performance ratings
    /// </summary>
    public bool IncludePerformanceRatings { get; set; } = true;
}