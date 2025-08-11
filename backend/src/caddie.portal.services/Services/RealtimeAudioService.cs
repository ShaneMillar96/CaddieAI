using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Collections.Concurrent;
using caddie.portal.services.Configuration;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;

namespace caddie.portal.services.Services;

/// <summary>
/// Service for managing OpenAI Realtime Audio API sessions for golf interactions
/// </summary>
public class RealtimeAudioService : IRealtimeAudioService
{
    private readonly OpenAISettings _openAISettings;
    private readonly ILogger<RealtimeAudioService> _logger;
    private readonly IRoundService _roundService;
    
    // In-memory session storage (consider Redis for production)
    private readonly ConcurrentDictionary<string, RealtimeAudioSession> _activeSessions = new();
    private readonly ConcurrentDictionary<int, string> _userSessions = new(); // userId -> sessionId mapping

    public RealtimeAudioService(
        IOptions<OpenAISettings> openAISettings,
        ILogger<RealtimeAudioService> logger,
        IRoundService roundService)
    {
        _openAISettings = openAISettings.Value;
        _logger = logger;
        _roundService = roundService;
    }

    public async Task<RealtimeAudioSession> CreateSessionAsync(int userId, int roundId, RealtimeSessionConfig? sessionConfig = null)
    {
        try
        {
            // Validate round exists and belongs to user
            var round = await _roundService.GetRoundByIdAsync(roundId);
            if (round == null)
            {
                throw new ArgumentException($"Round {roundId} not found");
            }

            if (round.UserId != userId)
            {
                throw new UnauthorizedAccessException("Round does not belong to the user");
            }

            // End any existing session for this user
            if (_userSessions.TryGetValue(userId, out var existingSessionId))
            {
                await EndSessionAsync(existingSessionId);
            }

            // Create new session
            var sessionId = Guid.NewGuid().ToString();
            var session = new RealtimeAudioSession
            {
                SessionId = sessionId,
                UserId = userId,
                RoundId = roundId,
                StartedAt = DateTime.UtcNow,
                Config = sessionConfig ?? CreateDefaultGolfConfig(),
                Status = RealtimeSessionStatus.Active,
                WebSocketUrl = $"/api/realtimeaudio/connect/{roundId}",
                Metadata = new Dictionary<string, object>
                {
                    { "roundId", roundId },
                    { "courseId", round.CourseId },
                    { "startedAt", DateTime.UtcNow.ToString("O") }
                }
            };

            // Store session
            _activeSessions[sessionId] = session;
            _userSessions[userId] = sessionId;

            _logger.LogInformation("Created realtime audio session {SessionId} for user {UserId}, round {RoundId}", 
                sessionId, userId, roundId);

            return session;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating realtime audio session for user {UserId}, round {RoundId}", userId, roundId);
            throw;
        }
    }

    public async Task<RealtimeAudioSession?> GetActiveSessionAsync(int userId, int roundId)
    {
        await Task.CompletedTask; // Placeholder for async operations

        if (!_userSessions.TryGetValue(userId, out var sessionId))
        {
            return null;
        }

        if (!_activeSessions.TryGetValue(sessionId, out var session))
        {
            // Clean up orphaned user session reference
            _userSessions.TryRemove(userId, out _);
            return null;
        }

        // Verify session is for the correct round
        if (session.RoundId != roundId)
        {
            _logger.LogWarning("Session {SessionId} round mismatch: expected {ExpectedRoundId}, got {ActualRoundId}", 
                sessionId, roundId, session.RoundId);
            return null;
        }

        return session;
    }

    public async Task EndSessionAsync(string sessionId)
    {
        await Task.CompletedTask; // Placeholder for async operations

        if (_activeSessions.TryRemove(sessionId, out var session))
        {
            session.EndedAt = DateTime.UtcNow;
            session.Status = RealtimeSessionStatus.Ended;

            // Remove user session mapping
            _userSessions.TryRemove(session.UserId, out _);

            _logger.LogInformation("Ended realtime audio session {SessionId} for user {UserId}", 
                sessionId, session.UserId);
        }
    }

