using caddie.portal.dal.Models.Users;

namespace caddie.portal.dal.Repositories.Interfaces;

public interface IUserSessionRepository
{
    Task<UserSession?> GetByIdAsync(Guid id);
    Task<UserSession?> GetBySessionTokenAsync(string sessionToken);
    Task<IEnumerable<UserSession>> GetByUserIdAsync(Guid userId);
    Task<IEnumerable<UserSession>> GetActiveByUserIdAsync(Guid userId);
    Task<UserSession> CreateAsync(UserSession userSession);
    Task<UserSession> UpdateAsync(UserSession userSession);
    Task DeleteAsync(Guid id);
    Task DeactivateAsync(Guid id);
    Task DeactivateAllForUserAsync(Guid userId);
    Task<bool> ExistsAsync(string sessionToken);
    Task<bool> IsActiveAsync(string sessionToken);
    Task UpdateLastActivityAsync(Guid id);
    Task DeleteExpiredSessionsAsync();
    Task<int> GetActiveSessionCountForUserAsync(Guid userId);
    Task DeactivateOldestSessionsForUserAsync(Guid userId, int keepCount);
}