using caddie.portal.api.DTOs.User;
using caddie.portal.api.DTOs.Course;

namespace caddie.portal.api.DTOs.ClubRecommendation;

public class ClubRecommendationDto
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
    
    // Navigation properties
    public UserDto? User { get; set; }
    public HoleDto? Hole { get; set; }
    public LocationDto? Location { get; set; }
}

public class ClubRecommendationDetailDto : ClubRecommendationDto
{
    public List<string> AlternativeClubs { get; set; } = new();
    public string? Strategy { get; set; }
    public Dictionary<string, object> Factors { get; set; } = new();
}

public class LocationDto
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