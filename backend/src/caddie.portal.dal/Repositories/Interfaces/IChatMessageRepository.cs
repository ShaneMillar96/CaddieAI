using caddie.portal.dal.Models;

namespace caddie.portal.dal.Repositories.Interfaces;

public interface IChatMessageRepository
{
    Task<ChatMessage?> GetByIdAsync(int id);
    Task<IEnumerable<ChatMessage>> GetBySessionIdAsync(int sessionId, int limit = 50);
    Task<IEnumerable<ChatMessage>> GetByUserIdAsync(int userId, int limit = 100);
    Task<ChatMessage> CreateAsync(ChatMessage message);
    Task<ChatMessage> UpdateAsync(ChatMessage message);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);
    Task<IEnumerable<ChatMessage>> GetPaginatedAsync(int sessionId, int page, int pageSize);
    Task<int> GetTotalCountAsync(int sessionId);
    Task<int> GetTokenUsageAsync(int userId, DateTime? fromDate = null);
    Task<int> GetMessageCountAsync(int userId, DateTime? fromDate = null);
    Task<IEnumerable<ChatMessage>> GetRecentByUserAsync(int userId, int minutes = 60);
    Task<ChatMessage?> GetLastMessageAsync(int sessionId);
}