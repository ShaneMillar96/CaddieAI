namespace caddie.portal.services.Configuration;

/// <summary>
/// Configuration settings for weather service integration
/// </summary>
public class WeatherSettings
{
    public const string SectionName = "WeatherSettings";
    
    /// <summary>
    /// API key for weather service (OpenWeatherMap)
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;
    
    /// <summary>
    /// Cache duration for weather data in minutes
    /// </summary>
    public int CacheDurationMinutes { get; set; } = 15;
    
    /// <summary>
    /// API base URL for weather service
    /// </summary>
    public string BaseUrl { get; set; } = "https://api.openweathermap.org/data/2.5";
}