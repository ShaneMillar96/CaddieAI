using caddie.portal.dal.Models;

namespace caddie.portal.dal.Repositories.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByEmailAsync(string email);
    Task<User> CreateAsync(User user);
    Task<User> UpdateAsync(User user);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(string email);
    Task<User?> GetByEmailVerificationTokenAsync(string token);
    Task<User?> GetByPasswordResetTokenAsync(string token);
    Task<bool> IncrementFailedLoginAttemptsAsync(int userId);
    Task<bool> ResetFailedLoginAttemptsAsync(int userId);
    Task<bool> UpdateLastLoginAsync(int userId);
    Task<bool> IsAccountLockedAsync(int userId);
    Task<bool> UnlockUserAccountAsync(int userId);
}