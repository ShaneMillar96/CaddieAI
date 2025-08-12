namespace caddie.portal.services.Constants;

/// <summary>
/// Round management constants used throughout the application
/// </summary>
public static class RoundConstants
{
    /// <summary>
    /// Maximum time allowed for a single round in minutes
    /// </summary>
    public static readonly int MAX_ROUND_DURATION_MINUTES = 360; // 6 hours

    /// <summary>
    /// Minimum time for a valid round in minutes
    /// </summary>
    public static readonly int MIN_ROUND_DURATION_MINUTES = 60; // 1 hour

    /// <summary>
    /// Default pace of play per hole in minutes
    /// </summary>
    public static readonly int AVERAGE_TIME_PER_HOLE_MINUTES = 12;

    /// <summary>
    /// Maximum number of active rounds per user
    /// </summary>
    public static readonly int MAX_ACTIVE_ROUNDS_PER_USER = 1;

    /// <summary>
    /// Number of recent rounds to display by default
    /// </summary>
    public static readonly int DEFAULT_RECENT_ROUNDS_COUNT = 10;

    /// <summary>
    /// Maximum number of rounds to retrieve in a single query
    /// </summary>
    public static readonly int MAX_ROUNDS_PER_QUERY = 100;

    /// <summary>
    /// Auto-pause timeout for inactive rounds (in minutes)
    /// </summary>
    public static readonly int AUTO_PAUSE_TIMEOUT_MINUTES = 30;

    /// <summary>
    /// Auto-abandon timeout for paused rounds (in hours)
    /// </summary>
    public static readonly int AUTO_ABANDON_TIMEOUT_HOURS = 24;

    /// <summary>
    /// Round scoring validation constants
    /// </summary>
    public static class Scoring
    {
        /// <summary>
        /// Maximum total score for 18 holes (validation limit)
        /// </summary>
        public static readonly int MAX_TOTAL_SCORE_18_HOLES = 270; // 15 per hole × 18

        /// <summary>
        /// Minimum total score for 18 holes (all holes-in-one theoretical limit)
        /// </summary>
        public static readonly int MIN_TOTAL_SCORE_18_HOLES = 18;

        /// <summary>
        /// Maximum putts per hole for validation
        /// </summary>
        public static readonly int MAX_PUTTS_PER_HOLE = 10;

        /// <summary>
        /// Maximum total putts for 18 holes
        /// </summary>
        public static readonly int MAX_TOTAL_PUTTS_18_HOLES = 180;
    }

    /// <summary>
    /// Round statistics calculation constants
    /// </summary>
    public static class Statistics
    {
        /// <summary>
        /// Minimum number of rounds required for meaningful statistics
        /// </summary>
        public static readonly int MIN_ROUNDS_FOR_STATISTICS = 3;

        /// <summary>
        /// Maximum number of rounds to consider for trend analysis
        /// </summary>
        public static readonly int MAX_ROUNDS_FOR_TRENDS = 50;

        /// <summary>
        /// Number of days to look back for recent performance analysis
        /// </summary>
        public static readonly int RECENT_PERFORMANCE_DAYS = 30;
    }

    /// <summary>
    /// Round pagination constants
    /// </summary>
    public static class Pagination
    {
        /// <summary>
        /// Default page size for round queries
        /// </summary>
        public static readonly int DEFAULT_PAGE_SIZE = 20;

        /// <summary>
        /// Maximum page size allowed for round queries
        /// </summary>
        public static readonly int MAX_PAGE_SIZE = 100;

        /// <summary>
        /// Minimum page size for round queries
        /// </summary>
        public static readonly int MIN_PAGE_SIZE = 5;
    }
}