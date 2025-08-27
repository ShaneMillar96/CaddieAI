namespace caddie.portal.services.Models;

/// <summary>
/// Result model for simplified shot analysis with weather-aware recommendations
/// </summary>
public class ShotAnalysisResult
{
    /// <summary>
    /// Primary club recommendation for the shot
    /// </summary>
    public string RecommendedClub { get; set; } = string.Empty;

    /// <summary>
    /// Strategic tips for shot execution (max 3 tips, 8 words each)
    /// </summary>
    public List<string> ShotTips { get; set; } = new();

    /// <summary>
    /// Weather conditions that influenced the analysis
    /// </summary>
    public WeatherData WeatherConditions { get; set; } = new();

    /// <summary>
    /// Confidence score for the recommendation (0-100)
    /// </summary>
    public int ConfidenceScore { get; set; }

    /// <summary>
    /// Indicates if OpenAI analysis was used or fallback
    /// </summary>
    public bool IsAIGenerated { get; set; }

    /// <summary>
    /// Error message if analysis encounters issues
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Distance adjustments due to weather conditions
    /// </summary>
    public int WeatherAdjustmentYards { get; set; }

    /// <summary>
    /// Alternative club recommendations
    /// </summary>
    public List<string> AlternativeClubs { get; set; } = new();
}