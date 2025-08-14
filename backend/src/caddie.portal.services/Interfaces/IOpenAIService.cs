using caddie.portal.services.Models;

namespace caddie.portal.services.Interfaces;

public interface IOpenAIService
{
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
    Task<string> GenerateVoiceGolfAdviceAsync(int userId, int roundId, string userInput, object locationContext);

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

    // Dynamic Caddie Response Methods

    /// <summary>
    /// Generate dynamic caddie response for specific golf scenarios
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Round ID</param>
    /// <param name="scenario">Caddie scenario for response generation</param>
    /// <param name="context">Comprehensive golf context</param>
    /// <param name="userInput">Optional user input for context</param>
    Task<string> GenerateCaddieResponseAsync(int userId, int roundId, CaddieScenario scenario, CaddieContext? context = null, string? userInput = null);

    /// <summary>
    /// Build caddie-optimized prompt for specific scenarios
    /// </summary>
    /// <param name="scenario">Caddie scenario</param>
    /// <param name="context">Golf context</param>
    /// <param name="userInput">Optional user input</param>
    Task<string> BuildCaddiePromptAsync(CaddieScenario scenario, CaddieContext? context = null, string? userInput = null);

    /// <summary>
    /// Optimize response text for text-to-speech delivery
    /// </summary>
    /// <param name="text">Raw AI response text</param>
    /// <param name="scenario">Caddie scenario context</param>
    Task<string> OptimizeForTTSAsync(string text, CaddieScenario scenario);
}