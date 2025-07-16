using caddie.portal.dal.Models.Users;

namespace caddie.portal.dal.Repositories.Interfaces;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByIdAsync(Guid id);
    Task<RefreshToken?> GetByTokenAsync(string token);
    Task<IEnumerable<RefreshToken>> GetByUserIdAsync(Guid userId);
    Task<IEnumerable<RefreshToken>> GetActiveByUserIdAsync(Guid userId);
    Task<RefreshToken> CreateAsync(RefreshToken refreshToken);
    Task<RefreshToken> UpdateAsync(RefreshToken refreshToken);
    Task DeleteAsync(Guid id);
    Task RevokeAsync(Guid id);
    Task RevokeAllForUserAsync(Guid userId);
    Task<bool> ExistsAsync(string token);
    Task<bool> IsActiveAsync(string token);
    Task DeleteExpiredTokensAsync();
    Task<int> GetActiveTokenCountForUserAsync(Guid userId);
    Task RevokeOldestTokensForUserAsync(Guid userId, int keepCount);
}