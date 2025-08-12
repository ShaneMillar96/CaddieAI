using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Configuration;
using Microsoft.Extensions.Options;
using System.Security.Claims;

namespace caddie.portal.api.Controllers;

/// <summary>
/// WebSocket relay controller for OpenAI Realtime Audio API
/// Provides secure relay between React Native client and OpenAI Realtime API
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class RealtimeAudioController : ControllerBase
{
    private readonly OpenAISettings _openAISettings;
    private readonly ILogger<RealtimeAudioController> _logger;
    private readonly IRoundService _roundService;

    public RealtimeAudioController(
        IOptions<OpenAISettings> openAISettings,
        ILogger<RealtimeAudioController> logger,
        IRoundService roundService)
    {
        _openAISettings = openAISettings.Value;
        _logger = logger;
        _roundService = roundService;
    }

    /// <summary>
    /// Establish WebSocket connection for realtime audio with OpenAI
    /// </summary>
    /// <param name="roundId">Active golf round ID</param>
    [HttpGet("connect/{roundId}")]
    [AllowAnonymous]
    public async Task<IActionResult> ConnectRealtimeAudio(int roundId, [FromQuery] string? token = null)
    {
        _logger.LogInformation("ConnectRealtimeAudio endpoint hit for roundId: {RoundId}", roundId);
        _logger.LogInformation("Request headers: {Headers}", 
            string.Join(", ", HttpContext.Request.Headers.Select(h => $"{h.Key}={string.Join(",", h.Value.ToArray())}")));
        _logger.LogInformation("IsWebSocketRequest: {IsWebSocketRequest}", HttpContext.WebSockets.IsWebSocketRequest);
        
        if (!HttpContext.WebSockets.IsWebSocketRequest)
        {
            _logger.LogWarning("Request is not a WebSocket request for roundId: {RoundId}", roundId);
            return BadRequest("WebSocket connection required");
        }

        // Try to get user ID from JWT token in query parameter if header auth fails
        int userId;
        try 
        {
            userId = GetCurrentUserId();
        }
        catch (UnauthorizedAccessException)
        {
            // If header auth fails, try query parameter token
            if (string.IsNullOrEmpty(token))
            {
                return Unauthorized("Authentication token required");
            }
            
            // Validate JWT token from query parameter
            try
            {
                userId = await ValidateTokenAndGetUserId(token);
                _logger.LogInformation("Successfully authenticated WebSocket connection via query parameter for user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Invalid token provided in query parameter");
                return Unauthorized("Invalid authentication token");
            }
        }
        
        // Validate round ownership
        var round = await _roundService.GetRoundByIdAsync(roundId);
        if (round == null)
        {
            return NotFound($"Round {roundId} not found");
        }

        if (round.UserId != userId)
        {
            return Forbid("Round does not belong to the current user");
        }

        _logger.LogInformation("Starting realtime audio session for user {UserId}, round {RoundId}", userId, roundId);

        // Accept WebSocket connection
        using var clientWebSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
        
        // Create connection to OpenAI Realtime API
        using var openAiWebSocket = new ClientWebSocket();
        
        try
        {
            // Configure OpenAI WebSocket connection
            openAiWebSocket.Options.SetRequestHeader("Authorization", $"Bearer {_openAISettings.ApiKey}");
            openAiWebSocket.Options.SetRequestHeader("OpenAI-Beta", "realtime=v1");
            
            // Connect to OpenAI Realtime API
            var openAiUri = new Uri("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01");
            await openAiWebSocket.ConnectAsync(openAiUri, CancellationToken.None);

            _logger.LogInformation("Connected to OpenAI Realtime API for user {UserId}", userId);

            // Send initial session configuration
            await SendInitialSessionConfig(openAiWebSocket, userId, roundId);

            // Start relay between client and OpenAI
            var relayTask1 = RelayMessages(clientWebSocket, openAiWebSocket, "Client->OpenAI", userId);
            var relayTask2 = RelayMessages(openAiWebSocket, clientWebSocket, "OpenAI->Client", userId);

            // Wait for either connection to close
            await Task.WhenAny(relayTask1, relayTask2);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in realtime audio session for user {UserId}, round {RoundId}", userId, roundId);
            
            // Send error message to client before closing
            if (clientWebSocket.State == WebSocketState.Open)
            {
                var errorMessage = JsonSerializer.Serialize(new
                {
                    type = "error",
                    message = "Failed to establish realtime audio connection",
                    timestamp = DateTime.UtcNow
                });
                
                var errorBytes = Encoding.UTF8.GetBytes(errorMessage);
                await clientWebSocket.SendAsync(
                    new ArraySegment<byte>(errorBytes),
                    WebSocketMessageType.Text,
                    true,
                    CancellationToken.None
                );
            }
        }
        finally
        {
            _logger.LogInformation("Realtime audio session ended for user {UserId}, round {RoundId}", userId, roundId);
        }

        return new EmptyResult();
    }

    private async Task SendInitialSessionConfig(ClientWebSocket openAiWebSocket, int userId, int roundId)
    {
        var sessionConfig = new
        {
            type = "session.update",
            session = new
            {
                modalities = new[] { "text", "audio" },
                instructions = @"You are an expert golf caddie AI assistant for CaddieAI. Provide brief, encouraging, and professional golf advice optimized for voice delivery.

COMMUNICATION STYLE:
- Keep responses under 30 words for natural conversation flow
- Use warm, encouraging tone like a professional caddie
- Speak naturally as if you're walking the course together
- Avoid technical jargon unless specifically requested

GOLF EXPERTISE:
- Provide club recommendations based on distance and conditions
- Offer strategic course management advice
- Give shot placement guidance with positive reinforcement
- Share encouragement during challenging moments

RESPONSE GUIDELINES:
- Be concise but personable
- Focus on actionable advice
- Maintain professional caddie demeanor
- Adapt communication to the golfer's skill level",
                voice = "ash", // Warm, encouraging voice for golf instruction
                input_audio_format = "pcm16",
                output_audio_format = "pcm16",
                input_audio_transcription = new { model = "whisper-1" },
                turn_detection = new 
                { 
                    type = "server_vad",
                    threshold = 0.5,
                    prefix_padding_ms = 300,
                    silence_duration_ms = 200
                },
                tools = new object[]
                {
                    new
                    {
                        type = "function",
                        name = "get_club_recommendation",
                        description = "Get personalized club recommendation for specific yardage and conditions",
                        parameters = new
                        {
                            type = "object",
                            properties = new
                            {
                                distance_yards = new { type = "number", description = "Distance to target in yards" },
                                current_hole = new { type = "number", description = "Current hole number" },
                                conditions = new { type = "string", description = "Course/weather conditions" }
                            },
                            required = new[] { "distance_yards" }
                        }
                    },
                    new
                    {
                        type = "function", 
                        name = "announce_shot_status",
                        description = "Announce shot placement or tracking status updates",
                        parameters = new
                        {
                            type = "object",
                            properties = new
                            {
                                status = new { type = "string", description = "Shot status: placed, activated, in_progress, completed" },
                                distance_yards = new { type = "number", description = "Distance to target" }
                            },
                            required = new[] { "status" }
                        }
                    }
                }
            }
        };

        var configJson = JsonSerializer.Serialize(sessionConfig);
        var configBytes = Encoding.UTF8.GetBytes(configJson);
        
        await openAiWebSocket.SendAsync(
            new ArraySegment<byte>(configBytes),
            WebSocketMessageType.Text,
            true,
            CancellationToken.None
        );

        _logger.LogInformation("Sent initial session configuration for user {UserId}", userId);
    }

    private async Task RelayMessages(WebSocket source, WebSocket destination, string direction, int userId)
    {
        var buffer = new byte[1024 * 16]; // 16KB buffer for audio data
        
        try
        {
            while (source.State == WebSocketState.Open && destination.State == WebSocketState.Open)
            {
                var result = await source.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    _logger.LogInformation("WebSocket close received from {Direction} for user {UserId}", direction, userId);
                    await destination.CloseAsync(WebSocketCloseStatus.NormalClosure, "Connection closed", CancellationToken.None);
                    break;
                }

                // Log message for debugging (be careful with audio data size)
                if (result.MessageType == WebSocketMessageType.Text)
                {
                    var message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    _logger.LogDebug("Relaying {Direction} message for user {UserId}: {MessagePreview}", 
                        direction, userId, message.Length > 100 ? message.Substring(0, 100) + "..." : message);
                }

                // Relay message to destination
                await destination.SendAsync(
                    new ArraySegment<byte>(buffer, 0, result.Count),
                    result.MessageType,
                    result.EndOfMessage,
                    CancellationToken.None
                );
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("WebSocket relay cancelled for {Direction}, user {UserId}", direction, userId);
        }
        catch (WebSocketException ex)
        {
            _logger.LogWarning(ex, "WebSocket error in {Direction} relay for user {UserId}", direction, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in {Direction} relay for user {UserId}", direction, userId);
        }
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return userId;
    }

    private Task<int> ValidateTokenAndGetUserId(string token)
    {
        return Task.Run(() =>
        {
            // For now, extract user ID from the token without full validation
            // In production, you would validate the JWT signature and expiration
            try
            {
                // Simple JWT payload extraction (for development only)
                var parts = token.Split('.');
                if (parts.Length != 3)
                {
                    throw new UnauthorizedAccessException("Invalid token format");
                }
                
                // Decode the payload (base64url)
                var payload = parts[1];
                // Add padding if needed
                while (payload.Length % 4 != 0)
                {
                    payload += "=";
                }
                
                var payloadBytes = Convert.FromBase64String(payload.Replace('-', '+').Replace('_', '/'));
                var payloadJson = Encoding.UTF8.GetString(payloadBytes);
                var payloadData = JsonSerializer.Deserialize<JsonElement>(payloadJson);
                
                // Extract user ID from sub claim first (standard JWT claim)
                if (payloadData.TryGetProperty("sub", out var subElement))
                {
                    if (int.TryParse(subElement.GetString(), out var userId))
                    {
                        return userId;
                    }
                }
                
                // Fall back to nameid claim for backward compatibility
                if (payloadData.TryGetProperty("nameid", out var userIdElement))
                {
                    if (int.TryParse(userIdElement.GetString(), out var userId))
                    {
                        return userId;
                    }
                }
                
                throw new UnauthorizedAccessException("User ID not found in token payload (checked 'sub' and 'nameid' claims)");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating token from query parameter");
                throw new UnauthorizedAccessException("Token validation failed", ex);
            }
        });
    }
}