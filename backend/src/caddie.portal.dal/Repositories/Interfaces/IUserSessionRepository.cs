using caddie.portal.dal.Models;

namespace caddie.portal.dal.Repositories.Interfaces;

public interface IUserSessionRepository
{
    Task<UserSession?> GetBySessionTokenAsync(string sessionToken);
    Task<IEnumerable<UserSession>> GetActiveSessionsByUserIdAsync(int userId);
    Task<UserSession> CreateAsync(UserSession userSession);
    Task<bool> DeactivateAsync(string sessionToken);
    Task<bool> DeactivateAllUserSessionsAsync(int userId);
    Task<bool> DeleteExpiredSessionsAsync();
}