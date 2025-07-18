using Microsoft.EntityFrameworkCore;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories.Interfaces;

namespace caddie.portal.dal.Repositories;

public class UserRepository : IUserRepository
{
    private readonly CaddieAIDbContext _context;

    public UserRepository(CaddieAIDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        return await _context.Users
            .Include(u => u.SkillLevel)
            .Include(u => u.Status)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .Include(u => u.SkillLevel)
            .Include(u => u.Status)
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User> CreateAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User> UpdateAsync(User user)
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(string email)
    {
        return await _context.Users.AnyAsync(u => u.Email == email);
    }

    public async Task<User?> GetByEmailVerificationTokenAsync(string token)
    {
        return await _context.Users
            .Include(u => u.SkillLevel)
            .Include(u => u.Status)
            .FirstOrDefaultAsync(u => u.EmailVerificationToken == token);
    }

    public async Task<User?> GetByPasswordResetTokenAsync(string token)
    {
        return await _context.Users
            .Include(u => u.SkillLevel)
            .Include(u => u.Status)
            .FirstOrDefaultAsync(u => u.PasswordResetToken == token);
    }

    public async Task<bool> IncrementFailedLoginAttemptsAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return false;

        user.FailedLoginAttempts = (user.FailedLoginAttempts ?? 0) + 1;
        
        // Lock account after 5 failed attempts
        if (user.FailedLoginAttempts >= 5)
        {
            user.LockedUntil = DateTime.UtcNow.AddMinutes(15);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ResetFailedLoginAttemptsAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return false;

        user.FailedLoginAttempts = 0;
        user.LockedUntil = null;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateLastLoginAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return false;

        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> IsAccountLockedAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return false;

        return user.LockedUntil.HasValue && user.LockedUntil.Value > DateTime.UtcNow;
    }

    public async Task<bool> UnlockUserAccountAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return false;

        user.LockedUntil = null;
        user.FailedLoginAttempts = 0;
        await _context.SaveChangesAsync();
        return true;
    }
}