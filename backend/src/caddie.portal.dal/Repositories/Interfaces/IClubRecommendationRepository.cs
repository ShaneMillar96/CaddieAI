using caddie.portal.dal.Models;

namespace caddie.portal.dal.Repositories.Interfaces;

public interface IClubRecommendationRepository
{
    Task<ClubRecommendation?> GetByIdAsync(int id);
    Task<ClubRecommendation> CreateAsync(ClubRecommendation clubRecommendation);
    Task<ClubRecommendation> UpdateAsync(ClubRecommendation clubRecommendation);
    Task<bool> DeleteAsync(int id);
    
    // Query methods
    Task<IEnumerable<ClubRecommendation>> GetByUserIdAsync(int userId);
    Task<IEnumerable<ClubRecommendation>> GetByRoundIdAsync(int roundId);
    Task<IEnumerable<ClubRecommendation>> GetByHoleIdAsync(int holeId);
    Task<IEnumerable<ClubRecommendation>> GetByLocationIdAsync(int locationId);
    Task<IEnumerable<ClubRecommendation>> GetUserRecommendationHistoryAsync(int userId, int? limit = null);
    
    // Analytics methods
    Task<decimal> GetUserAcceptanceRateAsync(int userId);
    Task<decimal> GetOverallAcceptanceRateAsync();
    Task<IEnumerable<(string Club, int Count)>> GetMostRecommendedClubsAsync(int? userId = null);
    Task<IEnumerable<(string Club, decimal AcceptanceRate)>> GetClubAcceptanceRatesAsync();
    
    // Learning methods
    Task<IEnumerable<ClubRecommendation>> GetSimilarSituationsAsync(int userId, decimal distanceToTarget, int? holeId = null);
    Task<ClubRecommendation?> GetMostRecentRecommendationAsync(int userId);
}