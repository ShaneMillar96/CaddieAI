using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AutoMapper;
using System.Security.Claims;
using caddie.portal.api.DTOs.Chat;
using caddie.portal.api.DTOs.Common;
using caddie.portal.services.Interfaces;

namespace caddie.portal.api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class ChatController : ControllerBase
{
    private readonly IOpenAIService _openAIService;
    private readonly IMapper _mapper;
    private readonly ILogger<ChatController> _logger;

    public ChatController(
        IOpenAIService openAIService,
        IMapper mapper,
        ILogger<ChatController> logger)
    {
        _openAIService = openAIService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Start a new chat session with AI caddie
    /// </summary>
    /// <param name="request">Session configuration</param>
    /// <returns>New chat session</returns>
    [HttpPost("sessions")]
    [ProducesResponseType(typeof(ApiResponse<StartChatSessionResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> StartChatSession([FromBody] StartChatSessionRequestDto request)
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
            var session = await _openAIService.StartChatSessionAsync(userId, request.RoundId, request.CourseId, request.SessionName);
            var sessionDto = _mapper.Map<ChatSessionDto>(session);

            var response = new StartChatSessionResponseDto
            {
                Success = true,
                Message = "Chat session started successfully",
                Session = sessionDto
            };

            return CreatedAtAction(nameof(GetChatSession), new { sessionId = session.Id }, 
                ApiResponse.SuccessResponse(response, "Chat session created successfully"));
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid request to start chat session for user {UserId}", GetCurrentUserId());
            return BadRequest(ApiResponse.ErrorResponse(ex.Message, "INVALID_REQUEST"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting chat session for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while starting the chat session", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Send a message to the AI and get a response
    /// </summary>
    /// <param name="sessionId">Chat session ID</param>
    /// <param name="request">Message content</param>
    /// <returns>AI response</returns>
    [HttpPost("sessions/{sessionId}/messages")]
    [ProducesResponseType(typeof(ApiResponse<ChatResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> SendMessage(int sessionId, [FromBody] SendMessageRequestDto request)
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

            // Check rate limits
            if (await _openAIService.IsRateLimitExceededAsync(userId))
            {
                return StatusCode(429, ApiResponse.ErrorResponse("Rate limit exceeded. Please wait before sending another message.", "RATE_LIMIT_EXCEEDED"));
            }

            var assistantMessage = await _openAIService.SendMessageAsync(sessionId, userId, request.Message);
            var session = await _openAIService.GetChatSessionAsync(sessionId, userId);

            if (session == null)
            {
                return NotFound(ApiResponse.ErrorResponse("Chat session not found", "SESSION_NOT_FOUND"));
            }

            var response = new ChatResponseDto
            {
                Success = true,
                Message = "Message sent successfully",
                Session = _mapper.Map<ChatSessionDto>(session),
                AssistantMessage = _mapper.Map<ChatMessageDto>(assistantMessage)
            };

            return Ok(ApiResponse.SuccessResponse(response, "Message processed successfully"));
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid request to send message to session {SessionId}", sessionId);
            return BadRequest(ApiResponse.ErrorResponse(ex.Message, "INVALID_REQUEST"));
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Rate limit"))
        {
            return StatusCode(429, ApiResponse.ErrorResponse(ex.Message, "RATE_LIMIT_EXCEEDED"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message to session {SessionId}", sessionId);
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while processing your message", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get chat session details with message history
    /// </summary>
    /// <param name="sessionId">Chat session ID</param>
    /// <returns>Chat session with messages</returns>
    [HttpGet("sessions/{sessionId}")]
    [ProducesResponseType(typeof(ApiResponse<ChatSessionDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetChatSession(int sessionId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var session = await _openAIService.GetChatSessionAsync(sessionId, userId);

            if (session == null)
            {
                return NotFound(ApiResponse.ErrorResponse("Chat session not found", "SESSION_NOT_FOUND"));
            }

            var sessionDetailDto = _mapper.Map<ChatSessionDetailDto>(session);

            return Ok(ApiResponse.SuccessResponse(sessionDetailDto, "Chat session retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting chat session {SessionId}", sessionId);
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving the chat session", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get all chat sessions for the current user
    /// </summary>
    /// <param name="includeMessages">Include message history</param>
    /// <returns>List of chat sessions</returns>
    [HttpGet("sessions")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ChatSessionSummaryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetUserChatSessions([FromQuery] bool includeMessages = false)
    {
        try
        {
            var userId = GetCurrentUserId();
            var sessions = await _openAIService.GetUserChatSessionsAsync(userId, includeMessages);

            var sessionDtos = includeMessages 
                ? sessions.Select(s => _mapper.Map<ChatSessionDetailDto>(s)).Cast<object>()
                : sessions.Select(s => _mapper.Map<ChatSessionSummaryDto>(s)).Cast<object>();

            return Ok(ApiResponse.SuccessResponse(sessionDtos, "Chat sessions retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting chat sessions for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving chat sessions", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get active chat session for current round
    /// </summary>
    /// <param name="roundId">Round ID</param>
    /// <returns>Active chat session for round</returns>
    [HttpGet("sessions/round/{roundId}")]
    [ProducesResponseType(typeof(ApiResponse<ChatSessionDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetActiveChatSessionForRound(int roundId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var session = await _openAIService.GetActiveChatSessionForRoundAsync(userId, roundId);

            if (session == null)
            {
                return NotFound(ApiResponse.ErrorResponse("No active chat session found for this round", "SESSION_NOT_FOUND"));
            }

            var sessionDetailDto = _mapper.Map<ChatSessionDetailDto>(session);

            return Ok(ApiResponse.SuccessResponse(sessionDetailDto, "Active chat session retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active chat session for round {RoundId}", roundId);
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving the chat session", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get conversation history for a session
    /// </summary>
    /// <param name="sessionId">Chat session ID</param>
    /// <param name="limit">Number of messages to retrieve</param>
    /// <returns>Conversation history</returns>
    [HttpGet("sessions/{sessionId}/messages")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ChatMessageDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetConversationHistory(int sessionId, [FromQuery] int limit = 50)
    {
        try
        {
            var userId = GetCurrentUserId();
            var messages = await _openAIService.GetConversationHistoryAsync(sessionId, userId, limit);
            var messageDtos = _mapper.Map<IEnumerable<ChatMessageDto>>(messages);

            return Ok(ApiResponse.SuccessResponse(messageDtos, "Conversation history retrieved successfully"));
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid request to get conversation history for session {SessionId}", sessionId);
            return NotFound(ApiResponse.ErrorResponse(ex.Message, "SESSION_NOT_FOUND"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting conversation history for session {SessionId}", sessionId);
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving conversation history", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// End a chat session
    /// </summary>
    /// <param name="sessionId">Chat session ID</param>
    /// <returns>Success response</returns>
    [HttpDelete("sessions/{sessionId}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EndChatSession(int sessionId)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _openAIService.EndChatSessionAsync(sessionId, userId);

            return Ok(ApiResponse.SuccessResponse("Chat session ended successfully"));
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid request to end session {SessionId}", sessionId);
            return NotFound(ApiResponse.ErrorResponse(ex.Message, "SESSION_NOT_FOUND"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ending chat session {SessionId}", sessionId);
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while ending the chat session", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get usage statistics for the current user
    /// </summary>
    /// <param name="days">Number of days to look back (default: 30)</param>
    /// <returns>Usage statistics</returns>
    [HttpGet("usage")]
    [ProducesResponseType(typeof(ApiResponse<ChatUsageStatsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetUsageStatistics([FromQuery] int days = 30)
    {
        try
        {
            var userId = GetCurrentUserId();
            var fromDate = DateTime.UtcNow.AddDays(-Math.Abs(days));
            
            var (totalTokens, totalMessages, estimatedCost) = await _openAIService.GetUsageStatisticsAsync(userId, fromDate);

            var stats = new ChatUsageStatsDto
            {
                TotalTokens = totalTokens,
                TotalMessages = totalMessages,
                EstimatedCost = estimatedCost,
                FromDate = fromDate
            };

            return Ok(ApiResponse.SuccessResponse(stats, "Usage statistics retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting usage statistics for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving usage statistics", "INTERNAL_ERROR"));
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