using caddie.portal.dal.Models.Users;

namespace caddie.portal.dal.Repositories.Interfaces;

public interface IPasswordResetTokenRepository
{
    Task<PasswordResetToken?> GetByIdAsync(Guid id);
    Task<PasswordResetToken?> GetByTokenAsync(string token);
    Task<IEnumerable<PasswordResetToken>> GetByUserIdAsync(Guid userId);
    Task<PasswordResetToken?> GetValidByTokenAsync(string token);
    Task<PasswordResetToken> CreateAsync(PasswordResetToken passwordResetToken);
    Task<PasswordResetToken> UpdateAsync(PasswordResetToken passwordResetToken);
    Task DeleteAsync(Guid id);
    Task MarkAsUsedAsync(Guid id);
    Task<bool> ExistsAsync(string token);
    Task<bool> IsValidAsync(string token);
    Task InvalidateAllForUserAsync(Guid userId);
    Task DeleteExpiredTokensAsync();
    Task<bool> HasValidTokenForUserAsync(Guid userId);
}