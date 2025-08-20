using caddie.portal.services.Models;

namespace caddie.portal.services.Interfaces;

/// <summary>
/// Service for comprehensive shot analysis with skill-based recommendations
/// </summary>
public interface IEnhancedShotAnalysisService
{
    /// <summary>
    /// Perform comprehensive shot analysis with skill-based recommendations
    /// </summary>
    /// <param name="userContext">User skill profile and context</param>
    /// <param name="golfContext">Current golf situation and environment</param>
    /// <param name="shotTypeResult">Detected shot type information</param>
    /// <param name="currentLocation">Current player location</param>
    /// <param name="targetLocation">Target location (if selected)</param>
    /// <returns>Comprehensive shot analysis with personalized recommendations</returns>
    Task<EnhancedShotAnalysisResult> AnalyzeShotAsync(
        UserGolfProfile userContext,
        GolfContext golfContext,
        ShotTypeDetectionResult shotTypeResult,
        LocationContext currentLocation,
        LocationContext? targetLocation = null);

    /// <summary>
    /// Calculate distance analysis with environmental factors
    /// </summary>
    /// <param name="currentLocation">Current position</param>
    /// <param name="targetLocation">Target position</param>
    /// <param name="holeContext">Hole information</param>
    /// <param name="weather">Weather conditions</param>
    /// <returns>Detailed distance analysis</returns>
    Task<DistanceAnalysisResult> CalculateDistanceAnalysisAsync(
        LocationContext currentLocation,
        LocationContext? targetLocation,
        HoleContext? holeContext,
        WeatherContext? weather = null);

    /// <summary>
    /// Generate skill-appropriate club recommendation
    /// </summary>
    /// <param name="userContext">User skill profile</param>
    /// <param name="distanceAnalysis">Distance calculations</param>
    /// <param name="shotType">Detected shot type</param>
    /// <param name="conditions">Playing conditions</param>
    /// <returns>Skill-based club recommendation</returns>
    Task<Models.ClubRecommendationResult> GenerateClubRecommendationAsync(
        UserGolfProfile userContext,
        DistanceAnalysisResult distanceAnalysis,
        string shotType,
        PlayingConditions? conditions = null);

    /// <summary>
    /// Generate strategic advice based on analysis
    /// </summary>
    /// <param name="userContext">User skill profile</param>
    /// <param name="golfContext">Golf context</param>
    /// <param name="shotAnalysis">Shot analysis results</param>
    /// <returns>Strategic advice tailored to skill level</returns>
    Task<StrategicAdviceResult> GenerateStrategicAdviceAsync(
        UserGolfProfile userContext,
        GolfContext golfContext,
        EnhancedShotAnalysisResult shotAnalysis);

    /// <summary>
    /// Assess environmental factors affecting the shot
    /// </summary>
    /// <param name="currentLocation">Current position</param>
    /// <param name="targetLocation">Target position</param>
    /// <param name="weather">Weather conditions</param>
    /// <param name="holeContext">Hole information</param>
    /// <returns>Environmental factor assessment</returns>
    Task<EnvironmentalFactors> AssessEnvironmentalFactorsAsync(
        LocationContext currentLocation,
        LocationContext? targetLocation,
        WeatherContext? weather,
        HoleContext? holeContext);

    /// <summary>
    /// Generate confidence score for shot execution
    /// </summary>
    /// <param name="userContext">User skill profile</param>
    /// <param name="shotType">Type of shot</param>
    /// <param name="difficulty">Shot difficulty assessment</param>
    /// <param name="conditions">Playing conditions</param>
    /// <returns>Confidence score and factors</returns>
    Task<ShotConfidenceScore> CalculateShotConfidenceAsync(
        UserGolfProfile userContext,
        string shotType,
        ShotDifficultyAssessment difficulty,
        PlayingConditions? conditions = null);
}