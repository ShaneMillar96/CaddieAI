using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenAI;
using OpenAI.Chat;
using System.Text.Json;
using caddie.portal.services.Configuration;
using caddie.portal.services.Interfaces;
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
        _openAIClient = new OpenAIClient(_openAISettings.ApiKey);
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

            // Call OpenAI API
            var chatClient = _openAIClient.GetChatClient(_openAISettings.Model);
            var response = await chatClient.CompleteChatAsync(
                openAiMessages,
                new ChatCompletionOptions
                {
                    Temperature = (float)_openAISettings.Temperature,
                    MaxOutputTokenCount = _openAISettings.MaxTokens
                });

            if (response?.Value?.Content == null || response.Value.Content.Count == 0)
            {
                throw new InvalidOperationException("No response received from OpenAI");
            }

            var responseContent = string.Join("", response.Value.Content.Select(c => c.Text));

            // Create assistant message
            var assistantMessage = new DalChatMessage
            {
                SessionId = sessionId,
                UserId = userId,
                MessageContent = responseContent,
                OpenaiRole = "assistant",
                TokensConsumed = response.Value.Usage?.TotalTokenCount,
                OpenaiModelUsed = _openAISettings.Model,
                ContextData = JsonSerializer.Serialize(new
                {
                    PromptTokens = response.Value.Usage?.InputTokenCount,
                    CompletionTokens = response.Value.Usage?.OutputTokenCount,
                    TotalTokens = response.Value.Usage?.TotalTokenCount,
                    Model = response.Value.Model,
                    FinishReason = response.Value.FinishReason.ToString()
                })
            };

            await _chatMessageRepository.CreateAsync(assistantMessage);

            // Update session
            session.TotalMessages = (session.TotalMessages ?? 0) + 2; // User + Assistant
            session.LastMessageAt = DateTime.UtcNow;
            await _chatSessionRepository.UpdateAsync(session);

            _logger.LogInformation("Generated AI response for session {SessionId}, used {TokenCount} tokens", 
                sessionId, response.Value.Usage?.TotalTokenCount);

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

}