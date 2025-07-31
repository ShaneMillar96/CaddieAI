using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenAI;
using OpenAI.Chat;
using System.Text.Json;
using caddie.portal.services.Configuration;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Exceptions;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories.Interfaces;
using OpenAIChatMessage = OpenAI.Chat.ChatMessage;
using DalChatMessage = caddie.portal.dal.Models.ChatMessage;

namespace caddie.portal.services.Services;

public class OpenAIService : IOpenAIService
{
    private readonly IChatSessionRepository _chatSessionRepository;
    private readonly IChatMessageRepository _chatMessageRepository;
    private readonly IGolfContextService _golfContextService;
    private readonly OpenAISettings _openAISettings;
    private readonly ILogger<OpenAIService> _logger;
    private readonly OpenAIClient _openAIClient;

    public OpenAIService(
        IChatSessionRepository chatSessionRepository,
        IChatMessageRepository chatMessageRepository,
        IGolfContextService golfContextService,
        IOptions<OpenAISettings> openAISettings,
        ILogger<OpenAIService> logger)
    {
        _chatSessionRepository = chatSessionRepository;
        _chatMessageRepository = chatMessageRepository;
        _golfContextService = golfContextService;
        _openAISettings = openAISettings.Value;
        _logger = logger;
        
        // Get API key from environment variable or configuration
        var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? _openAISettings.ApiKey;
        if (string.IsNullOrEmpty(apiKey))
        {
            throw new InvalidOperationException("OpenAI API key not configured. Set OPENAI_API_KEY environment variable.");
        }
        
        _openAIClient = new OpenAIClient(apiKey);
    }

    public async Task<ChatSession> StartChatSessionAsync(int userId, int? roundId = null, int? courseId = null, string? sessionName = null)
    {
        try
        {
            // Generate golf context
            var golfContext = await _golfContextService.GenerateContextAsync(userId, roundId, courseId);
            
            // Create system prompt based on context
            var systemPrompt = await _golfContextService.GenerateSystemPromptAsync(golfContext);
            
            // Serialize context data
            var contextData = JsonSerializer.Serialize(golfContext);

            var session = new ChatSession
            {
                UserId = userId,
                RoundId = roundId,
                CourseId = courseId,
                SessionName = sessionName ?? $"Golf Session {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
                ContextData = contextData,
                OpenaiModel = _openAISettings.Model,
                SystemPrompt = systemPrompt,
                Temperature = (decimal)_openAISettings.Temperature,
                MaxTokens = _openAISettings.MaxTokens,
                TotalMessages = 0,
                SessionMetadata = JsonSerializer.Serialize(new
                {
                    StartedAt = DateTime.UtcNow,
                    UserAgent = "CaddieAI Mobile App",
                    Settings = new
                    {
                        Model = _openAISettings.Model,
                        Temperature = _openAISettings.Temperature,
                        MaxTokens = _openAISettings.MaxTokens
                    }
                })
            };

            var createdSession = await _chatSessionRepository.CreateAsync(session);
            _logger.LogInformation("Started chat session {SessionId} for user {UserId}", createdSession.Id, userId);
            
            return createdSession;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting chat session for user {UserId}", userId);
            throw;
        }
    }

