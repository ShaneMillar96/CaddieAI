using caddie.portal.services.Models;

namespace caddie.portal.services.Interfaces;

/// <summary>
/// Service for managing OpenAI Realtime Audio API sessions
/// </summary>
public interface IRealtimeAudioService
{
    /// <summary>
    /// Create a new realtime audio session for a golf round
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Golf round ID</param>
    /// <param name="sessionConfig">Optional session configuration</param>
    /// <returns>Session information</returns>
    Task<RealtimeAudioSession> CreateSessionAsync(int userId, int roundId, RealtimeSessionConfig? sessionConfig = null);

    /// <summary>
    /// Get active session for user and round
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Golf round ID</param>
    /// <returns>Active session or null</returns>
    Task<RealtimeAudioSession?> GetActiveSessionAsync(int userId, int roundId);

    /// <summary>
    /// End realtime audio session
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    Task EndSessionAsync(string sessionId);

    /// <summary>
    /// Update session configuration (voice, instructions, etc.)
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <param name="config">Updated configuration</param>
    Task UpdateSessionConfigAsync(string sessionId, RealtimeSessionConfig config);

    /// <summary>
    /// Get session usage statistics
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="fromDate">Start date for statistics</param>
    /// <returns>Usage statistics</returns>
    Task<RealtimeUsageStats> GetUsageStatisticsAsync(int userId, DateTime? fromDate = null);

    /// <summary>
    /// Check if user has exceeded rate limits for realtime audio
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>True if rate limit exceeded</returns>
    Task<bool> IsRateLimitExceededAsync(int userId);
}