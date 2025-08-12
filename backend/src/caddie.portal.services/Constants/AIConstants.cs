namespace caddie.portal.services.Constants;

/// <summary>
/// AI and OpenAI service constants used throughout the application
/// </summary>
public static class AIConstants
{
    /// <summary>
    /// OpenAI API configuration constants
    /// </summary>
    public static class OpenAI
    {
        /// <summary>
        /// Default model for chat completions
        /// </summary>
        public static readonly string DEFAULT_MODEL = "gpt-4o-mini";

        /// <summary>
        /// Alternative model for complex reasoning tasks
        /// </summary>
        public static readonly string ADVANCED_MODEL = "gpt-4o";

        /// <summary>
        /// Maximum tokens per request for standard queries
        /// </summary>
        public static readonly int DEFAULT_MAX_TOKENS = 500;

        /// <summary>
        /// Maximum tokens per request for detailed analysis
        /// </summary>
        public static readonly int MAX_TOKENS_DETAILED = 1500;

        /// <summary>
        /// Default temperature for balanced responses
        /// </summary>
        public static readonly double DEFAULT_TEMPERATURE = 0.7;

        /// <summary>
        /// Conservative temperature for factual responses
        /// </summary>
        public static readonly double CONSERVATIVE_TEMPERATURE = 0.3;

        /// <summary>
        /// Creative temperature for varied responses
        /// </summary>
        public static readonly double CREATIVE_TEMPERATURE = 0.9;

        /// <summary>
        /// Request timeout in seconds
        /// </summary>
        public static readonly int REQUEST_TIMEOUT_SECONDS = 30;

        /// <summary>
        /// Maximum retry attempts for failed requests
        /// </summary>
        public static readonly int MAX_RETRY_ATTEMPTS = 3;

        /// <summary>
        /// Rate limiting constants
        /// </summary>
        public static class RateLimits
        {
            /// <summary>
            /// Maximum requests per minute per user
            /// </summary>
            public static readonly int MAX_REQUESTS_PER_MINUTE = 60;

            /// <summary>
            /// Maximum tokens per minute per user
            /// </summary>
            public static readonly int MAX_TOKENS_PER_MINUTE = 150000;

            /// <summary>
            /// Daily token limit per user
            /// </summary>
            public static readonly int DAILY_TOKEN_LIMIT = 50000;

            /// <summary>
            /// Hourly token limit per user
            /// </summary>
            public static readonly int HOURLY_TOKEN_LIMIT = 5000;
        }
    }

    /// <summary>
    /// Chat and conversation constants
    /// </summary>
    public static class Chat
    {
        /// <summary>
        /// Maximum message length for chat inputs
        /// </summary>
        public static readonly int MAX_MESSAGE_LENGTH = 2000;

        /// <summary>
        /// Maximum number of messages to retain in conversation context
        /// </summary>
        public static readonly int MAX_CONTEXT_MESSAGES = 20;

        /// <summary>
        /// Default session timeout in minutes
        /// </summary>
        public static readonly int SESSION_TIMEOUT_MINUTES = 30;

        /// <summary>
        /// Maximum active chat sessions per user
        /// </summary>
        public static readonly int MAX_ACTIVE_SESSIONS_PER_USER = 3;
    }

    /// <summary>
    /// Club recommendation constants
    /// </summary>
    public static class ClubRecommendation
    {
        /// <summary>
        /// Maximum number of club recommendations per request
        /// </summary>
        public static readonly int MAX_RECOMMENDATIONS_PER_REQUEST = 5;

        /// <summary>
        /// Confidence threshold for recommendations (0.0 - 1.0)
        /// </summary>
        public static readonly double MIN_CONFIDENCE_THRESHOLD = 0.6;

        /// <summary>
        /// Maximum distance variance for club selection (in meters)
        /// </summary>
        public static readonly int MAX_DISTANCE_VARIANCE_METERS = 20;
    }

    /// <summary>
    /// Voice AI and real-time audio constants
    /// </summary>
    public static class VoiceAI
    {
        /// <summary>
        /// Maximum audio recording duration in seconds
        /// </summary>
        public static readonly int MAX_RECORDING_DURATION_SECONDS = 60;

        /// <summary>
        /// Audio sample rate in Hz
        /// </summary>
        public static readonly int AUDIO_SAMPLE_RATE = 16000;

        /// <summary>
        /// Maximum audio file size in bytes (5MB)
        /// </summary>
        public static readonly int MAX_AUDIO_FILE_SIZE_BYTES = 5 * 1024 * 1024;

        /// <summary>
        /// Supported audio formats
        /// </summary>
        public static readonly string[] SUPPORTED_AUDIO_FORMATS = { "wav", "mp3", "m4a", "webm" };

        /// <summary>
        /// WebSocket connection timeout in seconds
        /// </summary>
        public static readonly int WEBSOCKET_TIMEOUT_SECONDS = 300; // 5 minutes
    }

    /// <summary>
    /// System prompt templates
    /// </summary>
    public static class SystemPrompts
    {
        /// <summary>
        /// Base caddie personality prompt
        /// </summary>
        public static readonly string CADDIE_BASE_PROMPT = "You are an AI golf caddie assistant. Provide helpful, encouraging, and knowledgeable advice about golf strategy, technique, and course management.";

        /// <summary>
        /// Club recommendation prompt template
        /// </summary>
        public static readonly string CLUB_RECOMMENDATION_PROMPT = "Based on the provided distance, wind conditions, and player skill level, recommend the most appropriate golf club and provide strategic advice.";

        /// <summary>
        /// Shot analysis prompt template
        /// </summary>
        public static readonly string SHOT_ANALYSIS_PROMPT = "Analyze the golf shot result and provide constructive feedback and suggestions for improvement.";
    }
}