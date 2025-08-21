using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AutoMapper;
using System.Security.Claims;
using caddie.portal.api.DTOs.SwingAnalysis;
using caddie.portal.api.DTOs.Common;
using caddie.portal.api.Mapping;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;

namespace caddie.portal.api.Controllers;

/// <summary>
/// API Controller for swing analysis operations
/// </summary>
[ApiController]
[Route("api/swing-analysis")]
[Authorize]
[Produces("application/json")]
public class SwingAnalysisController : ControllerBase
{
    private readonly ISwingAnalysisService _swingAnalysisService;
    private readonly IMapper _mapper;
    private readonly ILogger<SwingAnalysisController> _logger;

    public SwingAnalysisController(
        ISwingAnalysisService swingAnalysisService,
        IMapper mapper,
        ILogger<SwingAnalysisController> logger)
    {
        _swingAnalysisService = swingAnalysisService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get swing analyses for a user's round
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Round ID</param>
    /// <returns>Collection of swing analyses for the round</returns>
    [HttpGet("user/{userId:int}/round/{roundId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<SwingAnalysisResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetSwingAnalysesByRound(int userId, int roundId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            // Verify user can only access their own data
            if (currentUserId.Value != userId)
                return Forbid();

            var swingAnalyses = await _swingAnalysisService.GetByUserIdAndRoundIdAsync(userId, roundId);
            var responseDto = _mapper.Map<IEnumerable<SwingAnalysisResponseDto>>(swingAnalyses);

            return Ok(ApiResponse.SuccessResponse(responseDto, "Swing analyses retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving swing analyses for user {UserId} and round {RoundId}", userId, roundId);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve swing analyses", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Create a new swing analysis
    /// </summary>
    /// <param name="request">Swing analysis creation request</param>
    /// <returns>Created swing analysis</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<SwingAnalysisResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateSwingAnalysis([FromBody] CreateSwingAnalysisRequestDto request)
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

            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            // Verify user can only create swing analyses for themselves
            if (currentUserId.Value != request.UserId)
                return Forbid();

            var model = _mapper.Map<CreateSwingAnalysisModel>(request);
            var createdSwingAnalysis = await _swingAnalysisService.CreateAsync(model);
            var responseDto = _mapper.Map<SwingAnalysisResponseDto>(createdSwingAnalysis);

            return CreatedAtAction(nameof(GetSwingAnalysisById), new { id = createdSwingAnalysis.Id }, 
                ApiResponse.SuccessResponse(responseDto, "Swing analysis created successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse.ErrorResponse(ex.Message, "VALIDATION_ERROR"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating swing analysis for user {UserId}", request.UserId);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to create swing analysis", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get swing analysis by ID
    /// </summary>
    /// <param name="id">Swing analysis ID</param>
    /// <returns>Swing analysis details</returns>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<SwingAnalysisResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetSwingAnalysisById(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            // Verify user has access to this swing analysis
            if (!await _swingAnalysisService.HasUserAccessAsync(id, currentUserId.Value))
                return Forbid();

            var swingAnalysis = await _swingAnalysisService.GetByIdAsync(id);
            if (swingAnalysis == null)
                return NotFound(ApiResponse.ErrorResponse("Swing analysis not found", "SWING_ANALYSIS_NOT_FOUND"));

            var responseDto = _mapper.Map<SwingAnalysisResponseDto>(swingAnalysis);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Swing analysis retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving swing analysis {SwingAnalysisId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve swing analysis", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Update an existing swing analysis
    /// </summary>
    /// <param name="id">Swing analysis ID</param>
    /// <param name="request">Swing analysis update request</param>
    /// <returns>Updated swing analysis</returns>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<SwingAnalysisResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateSwingAnalysis(int id, [FromBody] UpdateSwingAnalysisRequestDto request)
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

            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            // Verify user has access to this swing analysis
            if (!await _swingAnalysisService.HasUserAccessAsync(id, currentUserId.Value))
                return Forbid();

            var model = _mapper.Map<UpdateSwingAnalysisModel>(request);
            var updatedSwingAnalysis = await _swingAnalysisService.UpdateAsync(id, model);
            
            if (updatedSwingAnalysis == null)
                return NotFound(ApiResponse.ErrorResponse("Swing analysis not found", "SWING_ANALYSIS_NOT_FOUND"));

            var responseDto = _mapper.Map<SwingAnalysisResponseDto>(updatedSwingAnalysis);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Swing analysis updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating swing analysis {SwingAnalysisId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to update swing analysis", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Delete a swing analysis
    /// </summary>
    /// <param name="id">Swing analysis ID</param>
    /// <returns>Success message</returns>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteSwingAnalysis(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var deleted = await _swingAnalysisService.DeleteAsync(id, currentUserId.Value);
            if (!deleted)
                return NotFound(ApiResponse.ErrorResponse("Swing analysis not found", "SWING_ANALYSIS_NOT_FOUND"));

            return Ok(ApiResponse.SuccessResponse("Swing analysis deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting swing analysis {SwingAnalysisId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to delete swing analysis", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get swing analysis statistics for the current user
    /// </summary>
    /// <returns>Swing analysis statistics</returns>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(ApiResponse<SwingAnalysisStatsResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetSwingAnalysisStats()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var stats = await _swingAnalysisService.GetStatsAsync(currentUserId.Value);
            var responseDto = _mapper.Map<SwingAnalysisStatsResponseDto>(stats);

            return Ok(ApiResponse.SuccessResponse(responseDto, "Swing analysis statistics retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving swing analysis stats for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve swing analysis statistics", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get round-specific swing analysis summary
    /// </summary>
    /// <param name="roundId">Round ID</param>
    /// <returns>Round swing analysis summary</returns>
    [HttpGet("round/{roundId:int}/summary")]
    [ProducesResponseType(typeof(ApiResponse<RoundSwingAnalysisSummaryResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetRoundSwingAnalysisSummary(int roundId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var summary = await _swingAnalysisService.GetRoundSummaryAsync(currentUserId.Value, roundId);
            var responseDto = _mapper.Map<RoundSwingAnalysisSummaryResponseDto>(summary);

            return Ok(ApiResponse.SuccessResponse(responseDto, "Round swing analysis summary retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving round swing analysis summary for user {UserId} and round {RoundId}", GetCurrentUserId(), roundId);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve round swing analysis summary", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get swing analyses by detection source for the current user
    /// </summary>
    /// <param name="detectionSource">Detection source (garmin or mobile)</param>
    /// <returns>Collection of swing analyses from the specified source</returns>
    [HttpGet("by-source/{detectionSource}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<SwingAnalysisResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetSwingAnalysesByDetectionSource(string detectionSource)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            if (detectionSource != "garmin" && detectionSource != "mobile")
                return BadRequest(ApiResponse.ErrorResponse("Detection source must be 'garmin' or 'mobile'", "INVALID_DETECTION_SOURCE"));

            var swingAnalyses = await _swingAnalysisService.GetByDetectionSourceAsync(currentUserId.Value, detectionSource);
            var responseDto = _mapper.Map<IEnumerable<SwingAnalysisResponseDto>>(swingAnalyses);

            return Ok(ApiResponse.SuccessResponse(responseDto, $"Swing analyses from {detectionSource} retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving swing analyses by detection source {DetectionSource} for user {UserId}", detectionSource, GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve swing analyses", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Generate AI feedback for a swing analysis
    /// </summary>
    /// <param name="id">Swing analysis ID</param>
    /// <returns>Updated swing analysis with AI feedback</returns>
    [HttpPost("{id:int}/generate-feedback")]
    [ProducesResponseType(typeof(ApiResponse<SwingAnalysisResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GenerateAiFeedback(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            // Verify user has access to this swing analysis
            if (!await _swingAnalysisService.HasUserAccessAsync(id, currentUserId.Value))
                return Forbid();

            var updatedSwingAnalysis = await _swingAnalysisService.GenerateAiFeedbackAsync(id);
            if (updatedSwingAnalysis == null)
                return NotFound(ApiResponse.ErrorResponse("Swing analysis not found", "SWING_ANALYSIS_NOT_FOUND"));

            var responseDto = _mapper.Map<SwingAnalysisResponseDto>(updatedSwingAnalysis);
            return Ok(ApiResponse.SuccessResponse(responseDto, "AI feedback generated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating AI feedback for swing analysis {SwingAnalysisId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to generate AI feedback", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get recent swing trends for the current user
    /// </summary>
    /// <param name="days">Number of days to look back (default: 30, max: 365)</param>
    /// <returns>Swing trend data</returns>
    [HttpGet("trends")]
    [ProducesResponseType(typeof(ApiResponse<Dictionary<DateTime, SwingAnalysisStatsResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetSwingTrends([FromQuery] int days = 30)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            if (days < 1 || days > 365)
                return BadRequest(ApiResponse.ErrorResponse("Days parameter must be between 1 and 365", "INVALID_DAYS_PARAMETER"));

            var trends = await _swingAnalysisService.GetSwingTrendsAsync(currentUserId.Value, days);
            var responseDto = trends.ToDictionary(
                kvp => kvp.Key,
                kvp => _mapper.Map<SwingAnalysisStatsResponseDto>(kvp.Value)
            );

            return Ok(ApiResponse.SuccessResponse(responseDto, "Swing trends retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving swing trends for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve swing trends", "INTERNAL_ERROR"));
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