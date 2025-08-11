namespace caddie.portal.services.Models;

/// <summary>
/// Represents an active OpenAI Realtime Audio session
/// </summary>
public class RealtimeAudioSession
{
    public string SessionId { get; set; } = string.Empty;
    public int UserId { get; set; }
    public int RoundId { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public RealtimeSessionConfig Config { get; set; } = new();
    public RealtimeSessionStatus Status { get; set; } = RealtimeSessionStatus.Active;
    public string? WebSocketUrl { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

/// <summary>
/// Configuration for OpenAI Realtime Audio session
/// </summary>
public class RealtimeSessionConfig
{
    /// <summary>
    /// System instructions for the AI caddie
    /// </summary>
    public string Instructions { get; set; } = @"You are an expert golf caddie AI assistant for CaddieAI. Provide brief, encouraging, and professional golf advice optimized for voice delivery.

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
- Adapt communication to the golfer's skill level";

    /// <summary>
    /// Voice model to use (alloy, echo, fable, onyx, nova, shimmer)
    /// </summary>
    public string Voice { get; set; } = "echo";

    /// <summary>
    /// Audio input format
    /// </summary>
    public string InputAudioFormat { get; set; } = "pcm16";

    /// <summary>
    /// Audio output format
    /// </summary>
    public string OutputAudioFormat { get; set; } = "pcm16";

    /// <summary>
    /// Enable input audio transcription
    /// </summary>
    public bool EnableInputTranscription { get; set; } = true;

    /// <summary>
    /// Input transcription model
    /// </summary>
    public string TranscriptionModel { get; set; } = "whisper-1";

    /// <summary>
    /// Turn detection configuration
    /// </summary>
    public RealtimeTurnDetection TurnDetection { get; set; } = new();

    /// <summary>
    /// Session temperature for response generation
    /// </summary>
    public double Temperature { get; set; } = 0.7;

    /// <summary>
    /// Maximum response length in tokens
    /// </summary>
    public int? MaxResponseOutputTokens { get; set; } = 150;
}

/// <summary>
/// Turn detection configuration for voice activity detection
/// </summary>
public class RealtimeTurnDetection
{
    /// <summary>
    /// Type of turn detection: server_vad, none
    /// </summary>
    public string Type { get; set; } = "server_vad";

    /// <summary>
    /// VAD threshold (0.0 to 1.0)
    /// </summary>
    public double Threshold { get; set; } = 0.5;

    /// <summary>
    /// Prefix padding in milliseconds
    /// </summary>
    public int PrefixPaddingMs { get; set; } = 300;

    /// <summary>
    /// Silence duration in milliseconds before turn ends
    /// </summary>
    public int SilenceDurationMs { get; set; } = 200;
}

/// <summary>
/// Status of a realtime audio session
/// </summary>
public enum RealtimeSessionStatus
{
    Active,
    Paused,
    Ended,
    Error
}

/// <summary>
/// Usage statistics for realtime audio sessions
/// </summary>
public class RealtimeUsageStats
{
    public int UserId { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int TotalSessions { get; set; }
    public TimeSpan TotalDuration { get; set; }
    public int TotalAudioBytes { get; set; }
    public decimal EstimatedCost { get; set; }
    public string Currency { get; set; } = "USD";
    public Dictionary<string, object>? DetailedStats { get; set; }
}

/// <summary>
/// Request model for creating realtime audio session
/// </summary>
public class CreateRealtimeSessionRequest
{
    public int UserId { get; set; }
    public int RoundId { get; set; }
    public RealtimeSessionConfig? Config { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

/// <summary>
/// Response model for realtime audio session creation
/// </summary>
public class CreateRealtimeSessionResponse
{
    public string SessionId { get; set; } = string.Empty;
    public string WebSocketUrl { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public RealtimeSessionConfig Config { get; set; } = new();
    public bool Success { get; set; } = true;
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Golf-specific function tools for realtime audio
/// </summary>
public class RealtimeGolfTool
{
    public string Type { get; set; } = "function";
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public object Parameters { get; set; } = new();
}

/// <summary>
/// Realtime audio event types for golf scenarios
/// </summary>
public enum RealtimeGolfEvent
{
    ShotPlacementStarted,
    ClubRecommendationRequested,
    ShotTrackingActivated,
    ShotCompleted,
    HoleCompleted,
    WeatherUpdate,
    CourseStrategyRequest,
    ErrorOccurred
}