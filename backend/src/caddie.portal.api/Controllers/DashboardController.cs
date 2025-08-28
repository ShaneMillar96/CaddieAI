using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AutoMapper;
using System.Security.Claims;
using caddie.portal.api.DTOs.Dashboard;
using caddie.portal.api.DTOs.Common;
using caddie.portal.services.Interfaces;

namespace caddie.portal.api.Controllers;

/// <summary>
/// Controller for dashboard analytics and performance insights
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly IMapper _mapper;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(
        IDashboardService dashboardService,
        IMapper mapper,
        ILogger<DashboardController> logger)
    {
        _dashboardService = dashboardService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get complete dashboard overview with all analytics data for the current user
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Complete dashboard overview with user stats, recent rounds, insights, and analytics</returns>
    [HttpGet("overview")]
    [ProducesResponseType(typeof(ApiResponse<DashboardOverviewResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetDashboardOverview(CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                _logger.LogWarning("Dashboard overview requested by unauthenticated user");
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));
            }

            _logger.LogDebug("Getting dashboard overview for user {UserId}", userId.Value);

            var startTime = DateTime.UtcNow;
            var dashboardData = await _dashboardService.GetDashboardOverviewAsync(userId.Value, cancellationToken);
            var duration = DateTime.UtcNow - startTime;

            var responseDto = _mapper.Map<DashboardOverviewResponse>(dashboardData);

            _logger.LogInformation("Dashboard overview retrieved successfully for user {UserId} in {Duration}ms", 
                userId.Value, duration.TotalMilliseconds);

            return Ok(ApiResponse.SuccessResponse(responseDto, "Dashboard overview retrieved successfully"));
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Dashboard overview request was cancelled for user {UserId}", GetCurrentUserId());
            return StatusCode(499, ApiResponse.ErrorResponse("Request was cancelled", "REQUEST_CANCELLED"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving dashboard overview for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve dashboard overview", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get dashboard overview for a specific user (admin or specific access only)
    /// </summary>
    /// <param name="userId">Target user ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Complete dashboard overview for the specified user</returns>
    [HttpGet("overview/{userId:int}")]
    [ProducesResponseType(typeof(ApiResponse<DashboardOverviewResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetDashboardOverviewForUser(int userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));
            }

            // Check if current user can access other user's dashboard
            // For now, users can only access their own dashboard
            if (currentUserId.Value != userId)
            {
                _logger.LogWarning("User {CurrentUserId} attempted to access dashboard for user {TargetUserId}", 
                    currentUserId.Value, userId);
                return Forbid();
            }

            _logger.LogDebug("Getting dashboard overview for user {UserId}", userId);

            var startTime = DateTime.UtcNow;
            var dashboardData = await _dashboardService.GetDashboardOverviewAsync(userId, cancellationToken);
            var duration = DateTime.UtcNow - startTime;

            var responseDto = _mapper.Map<DashboardOverviewResponse>(dashboardData);

            _logger.LogInformation("Dashboard overview retrieved successfully for user {UserId} in {Duration}ms", 
                userId, duration.TotalMilliseconds);

            return Ok(ApiResponse.SuccessResponse(responseDto, "Dashboard overview retrieved successfully"));
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Dashboard overview request was cancelled for user {UserId}", userId);
            return StatusCode(499, ApiResponse.ErrorResponse("Request was cancelled", "REQUEST_CANCELLED"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving dashboard overview for user {UserId}", userId);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve dashboard overview", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Refresh AI-generated performance insights for the current user
    /// </summary>
    /// <param name="request">Refresh insights request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated performance insights</returns>
    [HttpPost("refresh-insights")]
    [ProducesResponseType(typeof(ApiResponse<RefreshInsightsResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> RefreshInsights([FromBody] RefreshInsightsRequestDto? request = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));
            }

            var forceRefresh = request?.ForceRefresh ?? false;
            
            _logger.LogInformation("Refreshing insights for user {UserId}, forceRefresh: {ForceRefresh}", 
                userId.Value, forceRefresh);

            var startTime = DateTime.UtcNow;
            var refreshResult = await _dashboardService.RefreshInsightsAsync(userId.Value, forceRefresh, cancellationToken);
            var duration = DateTime.UtcNow - startTime;

            var responseDto = _mapper.Map<RefreshInsightsResponseDto>(refreshResult);

            _logger.LogInformation("Insights refresh completed for user {UserId} in {Duration}ms, Success: {Success}", 
                userId.Value, duration.TotalMilliseconds, refreshResult.Success);

            if (refreshResult.Success)
            {
                return Ok(ApiResponse.SuccessResponse(responseDto, "Insights refreshed successfully"));
            }
            else
            {
                return BadRequest(ApiResponse.ErrorResponse(refreshResult.Message, "REFRESH_FAILED"));
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Insights refresh request was cancelled for user {UserId}", GetCurrentUserId());
            return StatusCode(499, ApiResponse.ErrorResponse("Request was cancelled", "REQUEST_CANCELLED"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing insights for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to refresh insights", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Refresh insights for a specific user
    /// </summary>
    /// <param name="userId">Target user ID</param>
    /// <param name="request">Refresh insights request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated performance insights for the specified user</returns>
    [HttpPost("refresh-insights/{userId:int}")]
    [ProducesResponseType(typeof(ApiResponse<RefreshInsightsResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> RefreshInsightsForUser(int userId, [FromBody] RefreshInsightsRequestDto? request = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));
            }

            // Check if current user can refresh insights for other users
            if (currentUserId.Value != userId)
            {
                _logger.LogWarning("User {CurrentUserId} attempted to refresh insights for user {TargetUserId}", 
                    currentUserId.Value, userId);
                return Forbid();
            }

            var forceRefresh = request?.ForceRefresh ?? false;
            
            _logger.LogInformation("Refreshing insights for user {UserId}, forceRefresh: {ForceRefresh}", 
                userId, forceRefresh);

            var startTime = DateTime.UtcNow;
            var refreshResult = await _dashboardService.RefreshInsightsAsync(userId, forceRefresh, cancellationToken);
            var duration = DateTime.UtcNow - startTime;

            var responseDto = _mapper.Map<RefreshInsightsResponseDto>(refreshResult);

            _logger.LogInformation("Insights refresh completed for user {UserId} in {Duration}ms, Success: {Success}", 
                userId, duration.TotalMilliseconds, refreshResult.Success);

            if (refreshResult.Success)
            {
                return Ok(ApiResponse.SuccessResponse(responseDto, "Insights refreshed successfully"));
            }
            else
            {
                return BadRequest(ApiResponse.ErrorResponse(refreshResult.Message, "REFRESH_FAILED"));
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Insights refresh request was cancelled for user {UserId}", userId);
            return StatusCode(499, ApiResponse.ErrorResponse("Request was cancelled", "REQUEST_CANCELLED"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing insights for user {UserId}", userId);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to refresh insights", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get user statistics only
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>User statistics and performance summary</returns>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(ApiResponse<UserStatsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetUserStats(CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));
            }

            var userStats = await _dashboardService.GetUserStatisticsAsync(userId.Value, cancellationToken);
            var responseDto = _mapper.Map<UserStatsDto>(userStats);

            return Ok(ApiResponse.SuccessResponse(responseDto, "User statistics retrieved successfully"));
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("User stats request was cancelled for user {UserId}", GetCurrentUserId());
            return StatusCode(499, ApiResponse.ErrorResponse("Request was cancelled", "REQUEST_CANCELLED"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user stats for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve user statistics", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get recent rounds only
    /// </summary>
    /// <param name="limit">Maximum number of rounds to return (default: 10, max: 50)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of recent rounds</returns>
    [HttpGet("recent-rounds")]
    [ProducesResponseType(typeof(ApiResponse<List<RecentRoundDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetRecentRounds([FromQuery] int limit = 10, CancellationToken cancellationToken = default)
    {
        try
        {
            if (limit < 1 || limit > 50)
            {
                return BadRequest(ApiResponse.ErrorResponse("Limit must be between 1 and 50", "INVALID_LIMIT"));
            }

            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));
            }

            var recentRounds = await _dashboardService.GetRecentRoundsAsync(userId.Value, limit, cancellationToken);
            var responseDto = _mapper.Map<List<RecentRoundDto>>(recentRounds);

            return Ok(ApiResponse.SuccessResponse(responseDto, "Recent rounds retrieved successfully"));
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Recent rounds request was cancelled for user {UserId}", GetCurrentUserId());
            return StatusCode(499, ApiResponse.ErrorResponse("Request was cancelled", "REQUEST_CANCELLED"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving recent rounds for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve recent rounds", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get performance insights only
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Performance insights and recommendations</returns>
    [HttpGet("insights")]
    [ProducesResponseType(typeof(ApiResponse<PerformanceInsightsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPerformanceInsights(CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));
            }

            var insights = await _dashboardService.GetPerformanceInsightsAsync(userId.Value, cancellationToken);
            var responseDto = _mapper.Map<PerformanceInsightsDto>(insights);

            return Ok(ApiResponse.SuccessResponse(responseDto, "Performance insights retrieved successfully"));
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Performance insights request was cancelled for user {UserId}", GetCurrentUserId());
            return StatusCode(499, ApiResponse.ErrorResponse("Request was cancelled", "REQUEST_CANCELLED"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving performance insights for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve performance insights", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get shot analytics only
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Shot analytics including club usage and accuracy metrics</returns>
    [HttpGet("shot-analytics")]
    [ProducesResponseType(typeof(ApiResponse<ShotAnalyticsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetShotAnalytics(CancellationToken cancellationToken = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));
            }

            var shotAnalytics = await _dashboardService.GetShotAnalyticsAsync(userId.Value, cancellationToken);
            var responseDto = _mapper.Map<ShotAnalyticsDto>(shotAnalytics);

            return Ok(ApiResponse.SuccessResponse(responseDto, "Shot analytics retrieved successfully"));
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Shot analytics request was cancelled for user {UserId}", GetCurrentUserId());
            return StatusCode(499, ApiResponse.ErrorResponse("Request was cancelled", "REQUEST_CANCELLED"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving shot analytics for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve shot analytics", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get current user ID from JWT claims
    /// </summary>
    /// <returns>User ID or null if not authenticated</returns>
    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}