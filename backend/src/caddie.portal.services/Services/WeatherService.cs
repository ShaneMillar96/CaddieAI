using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text.Json;
using System.Text.Json.Serialization;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Configuration;
using caddie.portal.services.Models;

namespace caddie.portal.services.Services;

/// <summary>
/// Service for retrieving weather data from external weather API
/// </summary>
public class WeatherService : IWeatherService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<WeatherService> _logger;
    private readonly WeatherSettings _weatherSettings;
    private readonly ICacheService _cacheService;

    public WeatherService(
        HttpClient httpClient,
        ILogger<WeatherService> logger,
        IOptions<WeatherSettings> weatherSettings,
        ICacheService cacheService)
    {
        _httpClient = httpClient;
        _logger = logger;
        _weatherSettings = weatherSettings.Value;
        _cacheService = cacheService;
    }

    public async Task<WeatherData> GetWeatherByCoordinatesAsync(double latitude, double longitude)
    {
        try
        {
            // Create cache key for coordinates (rounded to 2 decimal places to improve cache hits)
            var cacheKey = $"weather:{Math.Round(latitude, 2)}:{Math.Round(longitude, 2)}";
            
            // Try to get cached weather data (15-minute expiration)
            var cachedWeather = await _cacheService.GetAsync<WeatherData>(cacheKey);
            if (cachedWeather != null)
            {
                _logger.LogDebug("Retrieved weather data from cache for coordinates: {Latitude}, {Longitude}", latitude, longitude);
                return cachedWeather;
            }

            // If no API key configured, return default weather
            if (string.IsNullOrEmpty(_weatherSettings.ApiKey))
            {
                _logger.LogWarning("Weather API key not configured, returning default weather data");
                return GetDefaultWeatherData();
            }

            // Make API call to OpenWeatherMap
            var apiUrl = $"https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={_weatherSettings.ApiKey}&units=metric";
            
            _logger.LogDebug("Fetching weather data from API for coordinates: {Latitude}, {Longitude}", latitude, longitude);
            
            var response = await _httpClient.GetAsync(apiUrl);
            response.EnsureSuccessStatusCode();
            
            var jsonContent = await response.Content.ReadAsStringAsync();
            var weatherResponse = JsonSerializer.Deserialize<OpenWeatherMapResponse>(jsonContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (weatherResponse == null)
            {
                throw new InvalidOperationException("Invalid weather API response");
            }

            var weatherData = MapToWeatherData(weatherResponse);
            
            // Cache the weather data for 15 minutes
            await _cacheService.SetAsync(cacheKey, weatherData, TimeSpan.FromMinutes(15));
            
            _logger.LogInformation("Successfully retrieved weather data for coordinates: {Latitude}, {Longitude}", latitude, longitude);
            return weatherData;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error while fetching weather data for coordinates: {Latitude}, {Longitude}", latitude, longitude);
            return GetDefaultWeatherData();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching weather data for coordinates: {Latitude}, {Longitude}", latitude, longitude);
            return GetDefaultWeatherData();
        }
    }

    private static WeatherData MapToWeatherData(OpenWeatherMapResponse response)
    {
        return new WeatherData
        {
            Temperature = Math.Round(response.Main.Temp),
            WindSpeed = Math.Round(response.Wind?.Speed * 3.6 ?? 0), // Convert m/s to km/h
            WindDirection = GetWindDirection(response.Wind?.Deg ?? 0),
            Humidity = response.Main.Humidity,
            Precipitation = response.Rain?.OneHour ?? response.Snow?.OneHour ?? 0,
            Conditions = response.Weather?.FirstOrDefault()?.Description ?? "Unknown",
            Timestamp = DateTime.UtcNow
        };
    }

    private static string GetWindDirection(double degrees)
    {
        return degrees switch
        {
            >= 337.5 or < 22.5 => "N",
            >= 22.5 and < 67.5 => "NE", 
            >= 67.5 and < 112.5 => "E",
            >= 112.5 and < 157.5 => "SE",
            >= 157.5 and < 202.5 => "S",
            >= 202.5 and < 247.5 => "SW",
            >= 247.5 and < 292.5 => "W",
            >= 292.5 and < 337.5 => "NW",
            _ => "N"
        };
    }

    private static WeatherData GetDefaultWeatherData()
    {
        return new WeatherData
        {
            Temperature = 18,
            WindSpeed = 15,
            WindDirection = "SW",
            Humidity = 65,
            Precipitation = 0,
            Conditions = "Partly Cloudy",
            Timestamp = DateTime.UtcNow
        };
    }
}

// OpenWeatherMap API response models
internal class OpenWeatherMapResponse
{
    public MainWeather Main { get; set; } = null!;
    public WindData? Wind { get; set; }
    public PrecipitationData? Rain { get; set; }
    public PrecipitationData? Snow { get; set; }
    public WeatherCondition[]? Weather { get; set; }
}

internal class MainWeather
{
    public double Temp { get; set; }
    public int Humidity { get; set; }
}

internal class WindData
{
    public double Speed { get; set; }
    public double Deg { get; set; }
}

internal class PrecipitationData
{
    [JsonPropertyName("1h")]
    public double OneHour { get; set; }
}

internal class WeatherCondition
{
    public string Description { get; set; } = string.Empty;
}