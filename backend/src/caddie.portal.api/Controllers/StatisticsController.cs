using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AutoMapper;
using System.Security.Claims;
using caddie.portal.api.DTOs.Statistics;
using caddie.portal.api.DTOs.Common;
using caddie.portal.services.Interfaces;

namespace caddie.portal.api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class StatisticsController : ControllerBase
{
    private readonly IGolfStatisticsService _statisticsService;
    private readonly IMapper _mapper;
    private readonly ILogger<StatisticsController> _logger;

    public StatisticsController(
        IGolfStatisticsService statisticsService,
        IMapper mapper,
        ILogger<StatisticsController> logger)
    {
        _statisticsService = statisticsService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get comprehensive performance analysis for the current user
    /// </summary>
    /// <param name="request">Performance analysis request parameters</param>
    /// <returns>Comprehensive performance analysis</returns>
    [HttpPost("performance-analysis")]
    [ProducesResponseType(typeof(ApiResponse<PerformanceAnalysisResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPerformanceAnalysis([FromBody] StatisticsRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            var userId = GetCurrentUserId();
            var analysis = await _statisticsService.GetPerformanceAnalysisAsync(userId, request.StartDate, request.EndDate);

            if (analysis == null)
            {
                return NotFound(ApiResponse.ErrorResponse("No performance data found for the specified period", "NO_DATA"));
            }

            var responseDto = _mapper.Map<PerformanceAnalysisResponseDto>(analysis);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Performance analysis retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting performance analysis for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving performance analysis", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get handicap trend analysis and projections
    /// </summary>
    /// <param name="monthsBack">Number of months to analyze (default: 6, max: 24)</param>
    /// <returns>Handicap trend analysis</returns>
    [HttpGet("handicap-trend")]
    [ProducesResponseType(typeof(ApiResponse<HandicapTrendResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetHandicapTrend([FromQuery] int monthsBack = 6)
    {
        try
        {
            if (monthsBack < 1 || monthsBack > 24)
            {
                return BadRequest(ApiResponse.ErrorResponse("Months back must be between 1 and 24", "INVALID_PARAMETER"));
            }

            var userId = GetCurrentUserId();
            var trend = await _statisticsService.GetHandicapTrendAsync(userId, monthsBack);

            if (trend == null)
            {
                return NotFound(ApiResponse.ErrorResponse("No handicap data found for the specified period", "NO_DATA"));
            }

            var responseDto = _mapper.Map<HandicapTrendResponseDto>(trend);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Handicap trend retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting handicap trend for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving handicap trend", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get performance analysis by specific course
    /// </summary>
    /// <param name="courseId">Course ID for analysis</param>
    /// <param name="request">Date range parameters</param>
    /// <returns>Course-specific performance analysis</returns>
    [HttpPost("course-performance/{courseId}")]
    [ProducesResponseType(typeof(ApiResponse<CoursePerformanceResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCoursePerformance(int courseId, [FromBody] StatisticsRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            var userId = GetCurrentUserId();
            var performance = await _statisticsService.GetCoursePerformanceAsync(userId, courseId, request.StartDate, request.EndDate);

            if (performance == null)
            {
                return NotFound(ApiResponse.ErrorResponse("No performance data found for the specified course and period", "NO_DATA"));
            }

            var responseDto = _mapper.Map<CoursePerformanceResponseDto>(performance);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Course performance retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting course performance for user {UserId} and course {CourseId}", GetCurrentUserId(), courseId);
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving course performance", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get scoring trends and improvement patterns
    /// </summary>
    /// <param name="request">Scoring trends request parameters</param>
    /// <returns>Scoring trends analysis</returns>
    [HttpPost("scoring-trends")]
    [ProducesResponseType(typeof(ApiResponse<ScoringTrendsResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetScoringTrends([FromBody] StatisticsRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            var userId = GetCurrentUserId();
            var trends = await _statisticsService.GetScoringTrendsAsync(userId, request.StartDate, request.EndDate);

            if (trends == null)
            {
                return NotFound(ApiResponse.ErrorResponse("No scoring data found for the specified period", "NO_DATA"));
            }

            var responseDto = _mapper.Map<ScoringTrendsResponseDto>(trends);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Scoring trends retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting scoring trends for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving scoring trends", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get advanced golf metrics and consistency analysis
    /// </summary>
    /// <param name="request">Advanced metrics request parameters</param>
    /// <returns>Advanced golf metrics</returns>
    [HttpPost("advanced-metrics")]
    [ProducesResponseType(typeof(ApiResponse<AdvancedMetricsResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAdvancedMetrics([FromBody] StatisticsRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            var userId = GetCurrentUserId();
            var metrics = await _statisticsService.GetAdvancedMetricsAsync(userId, request.StartDate, request.EndDate);

            if (metrics == null)
            {
                return NotFound(ApiResponse.ErrorResponse("No metrics data found for the specified period", "NO_DATA"));
            }

            var responseDto = _mapper.Map<AdvancedMetricsResponseDto>(metrics);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Advanced metrics retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting advanced metrics for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving advanced metrics", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get comparative performance across multiple courses
    /// </summary>
    /// <param name="request">Course comparison request parameters</param>
    /// <returns>Course comparison analysis</returns>
    [HttpPost("course-comparison")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CourseComparisonResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCourseComparison([FromBody] CourseComparisonRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            var userId = GetCurrentUserId();
            var comparison = await _statisticsService.GetCourseComparisonAsync(userId, request.CourseIds, request.StartDate, request.EndDate);

            var responseDtos = _mapper.Map<IEnumerable<CourseComparisonResponseDto>>(comparison);
            return Ok(ApiResponse.SuccessResponse(responseDtos, "Course comparison retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting course comparison for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving course comparison", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get performance analysis filtered by weather conditions
    /// </summary>
    /// <param name="request">Weather performance request parameters</param>
    /// <returns>Weather-based performance analysis</returns>
    [HttpPost("weather-performance")]
    [ProducesResponseType(typeof(ApiResponse<WeatherPerformanceResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetWeatherPerformance([FromBody] WeatherPerformanceRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            var userId = GetCurrentUserId();
            var temperatureRange = request.MinTemperature.HasValue && request.MaxTemperature.HasValue ? 
                (request.MinTemperature, request.MaxTemperature) : ((decimal?, decimal?)?)null;
            var windSpeedRange = request.MinWindSpeed.HasValue && request.MaxWindSpeed.HasValue ? 
                (request.MinWindSpeed, request.MaxWindSpeed) : ((decimal?, decimal?)?)null;

            var performance = await _statisticsService.GetWeatherPerformanceAsync(userId, temperatureRange, windSpeedRange, request.StartDate, request.EndDate);

            if (performance == null)
            {
                return NotFound(ApiResponse.ErrorResponse("No weather performance data found for the specified period", "NO_DATA"));
            }

            var responseDto = _mapper.Map<WeatherPerformanceResponseDto>(performance);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Weather performance retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting weather performance for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving weather performance", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get round-by-round performance statistics
    /// </summary>
    /// <param name="limit">Maximum number of recent rounds to analyze (default: 20, max: 50)</param>
    /// <returns>Round performance history</returns>
    [HttpGet("round-performance-history")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<RoundPerformanceResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetRoundPerformanceHistory([FromQuery] int limit = 20)
    {
        try
        {
            if (limit < 1 || limit > 50)
            {
                return BadRequest(ApiResponse.ErrorResponse("Limit must be between 1 and 50", "INVALID_PARAMETER"));
            }

            var userId = GetCurrentUserId();
            var history = await _statisticsService.GetRoundPerformanceHistoryAsync(userId, limit);

            var responseDtos = _mapper.Map<IEnumerable<RoundPerformanceResponseDto>>(history);
            return Ok(ApiResponse.SuccessResponse(responseDtos, "Round performance history retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting round performance history for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving round performance history", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get enhanced round statistics (extends basic RoundStatistics)
    /// </summary>
    /// <param name="request">Enhanced statistics request parameters</param>
    /// <returns>Enhanced round statistics</returns>
    [HttpPost("enhanced-statistics")]
    [ProducesResponseType(typeof(ApiResponse<EnhancedRoundStatisticsResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEnhancedStatistics([FromBody] StatisticsRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            var userId = GetCurrentUserId();
            var statistics = await _statisticsService.GetEnhancedRoundStatisticsAsync(userId, request.StartDate, request.EndDate);

            if (statistics == null)
            {
                return NotFound(ApiResponse.ErrorResponse("No statistics data found for the specified period", "NO_DATA"));
            }

            var responseDto = _mapper.Map<EnhancedRoundStatisticsResponseDto>(statistics);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Enhanced statistics retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting enhanced statistics for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving enhanced statistics", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get consistency metrics and variability analysis
    /// </summary>
    /// <param name="request">Consistency metrics request parameters</param>
    /// <returns>Consistency metrics analysis</returns>
    [HttpPost("consistency-metrics")]
    [ProducesResponseType(typeof(ApiResponse<ConsistencyMetricsResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetConsistencyMetrics([FromBody] StatisticsRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            var userId = GetCurrentUserId();
            var metrics = await _statisticsService.GetConsistencyMetricsAsync(userId, request.StartDate, request.EndDate);

            if (metrics == null)
            {
                return NotFound(ApiResponse.ErrorResponse("No consistency data found for the specified period", "NO_DATA"));
            }

            var responseDto = _mapper.Map<ConsistencyMetricsResponseDto>(metrics);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Consistency metrics retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting consistency metrics for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving consistency metrics", "INTERNAL_ERROR"));
        }
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return userId;
    }
}