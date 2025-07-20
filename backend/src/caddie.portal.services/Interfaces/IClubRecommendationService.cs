using caddie.portal.dal.Models;
using caddie.portal.services.Models;

namespace caddie.portal.services.Interfaces;

public interface IClubRecommendationService
{
    /// <summary>
    /// Generate AI-powered club recommendation based on comprehensive context
    /// </summary>
    /// <param name="request">Club recommendation request with all context</param>
    Task<ClubRecommendationModel> GenerateRecommendationAsync(ClubRecommendationRequestModel request);

    /// <summary>
    /// Save user feedback for a recommendation (accepted/rejected and actual club used)
    /// </summary>
    /// <param name="recommendationId">Recommendation ID</param>
    /// <param name="feedback">User feedback</param>
    Task<bool> SaveRecommendationFeedbackAsync(int recommendationId, ClubRecommendationFeedbackModel feedback);

    /// <summary>
    /// Get recommendation history for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="limit">Optional limit for results</param>
    Task<IEnumerable<ClubRecommendationModel>> GetUserRecommendationHistoryAsync(int userId, int? limit = null);

    /// <summary>
    /// Get recommendation by ID
    /// </summary>
    /// <param name="id">Recommendation ID</param>
    Task<ClubRecommendationModel?> GetRecommendationByIdAsync(int id);

    /// <summary>
    /// Get recommendations for a specific round
    /// </summary>
    /// <param name="roundId">Round ID</param>
    Task<IEnumerable<ClubRecommendationModel>> GetRoundRecommendationsAsync(int roundId);

    /// <summary>
    /// Get analytics for user's recommendation performance
    /// </summary>
    /// <param name="userId">User ID</param>
    Task<ClubRecommendationAnalyticsModel> GetUserAnalyticsAsync(int userId);

    /// <summary>
    /// Get system-wide recommendation analytics
    /// </summary>
    Task<ClubRecommendationAnalyticsModel> GetSystemAnalyticsAsync();

    /// <summary>
    /// Get recommendations for similar situations (for learning)
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="distanceToTarget">Distance to target</param>
    /// <param name="holeId">Optional hole ID for context</param>
    Task<IEnumerable<ClubRecommendationModel>> GetSimilarSituationRecommendationsAsync(int userId, decimal distanceToTarget, int? holeId = null);

    /// <summary>
    /// Get most recent recommendation for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    Task<ClubRecommendationModel?> GetMostRecentRecommendationAsync(int userId);
}