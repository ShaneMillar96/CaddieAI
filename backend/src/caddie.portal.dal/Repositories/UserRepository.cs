using Microsoft.EntityFrameworkCore;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models.Users;
using caddie.portal.dal.Repositories.Interfaces;

namespace caddie.portal.dal.Repositories;

public class UserRepository : IUserRepository
{
    private readonly CaddieAIDbContext _context;

    public UserRepository(CaddieAIDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
    }

    public async Task<User?> GetByEmailVerificationTokenAsync(string token)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.EmailVerificationToken == token);
    }

    public async Task<User?> GetByPasswordResetTokenAsync(string token)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.PasswordResetToken == token);
    }

    public async Task<IEnumerable<User>> GetAllAsync()
    {
        return await _context.Users
            .OrderBy(u => u.CreatedAt)
            .ToListAsync();
    }

    public async Task<User> CreateAsync(User user)
    {
        user.CreatedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        
        return user;
    }

    public async Task<User> UpdateAsync(User user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
        
        return user;
    }

    public async Task DeleteAsync(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user != null)
        {
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsAsync(Guid id)
    {
        return await _context.Users.AnyAsync(u => u.Id == id);
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _context.Users.AnyAsync(u => u.Email.ToLower() == email.ToLower());
    }

    public async Task<bool> EmailExistsAsync(string email, Guid excludeUserId)
    {
        return await _context.Users.AnyAsync(u => u.Email.ToLower() == email.ToLower() && u.Id != excludeUserId);
    }

    public async Task<int> GetFailedLoginAttemptsAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user?.FailedLoginAttempts ?? 0;
    }

    public async Task IncrementFailedLoginAttemptsAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.FailedLoginAttempts++;
            user.UpdatedAt = DateTime.UtcNow;
            
            // Lock account after 5 failed attempts
            if (user.FailedLoginAttempts >= 5)
            {
                user.LockedUntil = DateTime.UtcNow.AddMinutes(15);
            }
            
            await _context.SaveChangesAsync();
        }
    }

    public async Task ResetFailedLoginAttemptsAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.FailedLoginAttempts = 0;
            user.LockedUntil = null;
            user.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
        }
    }

    public async Task LockUserAccountAsync(Guid userId, DateTime lockedUntil)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.LockedUntil = lockedUntil;
            user.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
        }
    }

    public async Task UnlockUserAccountAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.LockedUntil = null;
            user.FailedLoginAttempts = 0;
            user.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> IsAccountLockedAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user?.IsAccountLocked ?? false;
    }

    public async Task UpdateLastLoginAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.LastLoginAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
        }
    }

    public async Task<IEnumerable<User>> GetLockedUsersAsync()
    {
        return await _context.Users
            .Where(u => u.LockedUntil.HasValue && u.LockedUntil.Value > DateTime.UtcNow)
            .ToListAsync();
    }

    public async Task<IEnumerable<User>> GetUnverifiedUsersAsync()
    {
        return await _context.Users
            .Where(u => !u.EmailVerified)
            .ToListAsync();
    }
}