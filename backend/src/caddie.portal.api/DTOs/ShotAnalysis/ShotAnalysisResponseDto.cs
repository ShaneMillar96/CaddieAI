namespace caddie.portal.api.DTOs.ShotAnalysis;

/// <summary>
/// Response model for shot analysis with weather-aware recommendations
/// </summary>
public class ShotAnalysisResponseDto
{
    /// <summary>
    /// Primary club recommendation for the shot
    /// </summary>
    public string RecommendedClub { get; set; } = string.Empty;

    /// <summary>
    /// Strategic tips for shot execution
    /// </summary>
    public List<string> ShotTips { get; set; } = new();

    /// <summary>
    /// Current weather conditions affecting the shot
    /// </summary>
    public WeatherConditionsDto WeatherConditions { get; set; } = new();

    /// <summary>
    /// Confidence score for the recommendation (0-100)
    /// </summary>
    public int ConfidenceScore { get; set; }

    /// <summary>
    /// Error message if analysis fails
    /// </summary>
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Weather conditions data for shot analysis
/// </summary>
public class WeatherConditionsDto
{
    /// <summary>
    /// Weather condition description
    /// </summary>
    public string Conditions { get; set; } = string.Empty;

    /// <summary>
    /// Wind speed in mph
    /// </summary>
    public int WindSpeed { get; set; }

    /// <summary>
    /// Wind direction (N, S, E, W, etc.)
    /// </summary>
    public string WindDirection { get; set; } = string.Empty;

    /// <summary>
    /// Temperature in Fahrenheit
    /// </summary>
    public int Temperature { get; set; }
}