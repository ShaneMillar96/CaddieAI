using Microsoft.EntityFrameworkCore;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories.Interfaces;

namespace caddie.portal.dal.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly CaddieAIDbContext _context;

    public RefreshTokenRepository(CaddieAIDbContext context)
    {
        _context = context;
    }

    public async Task<RefreshToken?> GetByTokenAsync(string token)
    {
        return await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == token);
    }

    public async Task<RefreshToken> CreateAsync(RefreshToken refreshToken)
    {
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();
        return refreshToken;
    }

    public async Task<bool> RevokeAsync(string token)
    {
        var refreshToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == token);
        
        if (refreshToken == null) return false;

        refreshToken.IsRevoked = true;
        refreshToken.RevokedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RevokeAllUserTokensAsync(int userId)
    {
        var tokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == userId && rt.IsRevoked == false)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteExpiredTokensAsync()
    {
        var expiredTokens = await _context.RefreshTokens
            .Where(rt => rt.ExpiresAt < DateTime.UtcNow)
            .ToListAsync();

        _context.RefreshTokens.RemoveRange(expiredTokens);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RevokeOldestTokensForUserAsync(int userId, int keepCount)
    {
        var userTokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == userId && rt.IsRevoked == false)
            .OrderByDescending(rt => rt.CreatedAt)
            .Skip(keepCount)
            .ToListAsync();

        foreach (var token in userTokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }
}