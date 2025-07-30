using caddie.portal.dal.Models;
using DalChatMessage = caddie.portal.dal.Models.ChatMessage;

namespace caddie.portal.services.Interfaces;

public interface IOpenAIService
{
    /// <summary>
    /// Start a new chat session with AI caddie
    /// </summary>
    /// <param name="userId">User starting the session</param>
    /// <param name="roundId">Optional: current round ID for context</param>
    /// <param name="courseId">Optional: course ID for context</param>
    /// <param name="sessionName">Optional: custom name for the session</param>
    Task<ChatSession> StartChatSessionAsync(int userId, int? roundId = null, int? courseId = null, string? sessionName = null);

    /// <summary>
    /// Send a message to the AI and get a response
    /// </summary>
    /// <param name="sessionId">Chat session ID</param>
    /// <param name="userId">User sending the message</param>
    /// <param name="message">User's message content</param>
    Task<DalChatMessage> SendMessageAsync(int sessionId, int userId, string message);

    /// <summary>
    /// Get chat session by ID with messages
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <param name="userId">User ID for authorization</param>
    Task<ChatSession?> GetChatSessionAsync(int sessionId, int userId);

    /// <summary>
    /// Get all chat sessions for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="includeMessages">Whether to include message history</param>
    Task<IEnumerable<ChatSession>> GetUserChatSessionsAsync(int userId, bool includeMessages = false);

    /// <summary>
    /// Get active chat session for current round
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Round ID</param>
    Task<ChatSession?> GetActiveChatSessionForRoundAsync(int userId, int roundId);

    /// <summary>
    /// Update chat session context (when course or round changes)
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <param name="contextData">Updated context information</param>
    Task UpdateSessionContextAsync(int sessionId, string contextData);

    /// <summary>
    /// End a chat session
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <param name="userId">User ID for authorization</param>
    Task EndChatSessionAsync(int sessionId, int userId);

    /// <summary>
    /// Get conversation history for a session
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <param name="userId">User ID for authorization</param>
    /// <param name="limit">Maximum number of messages to return</param>
    Task<IEnumerable<DalChatMessage>> GetConversationHistoryAsync(int sessionId, int userId, int limit = 50);

    /// <summary>
    /// Check if user has exceeded rate limits
    /// </summary>
    /// <param name="userId">User ID to check</param>
    Task<bool> IsRateLimitExceededAsync(int userId);

    /// <summary>
    /// Get token usage statistics for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="fromDate">Start date for statistics</param>
    Task<(int TotalTokens, int TotalMessages, decimal EstimatedCost)> GetUsageStatisticsAsync(int userId, DateTime? fromDate = null);

    // Voice AI Integration Methods

    /// <summary>
    /// Generate voice-optimized golf advice based on current context
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Current round ID</param>
    /// <param name="userInput">Voice input from user</param>
    /// <param name="locationContext">Current location context</param>
    /// <param name="conversationHistory">Recent conversation history</param>
    Task<string> GenerateVoiceGolfAdviceAsync(int userId, int roundId, string userInput, object locationContext, IEnumerable<DalChatMessage>? conversationHistory = null);

    /// <summary>
    /// Create or update AI context for real-time location updates
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Round ID</param>
    /// <param name="latitude">Current latitude</param>
    /// <param name="longitude">Current longitude</param>
    /// <param name="currentHole">Current hole number</param>
    /// <param name="distanceToPin">Distance to pin in meters</param>
    Task UpdateLocationContextAsync(int userId, int roundId, decimal latitude, decimal longitude, int? currentHole = null, decimal? distanceToPin = null);

    /// <summary>
    /// Generate AI commentary for hole completion
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Round ID</param>
    /// <param name="holeNumber">Completed hole number</param>
    /// <param name="score">Hole score</param>
    /// <param name="par">Hole par</param>
    /// <param name="shotData">Shot data for the hole</param>
    Task<string> GenerateHoleCompletionCommentaryAsync(int userId, int roundId, int holeNumber, int score, int par, object? shotData = null);

    /// <summary>
    /// Build voice-optimized system prompt for current golf context
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Round ID</param>
    /// <param name="courseId">Course ID</param>
    /// <param name="currentHole">Current hole</param>
    /// <param name="locationContext">Location context</param>
    Task<string> BuildVoiceSystemPromptAsync(int userId, int roundId, int courseId, int? currentHole = null, object? locationContext = null);
}