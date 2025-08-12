namespace caddie.portal.services.Constants;

/// <summary>
/// Golf-related constants used throughout the application
/// </summary>
public static class GolfConstants
{
    /// <summary>
    /// Standard number of holes in a full round of golf
    /// </summary>
    public static readonly int STANDARD_HOLES_PER_ROUND = 18;

    /// <summary>
    /// Maximum number of players allowed per group
    /// </summary>
    public static readonly int MAX_PLAYERS_PER_GROUP = 4;

    /// <summary>
    /// Default timeout for a round of golf in hours
    /// </summary>
    public static readonly TimeSpan DEFAULT_ROUND_TIMEOUT = TimeSpan.FromHours(6);

    /// <summary>
    /// Maximum allowed score per hole (for data validation)
    /// </summary>
    public static readonly int MAX_SCORE_PER_HOLE = 15;

    /// <summary>
    /// Minimum allowed score per hole (hole-in-one)
    /// </summary>
    public static readonly int MIN_SCORE_PER_HOLE = 1;

    /// <summary>
    /// Standard par values for different hole types
    /// </summary>
    public static class ParValues
    {
        public static readonly int PAR_3 = 3;
        public static readonly int PAR_4 = 4;
        public static readonly int PAR_5 = 5;
        public static readonly int PAR_6 = 6; // For exceptionally long holes
    }

    /// <summary>
    /// Handicap-related constants
    /// </summary>
    public static class Handicap
    {
        /// <summary>
        /// Maximum handicap index allowed
        /// </summary>
        public static readonly decimal MAX_HANDICAP_INDEX = 54.0m;

        /// <summary>
        /// Minimum handicap index (for professional-level players)
        /// </summary>
        public static readonly decimal MIN_HANDICAP_INDEX = -10.0m;
    }

    /// <summary>
    /// Distance measurement constants (in meters)
    /// </summary>
    public static class Distances
    {
        /// <summary>
        /// Minimum distance for a short hole (Par 3)
        /// </summary>
        public static readonly int MIN_SHORT_HOLE_DISTANCE = 50;

        /// <summary>
        /// Maximum distance for a very long hole
        /// </summary>
        public static readonly int MAX_HOLE_DISTANCE = 700;

        /// <summary>
        /// Typical driving distance for amateur golfers
        /// </summary>
        public static readonly int AVERAGE_DRIVE_DISTANCE = 200;
    }

    /// <summary>
    /// Course difficulty ratings
    /// </summary>
    public static class CourseRating
    {
        /// <summary>
        /// Minimum course rating
        /// </summary>
        public static readonly decimal MIN_COURSE_RATING = 60.0m;

        /// <summary>
        /// Maximum course rating
        /// </summary>
        public static readonly decimal MAX_COURSE_RATING = 85.0m;
    }
}