    public async Task<DalChatMessage> SendMessageAsync(int sessionId, int userId, string message)
    {
        try
        {
            // Check rate limits
            if (await IsRateLimitExceededAsync(userId))
            {
                throw new InvalidOperationException("Rate limit exceeded. Please wait before sending another message.");
            }

            // Get session with context
            var session = await _chatSessionRepository.GetByIdWithMessagesAsync(sessionId);
            if (session == null || session.UserId != userId)
            {
                throw new ArgumentException($"Chat session {sessionId} not found or access denied");
            }

            // Create user message
            var userMessage = new DalChatMessage
            {
                SessionId = sessionId,
                UserId = userId,
                MessageContent = message,
                OpenaiRole = "user",
                OpenaiModelUsed = _openAISettings.Model
            };

            await _chatMessageRepository.CreateAsync(userMessage);

            // Prepare OpenAI chat messages
            var chatMessages = new List<DalChatMessage>();
            
            // Add system message if this is the start of conversation
            if (session.ChatMessages.Count == 0)
            {
                chatMessages.Add(new DalChatMessage
                {
                    SessionId = sessionId,
                    UserId = userId,
                    MessageContent = session.SystemPrompt ?? "You are CaddieAI, a helpful golf assistant.",
                    OpenaiRole = "system",
                    OpenaiModelUsed = _openAISettings.Model
                });
            }

            // Add conversation history (limited to recent messages for token management)
            var recentMessages = session.ChatMessages
                .OrderByDescending(m => m.CreatedAt)
                .Take(20)
                .OrderBy(m => m.CreatedAt)
                .ToList();

            chatMessages.AddRange(recentMessages);
            chatMessages.Add(userMessage);

            // Convert to OpenAI format
            var openAiMessages = chatMessages.Select<DalChatMessage, OpenAIChatMessage>(m => 
                m.OpenaiRole switch
                {
                    "system" => OpenAIChatMessage.CreateSystemMessage(m.MessageContent),
                    "user" => OpenAIChatMessage.CreateUserMessage(m.MessageContent),
                    "assistant" => OpenAIChatMessage.CreateAssistantMessage(m.MessageContent),
                    _ => OpenAIChatMessage.CreateUserMessage(m.MessageContent)
                }).ToList();

            // Call OpenAI API with error handling
            var chatClient = _openAIClient.GetChatClient(_openAISettings.Model);
            ChatCompletion response;
            
            try
            {
                response = await chatClient.CompleteChatAsync(
                    openAiMessages,
                    new ChatCompletionOptions
                    {
                        Temperature = (float)_openAISettings.Temperature,
                        MaxOutputTokenCount = _openAISettings.MaxTokens
                    });
            }
            catch (Exception ex) when (IsQuotaExceededException(ex))
            {
                _logger.LogWarning(ex, "OpenAI quota exceeded for user {UserId}, session {SessionId}", userId, sessionId);
                
                if (_openAISettings.EnableFallbackResponses)
                {
                    var fallbackResponse = GetFallbackChatResponse(message);
                    return await CreateFallbackChatMessageAsync(sessionId, userId, fallbackResponse);
                }
                
                throw new OpenAIQuotaExceededException("OpenAI quota exceeded. Please try again later.", "api_quota", 3600);
            }

            if (response?.Content == null || response.Content.Count == 0)
            {
                throw new InvalidOperationException("No response received from OpenAI");
            }

            var responseContent = string.Join("", response.Content.Select(c => c.Text));

            // Create assistant message
            var assistantMessage = new DalChatMessage
            {
                SessionId = sessionId,
                UserId = userId,
                MessageContent = responseContent,
                OpenaiRole = "assistant",
                TokensConsumed = response.Usage?.TotalTokenCount,
                OpenaiModelUsed = _openAISettings.Model,
                ContextData = JsonSerializer.Serialize(new
                {
                    PromptTokens = response.Usage?.InputTokenCount,
                    CompletionTokens = response.Usage?.OutputTokenCount,
                    TotalTokens = response.Usage?.TotalTokenCount,
                    Model = response.Model,
                    FinishReason = response.FinishReason.ToString()
                })
            };

            await _chatMessageRepository.CreateAsync(assistantMessage);

            // Update session
            session.TotalMessages = (session.TotalMessages ?? 0) + 2; // User + Assistant
            session.LastMessageAt = DateTime.UtcNow;
            await _chatSessionRepository.UpdateAsync(session);

            _logger.LogInformation("Generated AI response for session {SessionId}, used {TokenCount} tokens", 
                sessionId, response.Usage?.TotalTokenCount);

            return assistantMessage;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message to session {SessionId}", sessionId);
            throw;
        }
    }

    public async Task<ChatSession?> GetChatSessionAsync(int sessionId, int userId)
    {
        try
        {
            var session = await _chatSessionRepository.GetByIdWithMessagesAsync(sessionId);
            return session?.UserId == userId ? session : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting chat session {SessionId}", sessionId);
            throw;
        }
    }

    public async Task<IEnumerable<ChatSession>> GetUserChatSessionsAsync(int userId, bool includeMessages = false)
    {
        try
        {
            return await _chatSessionRepository.GetByUserIdAsync(userId, includeMessages);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting chat sessions for user {UserId}", userId);
            throw;
        }
    }

