using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AutoMapper;
using caddie.portal.api.DTOs.ClubRecommendation;
using caddie.portal.api.DTOs.Common;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;

namespace caddie.portal.api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class ClubRecommendationController : ControllerBase
{
    private readonly IClubRecommendationService _clubRecommendationService;
    private readonly IMapper _mapper;
    private readonly ILogger<ClubRecommendationController> _logger;

    public ClubRecommendationController(
        IClubRecommendationService clubRecommendationService,
        IMapper mapper,
        ILogger<ClubRecommendationController> logger)
    {
        _clubRecommendationService = clubRecommendationService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Generate an AI-powered club recommendation
    /// </summary>
    /// <param name="request">Club recommendation request parameters</param>
    /// <returns>Club recommendation with reasoning and alternatives</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ClubRecommendationResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GenerateRecommendation([FromBody] CreateClubRecommendationRequestDto request)
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

            var serviceRequest = _mapper.Map<ClubRecommendationRequestModel>(request);
            var recommendation = await _clubRecommendationService.GenerateRecommendationAsync(serviceRequest);
            var response = _mapper.Map<ClubRecommendationResponseDto>(recommendation);

            _logger.LogInformation("Generated club recommendation {RecommendationId} for user {UserId}: {Club}", 
                recommendation.Id, request.UserId, recommendation.RecommendedClub);

            return Ok(ApiResponse<ClubRecommendationResponseDto>.SuccessResponse(response, "Club recommendation generated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating club recommendation for user {UserId}", request.UserId);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while generating the club recommendation", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Provide feedback on a club recommendation
    /// </summary>
    /// <param name="id">Recommendation ID</param>
    /// <param name="feedback">User feedback</param>
    /// <returns>Success status</returns>
    [HttpPost("{id:int}/feedback")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ProvideFeedback(int id, [FromBody] ClubRecommendationFeedbackDto feedback)
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

            var feedbackModel = _mapper.Map<ClubRecommendationFeedbackModel>(feedback);
            var success = await _clubRecommendationService.SaveRecommendationFeedbackAsync(id, feedbackModel);

            if (!success)
            {
                return NotFound(ApiResponse.ErrorResponse($"Recommendation with ID {id} not found", "RECOMMENDATION_NOT_FOUND"));
            }

            _logger.LogInformation("Updated recommendation {RecommendationId} with feedback: accepted={Accepted}", 
                id, feedback.WasAccepted);

            return Ok(ApiResponse.SuccessResponse("Feedback saved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving feedback for recommendation {RecommendationId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while saving feedback", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get club recommendation by ID
    /// </summary>
    /// <param name="id">Recommendation ID</param>
    /// <returns>Club recommendation details</returns>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ClubRecommendationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRecommendation(int id)
    {
        try
        {
            var recommendation = await _clubRecommendationService.GetRecommendationByIdAsync(id);
            if (recommendation == null)
            {
                return NotFound(ApiResponse.ErrorResponse($"Recommendation with ID {id} not found", "RECOMMENDATION_NOT_FOUND"));
            }

            var response = _mapper.Map<ClubRecommendationDto>(recommendation);
            return Ok(ApiResponse<ClubRecommendationDto>.SuccessResponse(response, "Recommendation retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recommendation {RecommendationId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while retrieving the recommendation", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get user's recommendation history
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="limit">Optional limit for number of results</param>
    /// <returns>List of user's club recommendations</returns>
    [HttpGet("users/{userId:int}/history")]
    [ProducesResponseType(typeof(ApiResponse<List<ClubRecommendationDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetUserHistory(int userId, [FromQuery] int? limit = null)
    {
        try
        {
            var recommendations = await _clubRecommendationService.GetUserRecommendationHistoryAsync(userId, limit);
            var response = _mapper.Map<List<ClubRecommendationDto>>(recommendations);

            return Ok(ApiResponse<List<ClubRecommendationDto>>.SuccessResponse(response, "Recommendation history retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recommendation history for user {UserId}", userId);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while retrieving recommendation history", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get recommendations for a specific round
    /// </summary>
    /// <param name="roundId">Round ID</param>
    /// <returns>List of recommendations for the round</returns>
    [HttpGet("rounds/{roundId:int}")]
    [ProducesResponseType(typeof(ApiResponse<List<ClubRecommendationDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetRoundRecommendations(int roundId)
    {
        try
        {
            var recommendations = await _clubRecommendationService.GetRoundRecommendationsAsync(roundId);
            var response = _mapper.Map<List<ClubRecommendationDto>>(recommendations);

            return Ok(ApiResponse<List<ClubRecommendationDto>>.SuccessResponse(response, "Round recommendations retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recommendations for round {RoundId}", roundId);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while retrieving round recommendations", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get analytics for user's recommendation performance
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>User's recommendation analytics</returns>
    [HttpGet("users/{userId:int}/analytics")]
    [ProducesResponseType(typeof(ApiResponse<ClubRecommendationAnalyticsResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetUserAnalytics(int userId)
    {
        try
        {
            var analytics = await _clubRecommendationService.GetUserAnalyticsAsync(userId);
            var response = _mapper.Map<ClubRecommendationAnalyticsResponseDto>(analytics);

            return Ok(ApiResponse<ClubRecommendationAnalyticsResponseDto>.SuccessResponse(response, "User analytics retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting analytics for user {UserId}", userId);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while retrieving user analytics", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get system-wide recommendation analytics
    /// </summary>
    /// <returns>System analytics</returns>
    [HttpGet("analytics")]
    [ProducesResponseType(typeof(ApiResponse<ClubRecommendationAnalyticsResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSystemAnalytics()
    {
        try
        {
            var analytics = await _clubRecommendationService.GetSystemAnalyticsAsync();
            var response = _mapper.Map<ClubRecommendationAnalyticsResponseDto>(analytics);

            return Ok(ApiResponse<ClubRecommendationAnalyticsResponseDto>.SuccessResponse(response, "System analytics retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting system analytics");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while retrieving system analytics", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get recommendations for similar situations (for learning purposes)
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="distanceToTarget">Distance to target in meters</param>
    /// <param name="holeId">Optional hole ID for context</param>
    /// <returns>List of similar situation recommendations</returns>
    [HttpGet("users/{userId:int}/similar")]
    [ProducesResponseType(typeof(ApiResponse<List<ClubRecommendationDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetSimilarSituationRecommendations(
        int userId, 
        [FromQuery] decimal distanceToTarget, 
        [FromQuery] int? holeId = null)
    {
        try
        {
            if (distanceToTarget <= 0)
            {
                return BadRequest(ApiResponse.ErrorResponse("Distance to target must be greater than 0", "INVALID_DISTANCE"));
            }

            var recommendations = await _clubRecommendationService.GetSimilarSituationRecommendationsAsync(userId, distanceToTarget, holeId);
            var response = _mapper.Map<List<ClubRecommendationDto>>(recommendations);

            return Ok(ApiResponse<List<ClubRecommendationDto>>.SuccessResponse(response, "Similar situation recommendations retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting similar situation recommendations for user {UserId}", userId);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while retrieving similar situation recommendations", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get user's most recent recommendation
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Most recent club recommendation</returns>
    [HttpGet("users/{userId:int}/recent")]
    [ProducesResponseType(typeof(ApiResponse<ClubRecommendationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMostRecentRecommendation(int userId)
    {
        try
        {
            var recommendation = await _clubRecommendationService.GetMostRecentRecommendationAsync(userId);
            if (recommendation == null)
            {
                return NotFound(ApiResponse.ErrorResponse($"No recommendations found for user {userId}", "NO_RECOMMENDATIONS_FOUND"));
            }

            var response = _mapper.Map<ClubRecommendationDto>(recommendation);
            return Ok(ApiResponse<ClubRecommendationDto>.SuccessResponse(response, "Most recent recommendation retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting most recent recommendation for user {UserId}", userId);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while retrieving the most recent recommendation", "INTERNAL_ERROR"));
        }
    }
}