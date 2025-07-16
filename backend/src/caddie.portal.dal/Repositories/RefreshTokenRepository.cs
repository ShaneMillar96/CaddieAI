using Microsoft.EntityFrameworkCore;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models.Users;
using caddie.portal.dal.Repositories.Interfaces;

namespace caddie.portal.dal.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly CaddieAIDbContext _context;

    public RefreshTokenRepository(CaddieAIDbContext context)
    {
        _context = context;
    }

    public async Task<RefreshToken?> GetByIdAsync(Guid id)
    {
        return await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Id == id);
    }

    public async Task<RefreshToken?> GetByTokenAsync(string token)
    {
        return await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == token);
    }

    public async Task<IEnumerable<RefreshToken>> GetByUserIdAsync(Guid userId)
    {
        return await _context.RefreshTokens
            .Where(rt => rt.UserId == userId)
            .OrderByDescending(rt => rt.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<RefreshToken>> GetActiveByUserIdAsync(Guid userId)
    {
        return await _context.RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.IsRevoked && rt.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(rt => rt.CreatedAt)
            .ToListAsync();
    }

    public async Task<RefreshToken> CreateAsync(RefreshToken refreshToken)
    {
        refreshToken.CreatedAt = DateTime.UtcNow;
        refreshToken.UpdatedAt = DateTime.UtcNow;
        
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();
        
        return refreshToken;
    }

    public async Task<RefreshToken> UpdateAsync(RefreshToken refreshToken)
    {
        refreshToken.UpdatedAt = DateTime.UtcNow;
        
        _context.RefreshTokens.Update(refreshToken);
        await _context.SaveChangesAsync();
        
        return refreshToken;
    }

    public async Task DeleteAsync(Guid id)
    {
        var refreshToken = await _context.RefreshTokens.FindAsync(id);
        if (refreshToken != null)
        {
            _context.RefreshTokens.Remove(refreshToken);
            await _context.SaveChangesAsync();
        }
    }

    public async Task RevokeAsync(Guid id)
    {
        var refreshToken = await _context.RefreshTokens.FindAsync(id);
        if (refreshToken != null)
        {
            refreshToken.IsRevoked = true;
            refreshToken.RevokedAt = DateTime.UtcNow;
            refreshToken.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
        }
    }

    public async Task RevokeAllForUserAsync(Guid userId)
    {
        var activeTokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.IsRevoked)
            .ToListAsync();

        foreach (var token in activeTokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
            token.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(string token)
    {
        return await _context.RefreshTokens.AnyAsync(rt => rt.Token == token);
    }

    public async Task<bool> IsActiveAsync(string token)
    {
        return await _context.RefreshTokens
            .AnyAsync(rt => rt.Token == token && !rt.IsRevoked && rt.ExpiresAt > DateTime.UtcNow);
    }

    public async Task DeleteExpiredTokensAsync()
    {
        var expiredTokens = await _context.RefreshTokens
            .Where(rt => rt.ExpiresAt <= DateTime.UtcNow)
            .ToListAsync();

        _context.RefreshTokens.RemoveRange(expiredTokens);
        await _context.SaveChangesAsync();
    }

    public async Task<int> GetActiveTokenCountForUserAsync(Guid userId)
    {
        return await _context.RefreshTokens
            .CountAsync(rt => rt.UserId == userId && !rt.IsRevoked && rt.ExpiresAt > DateTime.UtcNow);
    }

    public async Task RevokeOldestTokensForUserAsync(Guid userId, int keepCount)
    {
        var activeTokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.IsRevoked && rt.ExpiresAt > DateTime.UtcNow)
            .OrderBy(rt => rt.CreatedAt)
            .ToListAsync();

        var tokensToRevoke = activeTokens.Take(Math.Max(0, activeTokens.Count - keepCount));

        foreach (var token in tokensToRevoke)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
            token.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }
}