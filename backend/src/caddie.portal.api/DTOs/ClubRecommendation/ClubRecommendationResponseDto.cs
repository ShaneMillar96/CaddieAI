namespace caddie.portal.api.DTOs.ClubRecommendation;

public class ClubRecommendationResponseDto
{
    public int Id { get; set; }
    public string RecommendedClub { get; set; } = string.Empty;
    public decimal? ConfidenceScore { get; set; }
    public string? Reasoning { get; set; }
    public List<string> AlternativeClubs { get; set; } = new();
    public string? Strategy { get; set; }
    public Dictionary<string, object> Factors { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class ClubRecommendationAnalyticsResponseDto
{
    public decimal OverallAcceptanceRate { get; set; }
    public int TotalRecommendations { get; set; }
    public int AcceptedRecommendations { get; set; }
    public List<ClubPopularityDto> MostRecommendedClubs { get; set; } = new();
    public List<ClubAccuracyDto> ClubAccuracyRates { get; set; } = new();
    public Dictionary<string, decimal> AcceptanceRateByDistance { get; set; } = new();
    public Dictionary<string, decimal> AcceptanceRateByConditions { get; set; } = new();
    public DateTime AnalyticsGeneratedAt { get; set; }
}

public class ClubPopularityDto
{
    public string Club { get; set; } = string.Empty;
    public int RecommendationCount { get; set; }
    public decimal Percentage { get; set; }
}

public class ClubAccuracyDto
{
    public string Club { get; set; } = string.Empty;
    public decimal AcceptanceRate { get; set; }
    public int TotalRecommendations { get; set; }
    public int AcceptedRecommendations { get; set; }
}