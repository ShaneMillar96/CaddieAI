using caddie.portal.services.Models;

namespace caddie.portal.services.Interfaces;

/// <summary>
/// Simplified service for shot analysis with weather integration and OpenAI recommendations
/// </summary>
public interface IShotAnalysisService
{
    /// <summary>
    /// Generate shot analysis with weather-aware club recommendations
    /// </summary>
    /// <param name="userId">User identifier for personalized recommendations</param>
    /// <param name="roundId">Active round identifier</param>
    /// <param name="holeNumber">Current hole number</param>
    /// <param name="distanceYards">Distance to target in yards</param>
    /// <param name="latitude">Current latitude position</param>
    /// <param name="longitude">Current longitude position</param>
    /// <param name="playerSkillLevel">Player skill level (beginner, intermediate, advanced)</param>
    /// <returns>Comprehensive shot analysis with weather-aware recommendations</returns>
    Task<ShotAnalysisResult> GenerateAnalysisAsync(
        int userId,
        int roundId,
        int holeNumber,
        int distanceYards,
        double latitude,
        double longitude,
        string? playerSkillLevel = null);

    /// <summary>
    /// Get fallback recommendation when AI services are unavailable
    /// </summary>
    /// <param name="distanceYards">Distance to target</param>
    /// <param name="weatherData">Weather conditions</param>
    /// <param name="skillLevel">Player skill level</param>
    /// <returns>Fallback analysis result</returns>
    Task<ShotAnalysisResult> GetFallbackAnalysisAsync(
        int distanceYards,
        WeatherData weatherData,
        string skillLevel = "intermediate");
}