    public async Task UpdateSessionConfigAsync(string sessionId, RealtimeSessionConfig config)
    {
        await Task.CompletedTask; // Placeholder for async operations

        if (_activeSessions.TryGetValue(sessionId, out var session))
        {
            session.Config = config;
            _logger.LogInformation("Updated configuration for realtime audio session {SessionId}", sessionId);
        }
        else
        {
            throw new ArgumentException($"Session {sessionId} not found");
        }
    }

    public async Task<RealtimeUsageStats> GetUsageStatisticsAsync(int userId, DateTime? fromDate = null)
    {
        await Task.CompletedTask; // Placeholder for database operations

        var startDate = fromDate ?? DateTime.UtcNow.AddDays(-30);
        
        // In production, this would query a database for actual usage stats
        // For now, return default stats
        return new RealtimeUsageStats
        {
            UserId = userId,
            FromDate = startDate,
            ToDate = DateTime.UtcNow,
            TotalSessions = 0, // Would count from database
            TotalDuration = TimeSpan.Zero, // Would sum from database
            TotalAudioBytes = 0, // Would sum from logs/metrics
            EstimatedCost = 0m, // Would calculate based on usage
            Currency = "USD",
            DetailedStats = new Dictionary<string, object>
            {
                { "averageSessionDuration", TimeSpan.Zero },
                { "totalWords", 0 },
                { "totalInterruptions", 0 }
            }
        };
    }

    public async Task<bool> IsRateLimitExceededAsync(int userId)
    {
        await Task.CompletedTask; // Placeholder for rate limit checks

        // Simple rate limiting: one active session per user
        return _userSessions.ContainsKey(userId);
    }

    /// <summary>
    /// Create default configuration optimized for golf caddie interactions
    /// </summary>
    private static RealtimeSessionConfig CreateDefaultGolfConfig()
    {
        return new RealtimeSessionConfig
        {
            Instructions = @"You are an expert golf caddie AI assistant for CaddieAI. Provide brief, encouraging, and professional golf advice optimized for voice delivery.

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

            Voice = "echo", // Professional, clear voice for golf instruction
            InputAudioFormat = "pcm16",
            OutputAudioFormat = "pcm16",
            EnableInputTranscription = true,
            TranscriptionModel = "whisper-1",
            TurnDetection = new RealtimeTurnDetection
            {
                Type = "server_vad",
                Threshold = 0.5,
                PrefixPaddingMs = 300,
                SilenceDurationMs = 200
            },
            Temperature = 0.7,
            MaxResponseOutputTokens = 150
        };
    }

    /// <summary>
    /// Get all active sessions (for monitoring/debugging)
    /// </summary>
    public IEnumerable<RealtimeAudioSession> GetAllActiveSessions()
    {
        return _activeSessions.Values.Where(s => s.Status == RealtimeSessionStatus.Active);
    }

    /// <summary>
    /// Get session count for user (for rate limiting)
    /// </summary>
    public int GetUserSessionCount(int userId)
    {
        return _activeSessions.Values.Count(s => s.UserId == userId && s.Status == RealtimeSessionStatus.Active);
    }

    /// <summary>
    /// Cleanup expired sessions (call periodically)
    /// </summary>
    public async Task CleanupExpiredSessionsAsync()
    {
        await Task.CompletedTask;

        var expiredSessions = _activeSessions.Values
            .Where(s => s.Status == RealtimeSessionStatus.Active && 
                       DateTime.UtcNow.Subtract(s.StartedAt).TotalHours > 2) // 2 hour max session
            .ToList();

        foreach (var session in expiredSessions)
        {
            await EndSessionAsync(session.SessionId);
            _logger.LogInformation("Cleaned up expired session {SessionId} for user {UserId}", 
                session.SessionId, session.UserId);
        }
    }
}