    public async Task<ChatSession?> GetActiveChatSessionForRoundAsync(int userId, int roundId)
    {
        try
        {
            return await _chatSessionRepository.GetActiveSessionForRoundAsync(userId, roundId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active session for round {RoundId}", roundId);
            throw;
        }
    }

    public async Task UpdateSessionContextAsync(int sessionId, string contextData)
    {
        try
        {
            var session = await _chatSessionRepository.GetByIdAsync(sessionId);
            if (session == null)
            {
                throw new ArgumentException($"Session {sessionId} not found");
            }

            session.ContextData = contextData;
            await _chatSessionRepository.UpdateAsync(session);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating context for session {SessionId}", sessionId);
            throw;
        }
    }

    public async Task EndChatSessionAsync(int sessionId, int userId)
    {
        try
        {
            var session = await _chatSessionRepository.GetByIdAsync(sessionId);
            if (session == null || session.UserId != userId)
            {
                throw new ArgumentException($"Session {sessionId} not found or access denied");
            }

            // Update session metadata to mark as ended
            var metadata = JsonSerializer.Deserialize<Dictionary<string, object>>(session.SessionMetadata ?? "{}") ?? new Dictionary<string, object>();
            metadata["EndedAt"] = DateTime.UtcNow;
            metadata["Status"] = "Ended";
            
            session.SessionMetadata = JsonSerializer.Serialize(metadata);
            await _chatSessionRepository.UpdateAsync(session);

            _logger.LogInformation("Ended chat session {SessionId} for user {UserId}", sessionId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ending chat session {SessionId}", sessionId);
            throw;
        }
    }

    public async Task<IEnumerable<DalChatMessage>> GetConversationHistoryAsync(int sessionId, int userId, int limit = 50)
    {
        try
        {
            var session = await _chatSessionRepository.GetByIdAsync(sessionId);
            if (session == null || session.UserId != userId)
            {
                throw new ArgumentException($"Session {sessionId} not found or access denied");
            }

            return await _chatMessageRepository.GetBySessionIdAsync(sessionId, limit);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting conversation history for session {SessionId}", sessionId);
            throw;
        }
    }

    public async Task<bool> IsRateLimitExceededAsync(int userId)
    {
        try
        {
            var recentMessages = await _chatMessageRepository.GetRecentByUserAsync(userId, 60); // Last hour
            var messageCount = recentMessages.Count();
            
            // Simple rate limiting: max requests per minute from settings
            var maxPerHour = _openAISettings.MaxRequestsPerMinute * 60;
            
            return messageCount >= maxPerHour;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking rate limit for user {UserId}", userId);
            return false; // Allow on error
        }
    }

    public async Task<(int TotalTokens, int TotalMessages, decimal EstimatedCost)> GetUsageStatisticsAsync(int userId, DateTime? fromDate = null)
    {
        try
        {
            var effectiveFromDate = fromDate ?? DateTime.UtcNow.AddDays(-30);
            
            var totalTokens = await _chatMessageRepository.GetTokenUsageAsync(userId, effectiveFromDate);
            var totalMessages = await _chatMessageRepository.GetMessageCountAsync(userId, effectiveFromDate);
            
            // Rough cost estimation (adjust based on current OpenAI pricing)
            var estimatedCost = totalTokens * 0.00002m; // $0.02 per 1K tokens (approximate)
            
            return (totalTokens, totalMessages, estimatedCost);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting usage statistics for user {UserId}", userId);
            throw;
        }
    }

    // Voice AI Integration Methods Implementation

    public async Task<string> GenerateVoiceGolfAdviceAsync(int userId, int roundId, string userInput, object locationContext, IEnumerable<DalChatMessage>? conversationHistory = null)
    {
        try
        {
            // Generate voice-optimized golf context
            var golfContext = await _golfContextService.GenerateContextAsync(userId, roundId);
            
            // Build voice-specific system prompt
            var voiceSystemPrompt = await BuildVoiceSystemPromptAsync(userId, roundId, golfContext.Course?.CourseId ?? 0, golfContext.CurrentHole?.HoleNumber ?? 1, locationContext);
            
            // Prepare conversation history
            var messages = new List<OpenAIChatMessage>
            {
                OpenAIChatMessage.CreateSystemMessage(voiceSystemPrompt)
            };

            // Add recent conversation history if provided (limit to last 6 messages for voice context)
            if (conversationHistory != null && conversationHistory.Any())
            {
                var recentHistory = conversationHistory
                    .OrderByDescending(m => m.CreatedAt)
                    .Take(6)
                    .OrderBy(m => m.CreatedAt);

                foreach (var msg in recentHistory)
                {
                    OpenAIChatMessage message = msg.OpenaiRole switch
                    {
                        "user" => OpenAIChatMessage.CreateUserMessage(msg.MessageContent),
                        "assistant" => OpenAIChatMessage.CreateAssistantMessage(msg.MessageContent),
                        _ => OpenAIChatMessage.CreateUserMessage(msg.MessageContent)
                    };
                    messages.Add(message);
                }
            }

            // Add current user input
            messages.Add(OpenAIChatMessage.CreateUserMessage(userInput));

            // Call OpenAI API with voice-optimized settings, retry logic, and error handling
            var chatClient = _openAIClient.GetChatClient(_openAISettings.Model);
            ChatCompletion response;
            
            try
            {
                response = await ExecuteWithRetryAsync(async () =>
                    await chatClient.CompleteChatAsync(
                        messages,
                        new ChatCompletionOptions
                        {
                            Temperature = 0.7f, // Slightly higher for conversational tone
                            MaxOutputTokenCount = 150, // Shorter responses for voice
                            FrequencyPenalty = 0.1f, // Reduce repetition
                            PresencePenalty = 0.1f // Encourage variety
                        }));
            }
            catch (Exception ex) when (IsQuotaExceededException(ex))
            {
                _logger.LogWarning(ex, "OpenAI quota exceeded for voice advice, user {UserId}, round {RoundId}", userId, roundId);
                
                if (_openAISettings.EnableFallbackResponses)
                {
                    return GetFallbackVoiceAdvice(userInput);
                }
                
                throw new OpenAIQuotaExceededException("OpenAI quota exceeded. Please try again later.", "api_quota", 3600);
            }

            if (response?.Content == null || response.Content.Count == 0)
            {
                throw new InvalidOperationException("No response received from OpenAI");
            }

            var responseContent = string.Join("", response.Content.Select(c => c.Text));

            _logger.LogInformation("Generated voice golf advice for user {UserId}, round {RoundId}, used {TokenCount} tokens", 
                userId, roundId, response.Usage?.TotalTokenCount);

            return responseContent;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating voice golf advice for user {UserId}, round {RoundId}", userId, roundId);
            throw;
        }
    }

    public async Task UpdateLocationContextAsync(int userId, int roundId, decimal latitude, decimal longitude, int? currentHole = null, decimal? distanceToPin = null)
    {
        try
        {
            // Get active session for this round
            var session = await _chatSessionRepository.GetActiveSessionForRoundAsync(userId, roundId);
            if (session == null)
            {
                _logger.LogWarning("No active chat session found for user {UserId}, round {RoundId}", userId, roundId);
                return;
            }

            // Update context with location data
            var locationContext = new
            {
                Latitude = latitude,
                Longitude = longitude,
                CurrentHole = currentHole,
                DistanceToPin = distanceToPin,
                UpdatedAt = DateTime.UtcNow
            };

            // Merge with existing context
            var existingContext = string.IsNullOrEmpty(session.ContextData) 
                ? new Dictionary<string, object>() 
                : JsonSerializer.Deserialize<Dictionary<string, object>>(session.ContextData) ?? new Dictionary<string, object>();

            existingContext["LocationContext"] = locationContext;
            
            session.ContextData = JsonSerializer.Serialize(existingContext);
            await _chatSessionRepository.UpdateAsync(session);

            _logger.LogDebug("Updated location context for user {UserId}, round {RoundId}", userId, roundId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating location context for user {UserId}, round {RoundId}", userId, roundId);
            throw;
        }
    }

    public async Task<string> GenerateHoleCompletionCommentaryAsync(int userId, int roundId, int holeNumber, int score, int par, object? shotData = null)
    {
        try
        {
            var golfContext = await _golfContextService.GenerateContextAsync(userId, roundId);
            
            var commentaryPrompt = $@"
You are CaddieAI providing encouraging hole completion commentary. Keep it brief and positive for voice delivery.

Hole Information:
- Hole {holeNumber} (Par {par})
- Player Score: {score}
- Result: {GetScoreDescription(score, par)}

Course Context: {golfContext.Course?.Name ?? "Unknown Course"}

Provide a brief, encouraging comment about the hole performance. Maximum 2 sentences. Be conversational and supportive.

Examples:
- ""Nice par on hole 3! That approach shot set you up perfectly.""
- ""Tough break on the water hazard, but great recovery for bogey. Shake it off and focus on the next hole.""
- ""Excellent birdie! Your putting has been spot on today.""
";

            var messages = new List<OpenAIChatMessage>
            {
                OpenAIChatMessage.CreateSystemMessage(commentaryPrompt)
            };

            var chatClient = _openAIClient.GetChatClient(_openAISettings.Model);
            ChatCompletion response;
            
            try
            {
                response = await chatClient.CompleteChatAsync(
                    messages,
                    new ChatCompletionOptions
                    {
                        Temperature = 0.8f, // Higher creativity for commentary
                        MaxOutputTokenCount = 100 // Very brief for voice
                    });
            }
            catch (Exception ex) when (IsQuotaExceededException(ex))
            {
                _logger.LogWarning(ex, "OpenAI quota exceeded for hole commentary, user {UserId}, round {RoundId}, hole {HoleNumber}", userId, roundId, holeNumber);
                return GetDefaultHoleCommentary(score, par);
            }

            if (response?.Content == null || response.Content.Count == 0)
            {
                return GetDefaultHoleCommentary(score, par);
            }

            var commentary = string.Join("", response.Content.Select(c => c.Text));
            
            _logger.LogInformation("Generated hole completion commentary for user {UserId}, round {RoundId}, hole {HoleNumber}", 
                userId, roundId, holeNumber);

            return commentary;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating hole completion commentary for user {UserId}, round {RoundId}, hole {HoleNumber}", 
                userId, roundId, holeNumber);
            
            // Return default commentary on error
            return GetDefaultHoleCommentary(score, par);
        }
    }

    public async Task<string> BuildVoiceSystemPromptAsync(int userId, int roundId, int courseId, int? currentHole = null, object? locationContext = null)
    {
        try
        {
            var golfContext = await _golfContextService.GenerateContextAsync(userId, roundId, courseId);
            
            // Get user skill level for appropriate prompt
            var userSkillLevel = golfContext.User?.SkillLevel ?? "intermediate";
            
            // Build voice-optimized system prompt using existing SystemPrompts
            var basePrompt = Configuration.SystemPrompts.GetPromptForContext(
                userSkillLevel, 
                golfContext.User?.PlayingStyle, 
                null
            );

            // Add voice-specific enhancements
            var voiceEnhancements = @"

VOICE INTERACTION GUIDELINES:
- Keep responses under 30 seconds of speech (approximately 75-100 words)
- Use conversational, natural language as if speaking to a friend
- Provide specific, actionable advice without overwhelming detail
- Acknowledge the player's situation and location context
- Be encouraging and supportive, especially during challenges
- Use appropriate golf terminology but explain when necessary
- Ask clarifying questions if context is unclear

CURRENT ROUND CONTEXT:";

            // Add current context information
            var contextInfo = $@"
Course: {golfContext.Course?.Name ?? "Unknown Course"}
Current Hole: {currentHole ?? golfContext.CurrentHole?.HoleNumber ?? 1}
Round Status: {golfContext.Round?.Status ?? "Unknown"}
Weather: {golfContext.Weather?.Conditions ?? "Unknown"}";

            // Add location context if provided
            if (locationContext != null)
            {
                var locationJson = JsonSerializer.Serialize(locationContext);
                contextInfo += $@"
Location Context: {locationJson}";
            }

            return basePrompt + voiceEnhancements + contextInfo;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error building voice system prompt for user {UserId}, round {RoundId}", userId, roundId);
            
            // Return default voice prompt on error
            return Configuration.SystemPrompts.Golf.EncouragingCaddie + @"

VOICE INTERACTION: Keep responses brief and conversational for voice delivery. Provide specific golf advice in under 30 seconds.";
        }
    }

    private static string GetScoreDescription(int score, int par)
    {
        return (score - par) switch
        {
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

    private static string GetDefaultHoleCommentary(int score, int par)
    {
        return (score - par) switch
        {
            <= -1 => "Great job on that hole! Keep up the excellent play.",
            0 => "Nice par! Solid golf right there.",
            1 => "Good bogey. Stay positive and focus on the next hole.",
            _ => "Tough hole, but that's golf! Let's bounce back on the next one."
        };
    }

    private static bool IsQuotaExceededException(Exception ex)
    {
        return ex.Message.Contains("insufficient_quota") || 
               ex.Message.Contains("quota exceeded") ||
               ex.Message.Contains("429") ||
               (ex.GetType().Name.Contains("OpenAI") && ex.Message.Contains("rate limit"));
    }

    private string GetFallbackChatResponse(string userMessage)
    {
        var lowerMessage = userMessage.ToLower();
        
        if (lowerMessage.Contains("club") || lowerMessage.Contains("what should i hit"))
        {
            return "I'm temporarily unable to access detailed club recommendations. Consider the distance to the pin, wind conditions, and your comfort level with each club. When in doubt, take one more club than you think you need.";
        }
        
        if (lowerMessage.Contains("distance") || lowerMessage.Contains("yardage"))
        {
            return "I can't access precise distance calculations right now. Use your GPS device or course markers to estimate yardage. Remember to account for pin position and any elevation changes.";
        }
        
        if (lowerMessage.Contains("strategy") || lowerMessage.Contains("approach"))
        {
            return "For course strategy, focus on playing to your strengths. Aim for the center of greens, avoid trouble areas, and play within your skill level. Conservative play often leads to better scores.";
        }
        
        if (lowerMessage.Contains("putt") || lowerMessage.Contains("green"))
        {
            return "For putting, read the green carefully for slope and grain. Take your time with alignment and focus on smooth tempo. Aim to get the ball close to the hole for an easy second putt.";
        }
        
        return "I'm experiencing temporary connectivity issues with my advanced analysis. Focus on fundamentals: good setup, smooth tempo, and course management. You've got this!";
    }

    private string GetFallbackVoiceAdvice(string userInput)
    {
        var lowerInput = userInput.ToLower();
        
        if (lowerInput.Contains("club") || lowerInput.Contains("what club"))
        {
            return "Consider the distance, wind, and lie. When unsure, take one more club and swing smooth.";
        }
        
        if (lowerInput.Contains("putt") || lowerInput.Contains("putting"))
        {
            return "Read the slope, trust your line, and focus on smooth tempo. You've got this putt.";
        }
        
        if (lowerInput.Contains("shot") || lowerInput.Contains("approach"))
        {
            return "Pick your target, commit to the shot, and trust your swing. Play smart and within your comfort zone.";
        }
        
        if (lowerInput.Contains("help") || lowerInput.Contains("advice"))
        {
            return "Stay positive and focus on one shot at a time. Trust your preparation and play your game.";
        }
        
        return "Keep your head up and play smart. You're doing great out there!";
    }

    private async Task<DalChatMessage> CreateFallbackChatMessageAsync(int sessionId, int userId, string fallbackContent)
    {
        var assistantMessage = new DalChatMessage
        {
            SessionId = sessionId,
            UserId = userId,
            MessageContent = fallbackContent,
            OpenaiRole = "assistant",
            TokensConsumed = 0, // No tokens consumed for fallback
            OpenaiModelUsed = "fallback-response",
            ContextData = JsonSerializer.Serialize(new
            {
                IsFallbackResponse = true,
                FallbackReason = "OpenAI quota exceeded",
                GeneratedAt = DateTime.UtcNow
            })
        };

        await _chatMessageRepository.CreateAsync(assistantMessage);
        return assistantMessage;
    }

    private async Task<T> ExecuteWithRetryAsync<T>(Func<Task<T>> operation, int maxRetries = 3)
    {
        var baseDelay = TimeSpan.FromSeconds(1);
        
        for (int attempt = 0; attempt <= maxRetries; attempt++)
        {
            try
            {
                return await operation();
            }
            catch (Exception ex) when (IsRetryableException(ex) && attempt < maxRetries)
            {
                var delay = TimeSpan.FromMilliseconds(baseDelay.TotalMilliseconds * Math.Pow(2, attempt));
                _logger.LogWarning(ex, "Attempt {Attempt} failed, retrying in {Delay}ms", attempt + 1, delay.TotalMilliseconds);
                
                await Task.Delay(delay);
            }
        }
        
        // Final attempt without catching exceptions
        return await operation();
    }

    private static bool IsRetryableException(Exception ex)
    {
        // Retry on network errors, timeouts, but not quota exceeded
        return !IsQuotaExceededException(ex) && 
               (ex.Message.Contains("timeout") || 
                ex.Message.Contains("network") ||
                ex.Message.Contains("connection") ||
                ex.Message.Contains("502") ||
                ex.Message.Contains("503") ||
                ex.Message.Contains("504"));
    }

}