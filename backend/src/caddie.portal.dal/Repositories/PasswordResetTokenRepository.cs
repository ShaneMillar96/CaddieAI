using Microsoft.EntityFrameworkCore;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories.Interfaces;

namespace caddie.portal.dal.Repositories;

public class PasswordResetTokenRepository : IPasswordResetTokenRepository
{
    private readonly CaddieAIDbContext _context;

    public PasswordResetTokenRepository(CaddieAIDbContext context)
    {
        _context = context;
    }

    public async Task<PasswordResetToken?> GetByTokenAsync(string token)
    {
        return await _context.PasswordResetTokens
            .Include(prt => prt.User)
            .FirstOrDefaultAsync(prt => prt.Token == token);
    }

    public async Task<PasswordResetToken> CreateAsync(PasswordResetToken passwordResetToken)
    {
        _context.PasswordResetTokens.Add(passwordResetToken);
        await _context.SaveChangesAsync();
        return passwordResetToken;
    }

    public async Task<bool> MarkAsUsedAsync(string token)
    {
        var passwordResetToken = await _context.PasswordResetTokens
            .FirstOrDefaultAsync(prt => prt.Token == token);
        
        if (passwordResetToken == null) return false;

        passwordResetToken.IsUsed = true;
        passwordResetToken.UsedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> MarkAsUsedAsync(int id)
    {
        var passwordResetToken = await _context.PasswordResetTokens
            .FirstOrDefaultAsync(prt => prt.Id == id);
        
        if (passwordResetToken == null) return false;

        passwordResetToken.IsUsed = true;
        passwordResetToken.UsedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteExpiredTokensAsync()
    {
        var expiredTokens = await _context.PasswordResetTokens
            .Where(prt => prt.ExpiresAt < DateTime.UtcNow)
            .ToListAsync();

        _context.PasswordResetTokens.RemoveRange(expiredTokens);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> InvalidateAllForUserAsync(int userId)
    {
        var tokens = await _context.PasswordResetTokens
            .Where(prt => prt.UserId == userId && prt.IsUsed == false)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.IsUsed = true;
            token.UsedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<PasswordResetToken?> GetValidByTokenAsync(string token)
    {
        return await _context.PasswordResetTokens
            .Include(prt => prt.User)
            .FirstOrDefaultAsync(prt => prt.Token == token && 
                                       prt.IsUsed == false && 
                                       prt.ExpiresAt > DateTime.UtcNow);
    }
}