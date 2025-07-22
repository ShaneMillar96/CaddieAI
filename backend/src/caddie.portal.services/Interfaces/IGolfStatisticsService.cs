using caddie.portal.services.Models;

namespace caddie.portal.services.Interfaces;

/// <summary>
/// Service for calculating comprehensive golf statistics and performance analytics
/// </summary>
public interface IGolfStatisticsService
{
    /// <summary>
    /// Get comprehensive performance analysis for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="startDate">Start date for analysis period</param>
    /// <param name="endDate">End date for analysis period</param>
    Task<PerformanceAnalysisModel?> GetPerformanceAnalysisAsync(int userId, DateOnly? startDate = null, DateOnly? endDate = null);

    /// <summary>
    /// Get handicap trend analysis and projections
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="monthsBack">Number of months to analyze (default: 6)</param>
    Task<HandicapTrendModel?> GetHandicapTrendAsync(int userId, int monthsBack = 6);

    /// <summary>
    /// Get performance analysis by specific course
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="courseId">Course ID for analysis</param>
    /// <param name="startDate">Start date for analysis period</param>
    /// <param name="endDate">End date for analysis period</param>
    Task<CoursePerformanceModel?> GetCoursePerformanceAsync(int userId, int courseId, DateOnly? startDate = null, DateOnly? endDate = null);

    /// <summary>
    /// Get scoring trends and improvement patterns
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="startDate">Start date for analysis period</param>
    /// <param name="endDate">End date for analysis period</param>
    Task<ScoringTrendsModel?> GetScoringTrendsAsync(int userId, DateOnly? startDate = null, DateOnly? endDate = null);

    /// <summary>
    /// Get advanced golf metrics and consistency analysis
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="startDate">Start date for analysis period</param>
    /// <param name="endDate">End date for analysis period</param>
    Task<AdvancedMetricsModel?> GetAdvancedMetricsAsync(int userId, DateOnly? startDate = null, DateOnly? endDate = null);

    /// <summary>
    /// Get comparative performance across multiple courses
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="courseIds">List of course IDs to compare (if null, compares all played courses)</param>
    /// <param name="startDate">Start date for analysis period</param>
    /// <param name="endDate">End date for analysis period</param>
    Task<IEnumerable<CourseComparisonModel>> GetCourseComparisonAsync(int userId, IEnumerable<int>? courseIds = null, DateOnly? startDate = null, DateOnly? endDate = null);

    /// <summary>
    /// Get performance analysis filtered by weather conditions
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="temperatureRange">Temperature range filter (min, max in Celsius)</param>
    /// <param name="windSpeedRange">Wind speed range filter (min, max in km/h)</param>
    /// <param name="startDate">Start date for analysis period</param>
    /// <param name="endDate">End date for analysis period</param>
    Task<WeatherPerformanceModel?> GetWeatherPerformanceAsync(int userId, (decimal? min, decimal? max)? temperatureRange = null, (decimal? min, decimal? max)? windSpeedRange = null, DateOnly? startDate = null, DateOnly? endDate = null);

    /// <summary>
    /// Get round-by-round performance statistics
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="limit">Maximum number of recent rounds to analyze</param>
    Task<IEnumerable<RoundPerformanceModel>> GetRoundPerformanceHistoryAsync(int userId, int limit = 20);

    /// <summary>
    /// Get enhanced round statistics (extends basic RoundStatisticsModel)
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="startDate">Start date for statistics period</param>
    /// <param name="endDate">End date for statistics period</param>
    Task<EnhancedRoundStatisticsModel?> GetEnhancedRoundStatisticsAsync(int userId, DateOnly? startDate = null, DateOnly? endDate = null);

    /// <summary>
    /// Get consistency metrics and variability analysis
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="startDate">Start date for analysis period</param>
    /// <param name="endDate">End date for analysis period</param>
    Task<ConsistencyMetricsModel?> GetConsistencyMetricsAsync(int userId, DateOnly? startDate = null, DateOnly? endDate = null);
}