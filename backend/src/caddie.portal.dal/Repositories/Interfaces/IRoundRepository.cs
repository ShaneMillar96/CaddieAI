using caddie.portal.dal.Models;

namespace caddie.portal.dal.Repositories.Interfaces;

public interface IRoundRepository
{
    Task<Round?> GetByIdAsync(int id);
    Task<Round?> GetByIdWithDetailsAsync(int id);
    Task<IEnumerable<Round>> GetByUserIdAsync(int userId);
    Task<IEnumerable<Round>> GetByUserIdWithDateRangeAsync(int userId, DateOnly startDate, DateOnly endDate);
    Task<IEnumerable<Round>> GetByCourseIdAsync(int courseId);
    Task<IEnumerable<Round>> GetActiveRoundsAsync();
    Task<IEnumerable<Round>> GetRoundsByStatusAsync(string status);
    Task<Round?> GetActiveRoundByUserIdAsync(int userId);
    Task<Round> CreateAsync(Round round);
    Task<Round> UpdateAsync(Round round);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    Task<bool> UpdateStatusAsync(int id, string status);
    Task<bool> UpdateHoleScoreAsync(int roundId, int holeNumber, int score);
    Task<bool> UserHasActiveRoundAsync(int userId);
    Task<IEnumerable<Round>> GetRecentRoundsAsync(int userId, int count = 10);
    Task<IEnumerable<Round>> GetPaginatedAsync(int page, int pageSize, int? userId = null, string? status = null);
    Task<int> GetTotalCountAsync(int? userId = null, string? status = null);
    Task<object?> GetRoundStatisticsAsync(int userId, DateOnly? startDate = null, DateOnly? endDate = null);
}