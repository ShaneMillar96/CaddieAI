using caddie.portal.services.Models;

namespace caddie.portal.services.Interfaces;

/// <summary>
/// Service for generating skill-based advice and recommendations
/// </summary>
public interface ISkillBasedAdviceService
{
    /// <summary>
    /// Generate skill-appropriate greeting message for voice session
    /// </summary>
    /// <param name="userContext">User skill profile and context</param>
    /// <param name="golfContext">Current golf situation</param>
    /// <param name="currentHole">Current hole number</param>
    /// <returns>Personalized greeting message</returns>
    Task<string> GenerateSkillBasedGreetingAsync(
        UserGolfProfile userContext,
        GolfContext golfContext,
        int? currentHole);

    /// <summary>
    /// Get club recommendation tailored to user skill level
    /// </summary>
    /// <param name="userContext">User skill profile</param>
    /// <param name="distanceYards">Distance to target in yards</param>
    /// <param name="shotType">Type of shot</param>
    /// <param name="conditions">Playing conditions</param>
    /// <returns>Skill-based club recommendation</returns>
    Task<SkillBasedClubRecommendation> GetSkillBasedClubRecommendationAsync(
        UserGolfProfile userContext,
        decimal distanceYards,
        string? shotType = null,
        string? conditions = null);

    /// <summary>
    /// Generate strategic advice based on user skill level
    /// </summary>
    /// <param name="userContext">User skill profile</param>
    /// <param name="golfContext">Current golf context</param>
    /// <param name="shotType">Detected shot type</param>
    /// <param name="targetDistance">Distance to target</param>
    /// <returns>Skill-appropriate strategic advice</returns>
    Task<SkillBasedStrategicAdvice> GenerateStrategicAdviceAsync(
        UserGolfProfile userContext,
        GolfContext golfContext,
        string shotType,
        decimal targetDistance);

    /// <summary>
    /// Generate course management advice based on skill level
    /// </summary>
    /// <param name="userContext">User skill profile</param>
    /// <param name="holeContext">Current hole information</param>
    /// <param name="position">Current position on hole</param>
    /// <returns>Course management recommendations</returns>
    Task<CourseManagementAdvice> GenerateCourseManagementAdviceAsync(
        UserGolfProfile userContext,
        HoleContext holeContext,
        PositionAnalysis position);

    /// <summary>
    /// Adapt communication style based on user preferences and skill level
    /// </summary>
    /// <param name="message">Base message to adapt</param>
    /// <param name="userContext">User profile for adaptation</param>
    /// <param name="situation">Current golf situation</param>
    /// <returns>Adapted message for user's communication style</returns>
    Task<string> AdaptCommunicationStyleAsync(
        string message,
        UserGolfProfile userContext,
        string situation = "general");

    /// <summary>
    /// Generate skill-specific tips and fundamentals
    /// </summary>
    /// <param name="userContext">User skill profile</param>
    /// <param name="shotType">Type of shot</param>
    /// <param name="difficulty">Shot difficulty assessment</param>
    /// <returns>Relevant skill tips</returns>
    Task<SkillTips> GenerateSkillTipsAsync(
        UserGolfProfile userContext,
        string shotType,
        ShotDifficultyAssessment difficulty);

    /// <summary>
    /// Assess if shot is appropriate for user's skill level
    /// </summary>
    /// <param name="userContext">User skill profile</param>
    /// <param name="shotType">Proposed shot type</param>
    /// <param name="difficulty">Shot difficulty</param>
    /// <returns>Skill appropriateness assessment</returns>
    Task<SkillAppropriatenessAssessment> AssessSkillAppropriatenessAsync(
        UserGolfProfile userContext,
        string shotType,
        ShotDifficultyAssessment difficulty);

    /// <summary>
    /// Generate confidence-building messages based on user's recent performance
    /// </summary>
    /// <param name="userContext">User profile</param>
    /// <param name="performanceContext">Recent performance data</param>
    /// <returns>Encouraging and confidence-building message</returns>
    Task<string> GenerateConfidenceBuildingMessageAsync(
        UserGolfProfile userContext,
        PerformanceContext performanceContext);
}