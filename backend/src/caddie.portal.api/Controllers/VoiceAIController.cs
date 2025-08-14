using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using caddie.portal.services.Exceptions;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories.Interfaces;
using System.Security.Claims;

namespace caddie.portal.api.Controllers;

/// <summary>
/// Controller for voice AI interactions during golf rounds
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VoiceAIController : ControllerBase
{
    private readonly IOpenAIService _openAIService;
    private readonly IRoundService _roundService;
    private readonly ILogger<VoiceAIController> _logger;

    public VoiceAIController(
        IOpenAIService openAIService,
        IRoundService roundService,
        ILogger<VoiceAIController> logger)
    {
        _openAIService = openAIService;
        _roundService = roundService;
        _logger = logger;
    }

    /// <summary>
    /// Process voice input and generate AI golf advice
    /// </summary>
    /// <param name="request">Voice AI request with user input and context</param>
    /// <returns>AI-generated golf advice optimized for voice delivery</returns>
    [HttpPost("golf-conversation")]
    [ProducesResponseType(typeof(VoiceAIResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<VoiceAIResponse>> ProcessVoiceInput([FromBody] VoiceAIRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId != request.UserId)
            {
                return Forbid("User ID mismatch");
            }

            // Validate that the round exists and belongs to the user
            var round = await _roundService.GetRoundByIdAsync(request.RoundId);
            if (round == null)
            {
                return NotFound($"Round {request.RoundId} not found");
            }

            if (round.UserId != userId)
            {
                return Forbid("Round does not belong to the current user");
            }

            // Check rate limits
            if (await _openAIService.IsRateLimitExceededAsync(userId))
            {
                return StatusCode(StatusCodes.Status429TooManyRequests, 
                    new { message = "Rate limit exceeded. Please wait before making another request." });
            }

            // Generate AI response (conversation history removed with chat cleanup)
            var aiResponse = await _openAIService.GenerateVoiceGolfAdviceAsync(
                userId, 
                request.RoundId, 
                request.VoiceInput, 
                request.LocationContext ?? new object()
            );

            // Create response model
            var response = new VoiceAIResponse
            {
                Message = aiResponse,
                ResponseId = Guid.NewGuid().ToString(),
                GeneratedAt = DateTime.UtcNow,
                ConfidenceScore = 0.85m, // Default confidence score
                SuggestedActions = GenerateSuggestedActions(request.VoiceInput, aiResponse),
                RequiresConfirmation = DetermineIfConfirmationRequired(request.VoiceInput)
            };

            _logger.LogInformation("Generated voice AI response for user {UserId}, round {RoundId}", userId, request.RoundId);

            return Ok(response);
        }
        catch (OpenAIQuotaExceededException ex)
        {
            _logger.LogWarning(ex, "OpenAI quota exceeded for user {UserId}, round {RoundId}", request.UserId, request.RoundId);
            
            var retryAfter = ex.RetryAfterSeconds ?? 3600;
            Response.Headers["Retry-After"] = retryAfter.ToString();
            
            return StatusCode(StatusCodes.Status429TooManyRequests, new 
            { 
                message = "AI service temporarily unavailable due to quota limits. Please try again later.",
                quotaType = ex.QuotaType,
                retryAfterSeconds = retryAfter,
                fallbackAdvice = "Focus on fundamentals: good setup, smooth tempo, and smart course management."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing voice input for user {UserId}, round {RoundId}", 
                request.UserId, request.RoundId);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "An error occurred while processing your request" });
        }
    }

    /// <summary>
    /// Update location context for real-time AI awareness
    /// </summary>
    /// <param name="request">Location update request</param>
    /// <returns>Success confirmation</returns>
    [HttpPost("location-update")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> UpdateLocationContext([FromBody] LocationUpdateRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId != request.UserId)
            {
                return Forbid("User ID mismatch");
            }

            // Validate round exists and belongs to user
            var round = await _roundService.GetRoundByIdAsync(request.RoundId);
            if (round == null)
            {
                return NotFound($"Round {request.RoundId} not found");
            }

            if (round.UserId != userId)
            {
                return Forbid("Round does not belong to the current user");
            }

            // Update AI context with location data
            await _openAIService.UpdateLocationContextAsync(
                userId,
                request.RoundId,
                request.LocationContext.Latitude,
                request.LocationContext.Longitude,
                request.LocationContext.CurrentHole,
                request.LocationContext.DistanceToPinMeters
            );

            _logger.LogDebug("Updated location context for user {UserId}, round {RoundId}", userId, request.RoundId);

            return Ok(new { message = "Location context updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating location context for user {UserId}, round {RoundId}", 
                request.UserId, request.RoundId);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "An error occurred while updating location context" });
        }
    }

    /// <summary>
    /// Generate AI commentary for hole completion
    /// </summary>
    /// <param name="request">Hole completion request</param>
    /// <returns>AI-generated hole completion commentary</returns>
    [HttpPost("hole-completion")]
    [ProducesResponseType(typeof(HoleCompletionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<HoleCompletionResponse>> GenerateHoleCompletion([FromBody] HoleCompletionRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId != request.UserId)
            {
                return Forbid("User ID mismatch");
            }

            // Validate round exists and belongs to user
            var round = await _roundService.GetRoundByIdAsync(request.RoundId);
            if (round == null)
            {
                return NotFound($"Round {request.RoundId} not found");
            }

            if (round.UserId != userId)
            {
                return Forbid("Round does not belong to the current user");
            }

            // Generate hole completion commentary
            var commentary = await _openAIService.GenerateHoleCompletionCommentaryAsync(
                userId,
                request.RoundId,
                request.HoleNumber,
                request.Score,
                request.Par,
                request.ShotData
            );

            var response = new HoleCompletionResponse
            {
                Commentary = commentary,
                PerformanceSummary = GeneratePerformanceSummary(request.Score, request.Par),
                ScoreDescription = GetScoreDescription(request.Score, request.Par),
                EncouragementLevel = CalculateEncouragementLevel(request.Score, request.Par),
                GeneratedAt = DateTime.UtcNow
            };

            _logger.LogInformation("Generated hole completion commentary for user {UserId}, round {RoundId}, hole {HoleNumber}", 
                userId, request.RoundId, request.HoleNumber);

            return Ok(response);
        }
        catch (OpenAIQuotaExceededException ex)
        {
            _logger.LogWarning(ex, "OpenAI quota exceeded for hole completion, user {UserId}, round {RoundId}, hole {HoleNumber}", 
                request.UserId, request.RoundId, request.HoleNumber);
            
            // Return default commentary when quota exceeded
            var fallbackResponse = new HoleCompletionResponse
            {
                Commentary = GetFallbackHoleCommentary(request.Score, request.Par),
                PerformanceSummary = GeneratePerformanceSummary(request.Score, request.Par),
                ScoreDescription = GetScoreDescription(request.Score, request.Par),
                EncouragementLevel = CalculateEncouragementLevel(request.Score, request.Par),
                GeneratedAt = DateTime.UtcNow
            };
            
            return Ok(fallbackResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating hole completion commentary for user {UserId}, round {RoundId}, hole {HoleNumber}", 
                request.UserId, request.RoundId, request.HoleNumber);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "An error occurred while generating hole commentary" });
        }
    }





    /// <summary>
    /// Generate dynamic caddie response for specific golf scenarios
    /// </summary>
    /// <param name="request">Caddie response request</param>
    /// <returns>AI-generated caddie response optimized for TTS</returns>
    [HttpPost("caddie-response")]
    [ProducesResponseType(typeof(CaddieResponseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<CaddieResponseResponse>> GenerateCaddieResponse([FromBody] CaddieResponseRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId != request.UserId)
            {
                return Forbid("User ID mismatch");
            }

            // Validate that the round exists and belongs to the user
            var round = await _roundService.GetRoundByIdAsync(request.RoundId);
            if (round == null)
            {
                return NotFound($"Round {request.RoundId} not found");
            }

            if (round.UserId != userId)
            {
                return Forbid("Round does not belong to the current user");
            }

            // Check rate limits
            if (await _openAIService.IsRateLimitExceededAsync(userId))
            {
                return StatusCode(StatusCodes.Status429TooManyRequests, 
                    new { message = "Rate limit exceeded. Please wait before making another request." });
            }

            // Generate dynamic caddie response
            var caddieMessage = await _openAIService.GenerateCaddieResponseAsync(
                userId,
                request.RoundId,
                request.Scenario,
                request.Context,
                request.UserInput
            );

            // Create response model
            var response = new CaddieResponseResponse
            {
                Message = caddieMessage,
                ResponseId = Guid.NewGuid().ToString(),
                Scenario = request.Scenario,
                GeneratedAt = DateTime.UtcNow,
                ConfidenceScore = 0.9m, // High confidence for caddie responses
                SuggestedActions = GenerateCaddieActions(request.Scenario, request.Context),
                RequiresConfirmation = false,
                AdviceCategory = GetAdviceCategory(request.Scenario)
            };

            _logger.LogInformation("Generated caddie response for user {UserId}, scenario {Scenario}, round {RoundId}", 
                userId, request.Scenario, request.RoundId);

            return Ok(response);
        }
        catch (OpenAIQuotaExceededException ex)
        {
            _logger.LogWarning(ex, "OpenAI quota exceeded for caddie response, user {UserId}, scenario {Scenario}", 
                request.UserId, request.Scenario);
            
            var retryAfter = ex.RetryAfterSeconds ?? 3600;
            Response.Headers["Retry-After"] = retryAfter.ToString();
            
            // Return fallback response
            var fallbackResponse = new CaddieResponseResponse
            {
                Message = GetFallbackCaddieMessage(request.Scenario, request.Context),
                ResponseId = Guid.NewGuid().ToString(),
                Scenario = request.Scenario,
                GeneratedAt = DateTime.UtcNow,
                ConfidenceScore = 0.5m,
                SuggestedActions = GenerateCaddieActions(request.Scenario, request.Context),
                RequiresConfirmation = false,
                AdviceCategory = GetAdviceCategory(request.Scenario)
            };
            
            return Ok(fallbackResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating caddie response for user {UserId}, scenario {Scenario}", 
                request.UserId, request.Scenario);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "An error occurred while generating caddie response" });
        }
    }

    #region Private Helper Methods

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return userId;
    }

    private static List<string> GenerateSuggestedActions(string userInput, string aiResponse)
    {
        var suggestions = new List<string>();

        // Analyze user input to suggest relevant actions
        var lowerInput = userInput.ToLower();

        if (lowerInput.Contains("club") || lowerInput.Contains("what should i hit"))
        {
            suggestions.Add("Ask about course conditions");
            suggestions.Add("Get distance information");
        }

        if (lowerInput.Contains("score") || lowerInput.Contains("scorecard"))
        {
            suggestions.Add("View current scorecard");
            suggestions.Add("Record hole score");
        }

        if (lowerInput.Contains("weather") || lowerInput.Contains("wind"))
        {
            suggestions.Add("Get detailed weather forecast");
            suggestions.Add("Ask about wind adjustment");
        }

        // Default suggestions if none match
        if (!suggestions.Any())
        {
            suggestions.AddRange(new[]
            {
                "Ask for course strategy",
                "Get club recommendation",
                "Check scorecard"
            });
        }

        return suggestions;
    }

    private static bool DetermineIfConfirmationRequired(string userInput)
    {
        var lowerInput = userInput.ToLower();
        
        // Require confirmation for certain actions
        var confirmationTriggers = new[]
        {
            "abandon round",
            "quit",
            "end round",
            "forfeit",
            "record score"
        };

        return confirmationTriggers.Any(trigger => lowerInput.Contains(trigger));
    }

    private static string GeneratePerformanceSummary(int score, int par)
    {
        var difference = score - par;
        return difference switch
        {
            <= -2 => "Exceptional performance",
            -1 => "Excellent play",
            0 => "Solid par performance",
            1 => "Close to par",
            2 => "Room for improvement",
            _ => "Challenging hole"
        };
    }

    private static string GetScoreDescription(int score, int par)
    {
        return (score - par) switch
        {
            -3 => "Albatross",
            -2 => "Eagle",
            -1 => "Birdie",
            0 => "Par",
            1 => "Bogey",
            2 => "Double Bogey",
            3 => "Triple Bogey",
            _ when score - par > 3 => $"{score - par} over par",
            _ => $"{par - score} under par"
        };
    }

    private static int CalculateEncouragementLevel(int score, int par)
    {
        return (score - par) switch
        {
            <= -1 => 5, // Maximum encouragement for under par
            0 => 4,     // High encouragement for par
            1 => 3,     // Neutral for bogey
            2 => 2,     // Supportive for double bogey
            _ => 1      // Most supportive for worse scores
        };
    }

    private static string GetFallbackHoleCommentary(int score, int par)
    {
        return (score - par) switch
        {
            <= -1 => "Great job on that hole! Keep up the excellent play.",
            0 => "Nice par! Solid golf right there.",
            1 => "Good bogey. Stay positive and focus on the next hole.",
            _ => "Tough hole, but that's golf! Let's bounce back on the next one."
        };
    }

    private static List<string> GenerateCaddieActions(CaddieScenario scenario, CaddieContext? context)
    {
        return scenario switch
        {
            CaddieScenario.ShotPlacementWelcome => new List<string>
            {
                "Tap map to place target",
                "Ask for course strategy",
                "Get weather conditions"
            },

            CaddieScenario.ClubRecommendation => new List<string>
            {
                "Confirm club selection",
                "Ask about conditions",
                "Get distance adjustment"
            },

            CaddieScenario.ShotPlacementConfirmation => new List<string>
            {
                "Activate shot tracking",
                "Adjust target position",
                "Ask for advice"
            },

            CaddieScenario.ShotTrackingActivation => new List<string>
            {
                "Take your shot",
                "Cancel shot tracking",
                "Ask for swing tip"
            },

            CaddieScenario.ShotCompletion => new List<string>
            {
                "Place next target",
                "View shot statistics",
                "Move to next hole"
            },

            CaddieScenario.HoleCompletion => new List<string>
            {
                "View scorecard",
                "Get strategy for next hole",
                "Review hole performance"
            },

            _ => new List<string>
            {
                "Ask for advice",
                "Get club recommendation",
                "Check course strategy"
            }
        };
    }

    private static string GetAdviceCategory(CaddieScenario scenario)
    {
        return scenario switch
        {
            CaddieScenario.ClubRecommendation => "Club Selection",
            CaddieScenario.CourseStrategy => "Course Strategy",
            CaddieScenario.ShotPlacementWelcome or 
            CaddieScenario.ShotPlacementConfirmation or 
            CaddieScenario.ShotTrackingActivation => "Shot Placement",
            CaddieScenario.PerformanceEncouragement or 
            CaddieScenario.HoleCompletion => "Performance",
            CaddieScenario.WeatherConditions => "Course Conditions",
            CaddieScenario.ErrorHandling => "Support",
            _ => "General Advice"
        };
    }

    private static string GetFallbackCaddieMessage(CaddieScenario scenario, CaddieContext? context)
    {
        return scenario switch
        {
            CaddieScenario.ShotPlacementWelcome => 
                "Welcome to shot placement! Tap the map to set your target.",

            CaddieScenario.ClubRecommendation => 
                GetFallbackClubAdvice(context?.GolfContext?.TargetDistanceYards ?? 150),

            CaddieScenario.ShotPlacementConfirmation => 
                $"Target set at {context?.GolfContext?.TargetDistanceYards ?? 150} yards. You're ready to go!",

            CaddieScenario.ShotTrackingActivation => 
                "Shot tracking active. Trust your swing and follow through.",

            CaddieScenario.ShotInProgress => 
                "Looking good! Stay committed to your shot.",

            CaddieScenario.ShotCompletion => 
                "Well played! Ready for your next target.",

            CaddieScenario.MovementDetected => 
                "Shot complete. Nice work out there!",

            CaddieScenario.DistanceAnnouncement => 
                $"Distance: {context?.GolfContext?.TargetDistanceYards ?? 150} yards to target.",

            CaddieScenario.HoleCompletion => 
                "Good hole! Let's keep the momentum going.",

            CaddieScenario.ErrorHandling => 
                "No problem! I'm here to help you get back on track.",

            _ => "I'm here to help with your golf game!"
        };
    }

    private static string GetFallbackClubAdvice(decimal yards)
    {
        return yards switch
        {
            < 80m => "Try a wedge for this short approach.",
            < 120m => "An 8 or 9 iron should work well.",
            < 150m => "Consider a 6 or 7 iron.",
            < 170m => "A 5 iron or hybrid looks good.",
            < 200m => "Try a 4 iron or fairway wood.",
            _ => "A driver or 3 wood for this distance."
        };
    }

    #endregion
}