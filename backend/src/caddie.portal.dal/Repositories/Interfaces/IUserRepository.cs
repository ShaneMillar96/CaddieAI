using caddie.portal.dal.Models.Users;

namespace caddie.portal.dal.Repositories.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByEmailVerificationTokenAsync(string token);
    Task<User?> GetByPasswordResetTokenAsync(string token);
    Task<IEnumerable<User>> GetAllAsync();
    Task<User> CreateAsync(User user);
    Task<User> UpdateAsync(User user);
    Task DeleteAsync(Guid id);
    Task<bool> ExistsAsync(Guid id);
    Task<bool> EmailExistsAsync(string email);
    Task<bool> EmailExistsAsync(string email, Guid excludeUserId);
    Task<int> GetFailedLoginAttemptsAsync(Guid userId);
    Task IncrementFailedLoginAttemptsAsync(Guid userId);
    Task ResetFailedLoginAttemptsAsync(Guid userId);
    Task LockUserAccountAsync(Guid userId, DateTime lockedUntil);
    Task UnlockUserAccountAsync(Guid userId);
    Task<bool> IsAccountLockedAsync(Guid userId);
    Task UpdateLastLoginAsync(Guid userId);
    Task<IEnumerable<User>> GetLockedUsersAsync();
    Task<IEnumerable<User>> GetUnverifiedUsersAsync();
}