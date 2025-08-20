using caddie.portal.dal.Models;
using caddie.portal.services.Models;


namespace caddie.portal.services.Interfaces;

public interface IGolfContextService
{
    /// <summary>
    /// Generate comprehensive context data for AI chat sessions
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Optional: Current round ID</param>
    /// <param name="courseId">Optional: Course ID</param>
    /// <param name="currentHole">Optional: Current hole number</param>
    Task<GolfContext> GenerateContextAsync(int userId, int? roundId = null, int? courseId = null, int? currentHole = null);

    /// <summary>
    /// Update context with real-time information during a round
    /// </summary>
    /// <param name="context">Existing context</param>
    /// <param name="currentHole">Current hole</param>
    /// <param name="location">Current location</param>
    Task<GolfContext> UpdateContextAsync(GolfContext context, int? currentHole = null, Location? location = null);

    /// <summary>
    /// Generate context-aware system prompt for AI
    /// </summary>
    /// <param name="context">Golf context</param>
    /// <param name="personalityType">AI personality type</param>
    Task<string> GenerateSystemPromptAsync(GolfContext context, string personalityType = "encouraging_caddie");

    /// <summary>
    /// Get club recommendations based on context
    /// </summary>
    /// <param name="context">Golf context</param>
    /// <param name="distanceToPin">Distance to pin in yards</param>
    /// <param name="conditions">Weather/course conditions</param>
    Task<Models.ClubRecommendationResult> GetClubRecommendationAsync(GolfContext context, double distanceToPin, string? conditions = null);
}

public class GolfContext
{
    public UserGolfProfile User { get; set; } = new();
    public CourseContext? Course { get; set; }
    public RoundContext? Round { get; set; }
    public HoleContext? CurrentHole { get; set; }
    public LocationContext? Location { get; set; }
    public WeatherContext? Weather { get; set; }
    public PerformanceContext Performance { get; set; } = new();
    public Dictionary<string, object> CustomData { get; set; } = new();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

public class UserGolfProfile
{
    public int UserId { get; set; }
    public string? Name { get; set; }
    public decimal? Handicap { get; set; }
    public string? SkillLevel { get; set; }
    public string? PlayingStyle { get; set; }
    public string? PreferredClubs { get; set; }
    public Dictionary<string, object>? Preferences { get; set; }
}

public class CourseContext
{
    public int CourseId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public int TotalHoles { get; set; }
    public int ParTotal { get; set; }
    public decimal? CourseRating { get; set; }
    public int? SlopeRating { get; set; }
    public string? Difficulty { get; set; }
    public Dictionary<string, object>? Features { get; set; }
}

public class RoundContext
{
    public int RoundId { get; set; }
    public DateTime StartTime { get; set; }
    public int? CurrentHole { get; set; }
    public string? Status { get; set; }
    public TimeSpan? ElapsedTime { get; set; }
    public int? CurrentScore { get; set; }
    public decimal? Pace { get; set; }
}

public class HoleContext
{
    public int HoleId { get; set; }
    public int HoleNumber { get; set; }
    public int Par { get; set; }
    public int? Yardage { get; set; }
    public int? Handicap { get; set; }
    public string? Description { get; set; }
    public List<string> Hazards { get; set; } = new();
    public string? Strategy { get; set; }
}


public class WeatherContext
{
    public string? Conditions { get; set; }
    public double? Temperature { get; set; }
    public double? WindSpeed { get; set; }
    public string? WindDirection { get; set; }
    public double? Humidity { get; set; }
    public string? Precipitation { get; set; }
}

public class PerformanceContext
{
    public int? CurrentRoundScore { get; set; }
    public decimal? CurrentRoundPace { get; set; }
    public List<HolePerformance> RecentHoles { get; set; } = new();
    public Dictionary<string, double> ClubAccuracy { get; set; } = new();
    public Dictionary<string, object> Trends { get; set; } = new();
}

public class HolePerformance
{
    public int HoleNumber { get; set; }
    public int Par { get; set; }
    public int Score { get; set; }
    public List<string> ClubsUsed { get; set; } = new();
    public string? Notes { get; set; }
}

