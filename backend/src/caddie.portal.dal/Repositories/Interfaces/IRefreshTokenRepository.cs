using caddie.portal.dal.Models;

namespace caddie.portal.dal.Repositories.Interfaces;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByTokenAsync(string token);
    Task<RefreshToken> CreateAsync(RefreshToken refreshToken);
    Task<bool> RevokeAsync(string token);
    Task<bool> RevokeAllUserTokensAsync(int userId);
    Task<bool> DeleteExpiredTokensAsync();
    Task<bool> RevokeOldestTokensForUserAsync(int userId, int keepCount);
}