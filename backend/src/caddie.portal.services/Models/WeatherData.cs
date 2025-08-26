namespace caddie.portal.services.Models;

/// <summary>
/// Weather information for a specific location
/// </summary>
public class WeatherData
{
    public double Temperature { get; set; }
    public double WindSpeed { get; set; }
    public string WindDirection { get; set; } = string.Empty;
    public int Humidity { get; set; }
    public double Precipitation { get; set; }
    public string Conditions { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}