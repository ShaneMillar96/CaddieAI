namespace caddie.portal.services.Constants;

/// <summary>
/// API-related constants used throughout the application
/// </summary>
public static class ApiConstants
{
    /// <summary>
    /// HTTP response constants
    /// </summary>
    public static class Http
    {
        /// <summary>
        /// Standard API response messages
        /// </summary>
        public static class Messages
        {
            public static readonly string SUCCESS = "Operation completed successfully";
            public static readonly string CREATED = "Resource created successfully";
            public static readonly string UPDATED = "Resource updated successfully";
            public static readonly string DELETED = "Resource deleted successfully";
            public static readonly string NOT_FOUND = "Resource not found";
            public static readonly string UNAUTHORIZED = "Authentication required";
            public static readonly string FORBIDDEN = "Access forbidden";
            public static readonly string BAD_REQUEST = "Invalid request data";
            public static readonly string INTERNAL_ERROR = "An internal server error occurred";
            public static readonly string SERVICE_UNAVAILABLE = "Service temporarily unavailable";
        }

        /// <summary>
        /// Common HTTP headers
        /// </summary>
        public static class Headers
        {
            public static readonly string AUTHORIZATION = "Authorization";
            public static readonly string CONTENT_TYPE = "Content-Type";
            public static readonly string USER_AGENT = "User-Agent";
            public static readonly string CORRELATION_ID = "X-Correlation-ID";
            public static readonly string API_VERSION = "X-API-Version";
        }

        /// <summary>
        /// Content type constants
        /// </summary>
        public static class ContentTypes
        {
            public static readonly string APPLICATION_JSON = "application/json";
            public static readonly string APPLICATION_XML = "application/xml";
            public static readonly string TEXT_PLAIN = "text/plain";
            public static readonly string MULTIPART_FORM_DATA = "multipart/form-data";
        }
    }

    /// <summary>
    /// API versioning constants
    /// </summary>
    public static class Versioning
    {
        /// <summary>
        /// Current API version
        /// </summary>
        public static readonly string CURRENT_VERSION = "v1";

        /// <summary>
        /// Supported API versions
        /// </summary>
        public static readonly string[] SUPPORTED_VERSIONS = { "v1" };

        /// <summary>
        /// Version header name
        /// </summary>
        public static readonly string VERSION_HEADER = "X-API-Version";
    }

    /// <summary>
    /// Pagination constants
    /// </summary>
    public static class Pagination
    {
        /// <summary>
        /// Default page size for API responses
        /// </summary>
        public static readonly int DEFAULT_PAGE_SIZE = 20;

        /// <summary>
        /// Maximum page size allowed
        /// </summary>
        public static readonly int MAX_PAGE_SIZE = 100;

        /// <summary>
        /// Minimum page size allowed
        /// </summary>
        public static readonly int MIN_PAGE_SIZE = 1;

        /// <summary>
        /// Default page number (1-based)
        /// </summary>
        public static readonly int DEFAULT_PAGE_NUMBER = 1;
    }

    /// <summary>
    /// Rate limiting constants
    /// </summary>
    public static class RateLimit
    {
        /// <summary>
        /// Default requests per minute per IP
        /// </summary>
        public static readonly int DEFAULT_REQUESTS_PER_MINUTE = 60;

        /// <summary>
        /// Authenticated user requests per minute
        /// </summary>
        public static readonly int AUTHENTICATED_REQUESTS_PER_MINUTE = 120;

        /// <summary>
        /// Premium user requests per minute
        /// </summary>
        public static readonly int PREMIUM_REQUESTS_PER_MINUTE = 300;

        /// <summary>
        /// Rate limit reset window in seconds
        /// </summary>
        public static readonly int RATE_LIMIT_WINDOW_SECONDS = 60;
    }

    /// <summary>
    /// Validation constants
    /// </summary>
    public static class Validation
    {
        /// <summary>
        /// Maximum string length for general text fields
        /// </summary>
        public static readonly int MAX_TEXT_LENGTH = 500;

        /// <summary>
        /// Maximum string length for short text fields (names, titles)
        /// </summary>
        public static readonly int MAX_SHORT_TEXT_LENGTH = 100;

        /// <summary>
        /// Maximum string length for long text fields (descriptions, notes)
        /// </summary>
        public static readonly int MAX_LONG_TEXT_LENGTH = 2000;

        /// <summary>
        /// Maximum string length for email addresses
        /// </summary>
        public static readonly int MAX_EMAIL_LENGTH = 255;

        /// <summary>
        /// Minimum password length
        /// </summary>
        public static readonly int MIN_PASSWORD_LENGTH = 8;

        /// <summary>
        /// Maximum password length
        /// </summary>
        public static readonly int MAX_PASSWORD_LENGTH = 128;
    }

    /// <summary>
    /// Cache constants
    /// </summary>
    public static class Cache
    {
        /// <summary>
        /// Default cache duration in minutes
        /// </summary>
        public static readonly int DEFAULT_CACHE_DURATION_MINUTES = 15;

        /// <summary>
        /// Long cache duration for static data in hours
        /// </summary>
        public static readonly int LONG_CACHE_DURATION_HOURS = 24;

        /// <summary>
        /// Short cache duration for dynamic data in seconds
        /// </summary>
        public static readonly int SHORT_CACHE_DURATION_SECONDS = 30;

        /// <summary>
        /// Cache key prefixes
        /// </summary>
        public static class Keys
        {
            public static readonly string USER_PREFIX = "user:";
            public static readonly string COURSE_PREFIX = "course:";
            public static readonly string ROUND_PREFIX = "round:";
            public static readonly string STATISTICS_PREFIX = "stats:";
        }
    }

    /// <summary>
    /// Security constants
    /// </summary>
    public static class Security
    {
        /// <summary>
        /// JWT token expiration times
        /// </summary>
        public static class Jwt
        {
            /// <summary>
            /// Access token expiration in minutes
            /// </summary>
            public static readonly int ACCESS_TOKEN_EXPIRATION_MINUTES = 15;

            /// <summary>
            /// Refresh token expiration in days
            /// </summary>
            public static readonly int REFRESH_TOKEN_EXPIRATION_DAYS = 7;

            /// <summary>
            /// Token issuer
            /// </summary>
            public static readonly string ISSUER = "CaddieAI";

            /// <summary>
            /// Token audience
            /// </summary>
            public static readonly string AUDIENCE = "CaddieAI-Users";
        }

        /// <summary>
        /// Password policy constants
        /// </summary>
        public static class Password
        {
            /// <summary>
            /// Minimum password length
            /// </summary>
            public static readonly int MIN_LENGTH = 8;

            /// <summary>
            /// Require uppercase letter
            /// </summary>
            public static readonly bool REQUIRE_UPPERCASE = true;

            /// <summary>
            /// Require lowercase letter
            /// </summary>
            public static readonly bool REQUIRE_LOWERCASE = true;

            /// <summary>
            /// Require digit
            /// </summary>
            public static readonly bool REQUIRE_DIGIT = true;

            /// <summary>
            /// Require special character
            /// </summary>
            public static readonly bool REQUIRE_SPECIAL_CHAR = true;
        }
    }
}