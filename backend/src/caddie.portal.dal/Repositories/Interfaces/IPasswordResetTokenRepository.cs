using caddie.portal.dal.Models;

namespace caddie.portal.dal.Repositories.Interfaces;

public interface IPasswordResetTokenRepository
{
    Task<PasswordResetToken?> GetByTokenAsync(string token);
    Task<PasswordResetToken> CreateAsync(PasswordResetToken passwordResetToken);
    Task<bool> MarkAsUsedAsync(string token);
    Task<bool> MarkAsUsedAsync(int id);
    Task<bool> DeleteExpiredTokensAsync();
    Task<bool> InvalidateAllForUserAsync(int userId);
    Task<PasswordResetToken?> GetValidByTokenAsync(string token);
}