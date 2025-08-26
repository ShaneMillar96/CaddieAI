using caddie.portal.services.Models;

namespace caddie.portal.services.Interfaces;

/// <summary>
/// Service interface for weather operations
/// </summary>
public interface IWeatherService
{
    /// <summary>
    /// Get current weather data by geographic coordinates
    /// </summary>
    Task<WeatherData> GetWeatherByCoordinatesAsync(double latitude, double longitude);
}