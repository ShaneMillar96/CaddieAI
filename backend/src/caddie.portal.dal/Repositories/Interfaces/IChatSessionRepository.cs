using caddie.portal.dal.Models;

namespace caddie.portal.dal.Repositories.Interfaces;

public interface IChatSessionRepository
{
    Task<ChatSession?> GetByIdAsync(int id);
    Task<ChatSession?> GetByIdWithMessagesAsync(int id);
    Task<IEnumerable<ChatSession>> GetByUserIdAsync(int userId, bool includeMessages = false);
    Task<ChatSession?> GetActiveSessionForRoundAsync(int userId, int roundId);
    Task<IEnumerable<ChatSession>> GetActiveByCourseIdAsync(int courseId);
    Task<ChatSession> CreateAsync(ChatSession session);
    Task<ChatSession> UpdateAsync(ChatSession session);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    Task<int> GetTotalMessageCountAsync(int sessionId);
    Task<IEnumerable<ChatSession>> GetPaginatedAsync(int userId, int page, int pageSize);
    Task<int> GetTotalCountAsync(int userId);
    Task<IEnumerable<ChatSession>> GetByDateRangeAsync(int userId, DateTime from, DateTime to);
}