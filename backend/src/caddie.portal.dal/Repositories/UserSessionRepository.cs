using Microsoft.EntityFrameworkCore;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories.Interfaces;

namespace caddie.portal.dal.Repositories;

public class UserSessionRepository : IUserSessionRepository
{
    private readonly CaddieAIDbContext _context;

    public UserSessionRepository(CaddieAIDbContext context)
    {
        _context = context;
    }

    public async Task<UserSession?> GetBySessionTokenAsync(string sessionToken)
    {
        return await _context.UserSessions
            .Include(us => us.User)
            .FirstOrDefaultAsync(us => us.SessionToken == sessionToken);
    }

    public async Task<IEnumerable<UserSession>> GetActiveSessionsByUserIdAsync(int userId)
    {
        return await _context.UserSessions
            .Where(us => us.UserId == userId && us.IsActive == true)
            .ToListAsync();
    }

    public async Task<UserSession> CreateAsync(UserSession userSession)
    {
        _context.UserSessions.Add(userSession);
        await _context.SaveChangesAsync();
        return userSession;
    }

    public async Task<bool> DeactivateAsync(string sessionToken)
    {
        var userSession = await _context.UserSessions
            .FirstOrDefaultAsync(us => us.SessionToken == sessionToken);
        
        if (userSession == null) return false;

        userSession.IsActive = false;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeactivateAllUserSessionsAsync(int userId)
    {
        var sessions = await _context.UserSessions
            .Where(us => us.UserId == userId && us.IsActive == true)
            .ToListAsync();

        foreach (var session in sessions)
        {
            session.IsActive = false;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteExpiredSessionsAsync()
    {
        var expiredSessions = await _context.UserSessions
            .Where(us => us.ExpiresAt < DateTime.UtcNow)
            .ToListAsync();

        _context.UserSessions.RemoveRange(expiredSessions);
        await _context.SaveChangesAsync();
        return true;
    }
}