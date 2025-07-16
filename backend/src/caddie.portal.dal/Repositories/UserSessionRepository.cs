using Microsoft.EntityFrameworkCore;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models.Users;
using caddie.portal.dal.Repositories.Interfaces;

namespace caddie.portal.dal.Repositories;

public class UserSessionRepository : IUserSessionRepository
{
    private readonly CaddieAIDbContext _context;

    public UserSessionRepository(CaddieAIDbContext context)
    {
        _context = context;
    }

    public async Task<UserSession?> GetByIdAsync(Guid id)
    {
        return await _context.UserSessions
            .Include(us => us.User)
            .FirstOrDefaultAsync(us => us.Id == id);
    }

    public async Task<UserSession?> GetBySessionTokenAsync(string sessionToken)
    {
        return await _context.UserSessions
            .Include(us => us.User)
            .FirstOrDefaultAsync(us => us.SessionToken == sessionToken);
    }

    public async Task<IEnumerable<UserSession>> GetByUserIdAsync(Guid userId)
    {
        return await _context.UserSessions
            .Where(us => us.UserId == userId)
            .OrderByDescending(us => us.LastActivity)
            .ToListAsync();
    }

    public async Task<IEnumerable<UserSession>> GetActiveByUserIdAsync(Guid userId)
    {
        return await _context.UserSessions
            .Where(us => us.UserId == userId && us.IsActive && us.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(us => us.LastActivity)
            .ToListAsync();
    }

    public async Task<UserSession> CreateAsync(UserSession userSession)
    {
        userSession.CreatedAt = DateTime.UtcNow;
        userSession.UpdatedAt = DateTime.UtcNow;
        userSession.LastActivity = DateTime.UtcNow;
        
        _context.UserSessions.Add(userSession);
        await _context.SaveChangesAsync();
        
        return userSession;
    }

    public async Task<UserSession> UpdateAsync(UserSession userSession)
    {
        userSession.UpdatedAt = DateTime.UtcNow;
        
        _context.UserSessions.Update(userSession);
        await _context.SaveChangesAsync();
        
        return userSession;
    }

    public async Task DeleteAsync(Guid id)
    {
        var userSession = await _context.UserSessions.FindAsync(id);
        if (userSession != null)
        {
            _context.UserSessions.Remove(userSession);
            await _context.SaveChangesAsync();
        }
    }

    public async Task DeactivateAsync(Guid id)
    {
        var userSession = await _context.UserSessions.FindAsync(id);
        if (userSession != null)
        {
            userSession.IsActive = false;
            userSession.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
        }
    }

    public async Task DeactivateAllForUserAsync(Guid userId)
    {
        var activeSessions = await _context.UserSessions
            .Where(us => us.UserId == userId && us.IsActive)
            .ToListAsync();

        foreach (var session in activeSessions)
        {
            session.IsActive = false;
            session.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(string sessionToken)
    {
        return await _context.UserSessions.AnyAsync(us => us.SessionToken == sessionToken);
    }

    public async Task<bool> IsActiveAsync(string sessionToken)
    {
        return await _context.UserSessions
            .AnyAsync(us => us.SessionToken == sessionToken && us.IsActive && us.ExpiresAt > DateTime.UtcNow);
    }

    public async Task UpdateLastActivityAsync(Guid id)
    {
        var userSession = await _context.UserSessions.FindAsync(id);
        if (userSession != null)
        {
            userSession.LastActivity = DateTime.UtcNow;
            userSession.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
        }
    }

    public async Task DeleteExpiredSessionsAsync()
    {
        var expiredSessions = await _context.UserSessions
            .Where(us => us.ExpiresAt <= DateTime.UtcNow)
            .ToListAsync();

        _context.UserSessions.RemoveRange(expiredSessions);
        await _context.SaveChangesAsync();
    }

    public async Task<int> GetActiveSessionCountForUserAsync(Guid userId)
    {
        return await _context.UserSessions
            .CountAsync(us => us.UserId == userId && us.IsActive && us.ExpiresAt > DateTime.UtcNow);
    }

    public async Task DeactivateOldestSessionsForUserAsync(Guid userId, int keepCount)
    {
        var activeSessions = await _context.UserSessions
            .Where(us => us.UserId == userId && us.IsActive && us.ExpiresAt > DateTime.UtcNow)
            .OrderBy(us => us.LastActivity)
            .ToListAsync();

        var sessionsToDeactivate = activeSessions.Take(Math.Max(0, activeSessions.Count - keepCount));

        foreach (var session in sessionsToDeactivate)
        {
            session.IsActive = false;
            session.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }
}