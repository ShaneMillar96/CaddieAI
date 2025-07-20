namespace caddie.portal.services.Models;

public class ClubRecommendationModel
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? RoundId { get; set; }
    public int? HoleId { get; set; }
    public int? LocationId { get; set; }
    public string RecommendedClub { get; set; } = string.Empty;
    public decimal? ConfidenceScore { get; set; }
    public decimal? DistanceToTarget { get; set; }
    public string? OpenaiReasoning { get; set; }
    public string? ContextUsed { get; set; }
    public bool? WasAccepted { get; set; }
    public string? ActualClubUsed { get; set; }
    public string? RecommendationMetadata { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties as models
    public UserModel? User { get; set; }
    public RoundModel? Round { get; set; }
    public HoleModel? Hole { get; set; }
    public LocationModel? Location { get; set; }
}

public class ClubRecommendationRequestModel
{
    public int UserId { get; set; }
    public int? RoundId { get; set; }
    public int? HoleId { get; set; }
    public int? LocationId { get; set; }
    public decimal DistanceToTarget { get; set; }
    public string? WeatherConditions { get; set; }
    public string? LieConditions { get; set; }
    public string? ShotType { get; set; } // "tee_shot", "approach", "chip", "putt", etc.
    public string? PlayerNotes { get; set; }
    public Dictionary<string, object>? AdditionalContext { get; set; }
}

public class ClubRecommendationFeedbackModel
{
    public bool WasAccepted { get; set; }
    public string? ActualClubUsed { get; set; }
    public string? PlayerNotes { get; set; }
    public int? ShotResult { get; set; } // Rating 1-5 (1=poor, 5=excellent)
    public string? ShotOutcome { get; set; } // "on_target", "short", "long", "left", "right", etc.
}

public class ClubRecommendationAnalyticsModel
{
    public decimal OverallAcceptanceRate { get; set; }
    public int TotalRecommendations { get; set; }
    public int AcceptedRecommendations { get; set; }
    public List<ClubPopularityModel> MostRecommendedClubs { get; set; } = new();
    public List<ClubAccuracyModel> ClubAccuracyRates { get; set; } = new();
    public Dictionary<string, decimal> AcceptanceRateByDistance { get; set; } = new();
    public Dictionary<string, decimal> AcceptanceRateByConditions { get; set; } = new();
    public DateTime AnalyticsGeneratedAt { get; set; } = DateTime.UtcNow;
}

public class ClubPopularityModel
{
    public string Club { get; set; } = string.Empty;
    public int RecommendationCount { get; set; }
    public decimal Percentage { get; set; }
}

public class ClubAccuracyModel
{
    public string Club { get; set; } = string.Empty;
    public decimal AcceptanceRate { get; set; }
    public int TotalRecommendations { get; set; }
    public int AcceptedRecommendations { get; set; }
}

public class LocationModel
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? RoundId { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double? Accuracy { get; set; }
    public double? Altitude { get; set; }
    public double? Speed { get; set; }
    public double? Heading { get; set; }
    public string? CoursePosition { get; set; }
    public DateTime? RecordedAt { get; set; }
}

public class CreateClubRecommendationModel
{
    public int UserId { get; set; }
    public int? RoundId { get; set; }
    public int? HoleId { get; set; }
    public int? LocationId { get; set; }
    public decimal DistanceToTarget { get; set; }
    public string? WeatherConditions { get; set; }
    public string? LieConditions { get; set; }
    public string? ShotType { get; set; }
    public string? PlayerNotes { get; set; }
    public Dictionary<string, object>? AdditionalContext { get; set; }
}

public class UpdateClubRecommendationModel
{
    public bool? WasAccepted { get; set; }
    public string? ActualClubUsed { get; set; }
    public string? PlayerNotes { get; set; }
    public int? ShotResult { get; set; }
    public string? ShotOutcome { get; set; }
    public Dictionary<string, object>? AdditionalMetadata { get; set; }
}