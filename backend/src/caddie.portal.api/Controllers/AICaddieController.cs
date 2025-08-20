using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AutoMapper;
using FluentValidation;
using caddie.portal.api.DTOs.AICaddie;
using caddie.portal.api.DTOs.Common;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using caddie.portal.dal.Repositories.Interfaces;

namespace caddie.portal.api.Controllers;

/// <summary>
/// Enhanced AI Caddie controller for skill-aware golf assistance
/// </summary>
[ApiController]
[Route("api/ai-caddie")]
[Authorize]
public class AICaddieController : ControllerBase
{
    private readonly IShotTypeDetectionService _shotTypeDetectionService;
    private readonly ISkillBasedAdviceService _skillBasedAdviceService;
    private readonly IEnhancedShotAnalysisService _enhancedShotAnalysisService;
    private readonly IUserRepository _userRepository;
    private readonly IRoundService _roundService;
    private readonly IGolfContextService _golfContextService;
    private readonly IMapper _mapper;
    private readonly ILogger<AICaddieController> _logger;

    public AICaddieController(
        IShotTypeDetectionService shotTypeDetectionService,
        ISkillBasedAdviceService skillBasedAdviceService,
        IEnhancedShotAnalysisService enhancedShotAnalysisService,
        IUserRepository userRepository,
        IRoundService roundService,
        IGolfContextService golfContextService,
        IMapper mapper,
        ILogger<AICaddieController> logger)
    {
        _shotTypeDetectionService = shotTypeDetectionService;
        _skillBasedAdviceService = skillBasedAdviceService;
        _enhancedShotAnalysisService = enhancedShotAnalysisService;
        _userRepository = userRepository;
        _roundService = roundService;
        _golfContextService = golfContextService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Initialize voice session with enhanced AI caddie
    /// </summary>
    /// <param name="request">Voice session initialization request</param>
    /// <returns>Voice session with user and golf context</returns>
    [HttpPost("voice-session")]
    public async Task<ActionResult<ApiResponse<AICaddieVoiceSessionResponse>>> InitializeVoiceSession(
        [FromBody] AICaddieVoiceSessionRequest request)
    {
        try
        {
            _logger.LogInformation("Initializing enhanced AI caddie voice session for user {UserId}, round {RoundId}", 
                request.UserId, request.RoundId > 0 ? request.RoundId : "General Advice Mode");

            // Get comprehensive user context including skill profile
            var userContext = await GetUserContextAsync(request.UserId);
            if (userContext == null)
            {
                return NotFound(ApiResponse<AICaddieVoiceSessionResponse>.ErrorResponse("User not found"));
            }

            // Get golf context for the current round (handle general advice mode when RoundId = 0)
            var golfContext = await _golfContextService.GenerateContextAsync(
                request.UserId, 
                request.RoundId > 0 ? request.RoundId : null, 
                null, 
                request.CurrentHole);

            // Generate initial greeting based on skill level and context
            var greetingMessage = await _skillBasedAdviceService.GenerateSkillBasedGreetingAsync(
                userContext, golfContext, request.CurrentHole);

            var response = new AICaddieVoiceSessionResponse
            {
                SessionId = Guid.NewGuid().ToString(),
                UserContext = _mapper.Map<UserContextResponse>(userContext),
                GolfContext = _mapper.Map<GolfContextDto>(golfContext),
                InitializedAt = DateTime.UtcNow,
                GreetingMessage = greetingMessage
            };

            _logger.LogInformation("Enhanced AI caddie voice session initialized successfully for user {UserId}", 
                request.UserId);

            return Ok(ApiResponse<AICaddieVoiceSessionResponse>.SuccessResponse(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing enhanced AI caddie voice session for user {UserId}", 
                request.UserId);
            return StatusCode(500, ApiResponse<AICaddieVoiceSessionResponse>.ErrorResponse("Failed to initialize voice session"));
        }
    }

    /// <summary>
    /// Analyze shot context and provide skill-based recommendations
    /// </summary>
    /// <param name="request">Shot analysis request</param>
    /// <returns>Comprehensive shot analysis with personalized recommendations</returns>
    [HttpPost("analyze-shot")]
    public async Task<ActionResult<ApiResponse<ShotAnalysisResponse>>> AnalyzeShot(
        [FromBody] ShotAnalysisRequest request)
    {
        try
        {
            _logger.LogInformation("Analyzing shot for user {UserId}, round {RoundId}, hole {CurrentHole}", 
                request.UserId, request.RoundId > 0 ? request.RoundId : "General Advice Mode", request.CurrentHole);

            // Get user skill profile
            var userContext = await GetUserContextAsync(request.UserId);
            if (userContext == null)
            {
                return NotFound(ApiResponse<ShotAnalysisResponse>.ErrorResponse("User not found"));
            }

            // Generate comprehensive golf context (handle general advice mode when RoundId = 0)
            var golfContext = await _golfContextService.GenerateContextAsync(
                request.UserId, 
                request.RoundId > 0 ? request.RoundId : null, 
                null, 
                request.CurrentHole);

            // Map location context
            var currentLocation = _mapper.Map<LocationContext>(request.Location);
            var targetLocation = request.TargetLocation != null 
                ? _mapper.Map<LocationContext>(request.TargetLocation) 
                : null;

            // Detect shot type based on context
            var shotTypeContext = new ShotTypeContext
            {
                CurrentLocation = currentLocation,
                TargetLocation = targetLocation,
                CurrentHole = request.CurrentHole,
                GolfContext = golfContext,
                ShotContext = request.ShotContext != null 
                    ? _mapper.Map<ShotContext>(request.ShotContext) 
                    : null
            };

            var shotTypeResult = await _shotTypeDetectionService.DetectShotTypeAsync(shotTypeContext);

            // Perform enhanced shot analysis
            var analysisResult = await _enhancedShotAnalysisService.AnalyzeShotAsync(
                userContext, 
                golfContext, 
                shotTypeResult, 
                currentLocation, 
                targetLocation);

            // Map to response DTO
            var response = new ShotAnalysisResponse
            {
                ShotType = _mapper.Map<ShotTypeDto>(shotTypeResult),
                ClubRecommendation = _mapper.Map<ClubRecommendationDto>(analysisResult.ClubRecommendation),
                StrategicAdvice = _mapper.Map<SkillBasedAdviceDto>(analysisResult.StrategicAdvice),
                DistanceAnalysis = _mapper.Map<DistanceAnalysisDto>(analysisResult.DistanceAnalysis),
                ConfidenceScore = analysisResult.ConfidenceScore.OverallConfidence,
                AnalyzedAt = DateTime.UtcNow
            };

            _logger.LogInformation("Shot analysis completed for user {UserId} with confidence {ConfidenceScore}", 
                request.UserId, response.ConfidenceScore);

            return Ok(ApiResponse<ShotAnalysisResponse>.SuccessResponse(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing shot for user {UserId}", request.UserId);
            return StatusCode(500, ApiResponse<ShotAnalysisResponse>.ErrorResponse("Failed to analyze shot"));
        }
    }

    /// <summary>
    /// Get user skill profile and context for AI personalization
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <returns>User context including skill profile</returns>
    [HttpGet("user-context/{userId}")]
    public async Task<ActionResult<ApiResponse<UserContextResponse>>> GetUserContext(int userId)
    {
        try
        {
            _logger.LogInformation("Retrieving user context for AI caddie personalization: {UserId}", userId);

            var userContext = await GetUserContextAsync(userId);
            if (userContext == null)
            {
                return NotFound(ApiResponse<UserContextResponse>.ErrorResponse("User not found"));
            }

            var response = _mapper.Map<UserContextResponse>(userContext);

            _logger.LogInformation("User context retrieved successfully for user {UserId}, skill level: {SkillLevel}", 
                userId, response.SkillLevel.Name);

            return Ok(ApiResponse<UserContextResponse>.SuccessResponse(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user context for user {UserId}", userId);
            return StatusCode(500, ApiResponse<UserContextResponse>.ErrorResponse("Failed to retrieve user context"));
        }
    }

    /// <summary>
    /// Generate skill-based greeting message for voice session
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="roundId">Round identifier</param>
    /// <param name="currentHole">Current hole number</param>
    /// <returns>Personalized greeting message</returns>
    [HttpGet("greeting/{userId}/{roundId}")]
    public async Task<ActionResult<ApiResponse<string>>> GenerateGreeting(
        int userId, 
        int roundId, 
        [FromQuery] int? currentHole = null)
    {
        try
        {
            _logger.LogInformation("Generating skill-based greeting for user {UserId}, round {RoundId}", 
                userId, roundId > 0 ? roundId : "General Advice Mode");

            var userContext = await GetUserContextAsync(userId);
            if (userContext == null)
            {
                return NotFound(ApiResponse<string>.ErrorResponse("User not found"));
            }

            var golfContext = await _golfContextService.GenerateContextAsync(userId, roundId > 0 ? roundId : null, null, currentHole);
            
            var greeting = await _skillBasedAdviceService.GenerateSkillBasedGreetingAsync(
                userContext, golfContext, currentHole);

            return Ok(ApiResponse<string>.SuccessResponse(greeting));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating greeting for user {UserId}", userId);
            return StatusCode(500, ApiResponse<string>.ErrorResponse("Failed to generate greeting"));
        }
    }

    /// <summary>
    /// Get skill-based club recommendation for specific distance
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <param name="distanceYards">Distance to target in yards</param>
    /// <param name="shotType">Type of shot (optional)</param>
    /// <param name="conditions">Playing conditions (optional)</param>
    /// <returns>Club recommendation tailored to user skill level</returns>
    [HttpGet("club-recommendation/{userId}")]
    public async Task<ActionResult<ApiResponse<ClubRecommendationDto>>> GetClubRecommendation(
        int userId,
        [FromQuery] decimal distanceYards,
        [FromQuery] string? shotType = null,
        [FromQuery] string? conditions = null)
    {
        try
        {
            _logger.LogInformation("Getting skill-based club recommendation for user {UserId}, distance {DistanceYards}y", 
                userId, distanceYards);

            var userContext = await GetUserContextAsync(userId);
            if (userContext == null)
            {
                return NotFound(ApiResponse<ClubRecommendationDto>.ErrorResponse("User not found"));
            }

            var recommendation = await _skillBasedAdviceService.GetSkillBasedClubRecommendationAsync(
                userContext, 
                distanceYards, 
                shotType, 
                conditions);

            var response = _mapper.Map<ClubRecommendationDto>(recommendation);

            return Ok(ApiResponse<ClubRecommendationDto>.SuccessResponse(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting club recommendation for user {UserId}", userId);
            return StatusCode(500, ApiResponse<ClubRecommendationDto>.ErrorResponse("Failed to get club recommendation"));
        }
    }

    #region Private Helper Methods

    /// <summary>
    /// Get comprehensive user context including skill profile
    /// </summary>
    /// <param name="userId">User identifier</param>
    /// <returns>User context with skill information</returns>
    private async Task<UserGolfProfile?> GetUserContextAsync(int userId)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) return null;

            return new UserGolfProfile
            {
                UserId = userId,
                Name = $"{user.FirstName} {user.LastName}".Trim(),
                Handicap = user.Handicap,
                SkillLevel = user.SkillLevel?.Name ?? "intermediate",
                // SkillLevelId is not part of UserGolfProfile - it's derived from SkillLevel string
                PlayingStyle = user.PlayingStyle,
                Preferences = !string.IsNullOrEmpty(user.Preferences)
                    ? System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(user.Preferences)
                    : new Dictionary<string, object>()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user context for user {UserId}", userId);
            return null;
        }
    }

    #endregion
}