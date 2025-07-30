using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
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
    private readonly IChatMessageRepository _chatMessageRepository;
    private readonly IAIScoreService _aiScoreService;
    private readonly ILogger<VoiceAIController> _logger;

    public VoiceAIController(
        IOpenAIService openAIService,
        IRoundService roundService,
        IChatMessageRepository chatMessageRepository,
        IAIScoreService aiScoreService,
        ILogger<VoiceAIController> logger)
    {
        _openAIService = openAIService;
        _roundService = roundService;
        _chatMessageRepository = chatMessageRepository;
        _aiScoreService = aiScoreService;
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

            // Convert conversation history if provided
            IEnumerable<ChatMessage>? conversationHistory = null;
            if (request.ConversationHistory?.Any() == true)
            {
                conversationHistory = request.ConversationHistory.Select(msg => new ChatMessage
                {
                    MessageContent = msg.Content,
                    OpenaiRole = msg.Role,
                    CreatedAt = msg.Timestamp
                });
            }

            // Generate AI response
            var aiResponse = await _openAIService.GenerateVoiceGolfAdviceAsync(
                userId, 
                request.RoundId, 
                request.VoiceInput, 
                request.LocationContext ?? new object(), 
                conversationHistory
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating hole completion commentary for user {UserId}, round {RoundId}, hole {HoleNumber}", 
                request.UserId, request.RoundId, request.HoleNumber);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "An error occurred while generating hole commentary" });
        }
    }

    /// <summary>
    /// Get voice AI usage statistics for the current user
    /// </summary>
    /// <param name="fromDate">Start date for statistics (optional)</param>
    /// <returns>Usage statistics including token consumption and costs</returns>
    [HttpGet("usage-stats")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult> GetUsageStatistics([FromQuery] DateTime? fromDate = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var (totalTokens, totalMessages, estimatedCost) = await _openAIService.GetUsageStatisticsAsync(userId, fromDate);

            var response = new
            {
                UserId = userId,
                FromDate = fromDate ?? DateTime.UtcNow.AddDays(-30),
                ToDate = DateTime.UtcNow,
                TotalTokens = totalTokens,
                TotalMessages = totalMessages,
                EstimatedCost = estimatedCost,
                Currency = "USD"
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting usage statistics for user {UserId}", GetCurrentUserId());
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "An error occurred while retrieving usage statistics" });
        }
    }

    /// <summary>
    /// Process automatic hole completion and score detection
    /// </summary>
    /// <param name="request">Hole completion analysis request</param>
    /// <returns>Automatic score detection results</returns>
    [HttpPost("process-hole-completion")]
    [ProducesResponseType(typeof(AutoScoreResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AutoScoreResult>> ProcessHoleCompletion([FromBody] HoleCompletionAnalysisRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();

            // Validate that the round belongs to the user
            var round = await _roundService.GetRoundByIdAsync(request.RoundId);
            if (round == null)
            {
                return NotFound($"Round {request.RoundId} not found");
            }

            if (round.UserId != userId)
            {
                return Forbid("Round does not belong to the current user");
            }

            // Process hole completion with AI score detection
            var result = await _aiScoreService.ProcessHoleCompletionAsync(
                userId,
                request.RoundId,
                request.HoleNumber,
                request.ShotEvents ?? new List<object>(),
                request.FinalLocation ?? new { }
            );

            _logger.LogInformation("Processed hole completion for user {UserId}, round {RoundId}, hole {HoleNumber}, detected score {Score}",
                userId, request.RoundId, request.HoleNumber, result.DetectedScore);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing hole completion for user {UserId}, round {RoundId}, hole {HoleNumber}",
                GetCurrentUserId(), request.RoundId, request.HoleNumber);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "An error occurred while processing hole completion" });
        }
    }

    /// <summary>
    /// Validate and record an AI-detected score
    /// </summary>
    /// <param name="request">Score validation request</param>
    /// <returns>Score validation and recording results</returns>
    [HttpPost("validate-score")]
    [ProducesResponseType(typeof(ScoreValidationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ScoreValidationResult>> ValidateScore([FromBody] ScoreValidationRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();

            // Validate that the round belongs to the user
            var round = await _roundService.GetRoundByIdAsync(request.RoundId);
            if (round == null)
            {
                return NotFound($"Round {request.RoundId} not found");
            }

            if (round.UserId != userId)
            {
                return Forbid("Round does not belong to the current user");
            }

            // Validate and record the score
            var result = await _aiScoreService.ValidateAndRecordScoreAsync(
                userId,
                request.RoundId,
                request.HoleNumber,
                request.DetectedScore,
                request.UserConfirmedScore
            );

            _logger.LogInformation("Validated and recorded score for user {UserId}, round {RoundId}, hole {HoleNumber}, final score {Score}",
                userId, request.RoundId, request.HoleNumber, result.FinalScore);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating score for user {UserId}, round {RoundId}, hole {HoleNumber}",
                GetCurrentUserId(), request.RoundId, request.HoleNumber);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "An error occurred while validating the score" });
        }
    }

    /// <summary>
    /// Get AI scoring statistics for the current user
    /// </summary>
    /// <param name="fromDate">Start date for statistics (optional)</param>
    /// <returns>AI scoring accuracy and usage statistics</returns>
    [HttpGet("scoring-stats")]
    [ProducesResponseType(typeof(AIScoreStatistics), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AIScoreStatistics>> GetScoringStatistics([FromQuery] DateTime? fromDate = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var statistics = await _aiScoreService.GetScoringStatisticsAsync(userId, fromDate);

            _logger.LogInformation("Retrieved AI scoring statistics for user {UserId}", userId);

            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting AI scoring statistics for user {UserId}", GetCurrentUserId());
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "An error occurred while retrieving scoring statistics" });
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

    #endregion
}