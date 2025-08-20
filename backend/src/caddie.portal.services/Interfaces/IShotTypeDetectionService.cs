using caddie.portal.services.Models;

namespace caddie.portal.services.Interfaces;

/// <summary>
/// Service for intelligent shot type detection based on golf context
/// </summary>
public interface IShotTypeDetectionService
{
    /// <summary>
    /// Detect shot type based on current golf context and location
    /// </summary>
    /// <param name="context">Shot type context including location and golf situation</param>
    /// <returns>Detected shot type with confidence and reasoning</returns>
    Task<ShotTypeDetectionResult> DetectShotTypeAsync(ShotTypeContext context);

    /// <summary>
    /// Analyze position on hole based on location and distance
    /// </summary>
    /// <param name="currentLocation">Current player location</param>
    /// <param name="holeContext">Hole information</param>
    /// <param name="distanceToPinYards">Distance to pin in yards</param>
    /// <returns>Position analysis (tee box, fairway, rough, bunker, green)</returns>
    Task<PositionAnalysis> AnalyzePositionAsync(
        LocationContext currentLocation,
        HoleContext holeContext,
        decimal distanceToPinYards);

    /// <summary>
    /// Determine shot difficulty based on context
    /// </summary>
    /// <param name="shotType">Detected shot type</param>
    /// <param name="context">Golf context</param>
    /// <param name="userSkillLevel">User's skill level</param>
    /// <returns>Shot difficulty assessment</returns>
    Task<ShotDifficultyAssessment> AssessShotDifficultyAsync(
        string shotType,
        GolfContext context,
        string userSkillLevel);

    /// <summary>
    /// Get typical distance ranges for different shot types
    /// </summary>
    /// <param name="shotType">Type of shot</param>
    /// <returns>Distance range information</returns>
    ShotDistanceRange GetShotDistanceRange(string shotType);
}