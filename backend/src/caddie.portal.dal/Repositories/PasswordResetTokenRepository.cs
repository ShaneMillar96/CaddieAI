using Microsoft.EntityFrameworkCore;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models.Users;
using caddie.portal.dal.Repositories.Interfaces;

namespace caddie.portal.dal.Repositories;

public class PasswordResetTokenRepository : IPasswordResetTokenRepository
{
    private readonly CaddieAIDbContext _context;

    public PasswordResetTokenRepository(CaddieAIDbContext context)
    {
        _context = context;
    }

    public async Task<PasswordResetToken?> GetByIdAsync(Guid id)
    {
        return await _context.PasswordResetTokens
            .Include(prt => prt.User)
            .FirstOrDefaultAsync(prt => prt.Id == id);
    }

    public async Task<PasswordResetToken?> GetByTokenAsync(string token)
    {
        return await _context.PasswordResetTokens
            .Include(prt => prt.User)
            .FirstOrDefaultAsync(prt => prt.Token == token);
    }

    public async Task<IEnumerable<PasswordResetToken>> GetByUserIdAsync(Guid userId)
    {
        return await _context.PasswordResetTokens
            .Where(prt => prt.UserId == userId)
            .OrderByDescending(prt => prt.CreatedAt)
            .ToListAsync();
    }

    public async Task<PasswordResetToken?> GetValidByTokenAsync(string token)
    {
        return await _context.PasswordResetTokens
            .Include(prt => prt.User)
            .FirstOrDefaultAsync(prt => prt.Token == token && !prt.IsUsed && prt.ExpiresAt > DateTime.UtcNow);
    }

    public async Task<PasswordResetToken> CreateAsync(PasswordResetToken passwordResetToken)
    {
        passwordResetToken.CreatedAt = DateTime.UtcNow;
        passwordResetToken.UpdatedAt = DateTime.UtcNow;
        
        _context.PasswordResetTokens.Add(passwordResetToken);
        await _context.SaveChangesAsync();
        
        return passwordResetToken;
    }

    public async Task<PasswordResetToken> UpdateAsync(PasswordResetToken passwordResetToken)
    {
        passwordResetToken.UpdatedAt = DateTime.UtcNow;
        
        _context.PasswordResetTokens.Update(passwordResetToken);
        await _context.SaveChangesAsync();
        
        return passwordResetToken;
    }

    public async Task DeleteAsync(Guid id)
    {
        var passwordResetToken = await _context.PasswordResetTokens.FindAsync(id);
        if (passwordResetToken != null)
        {
            _context.PasswordResetTokens.Remove(passwordResetToken);
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAsUsedAsync(Guid id)
    {
        var passwordResetToken = await _context.PasswordResetTokens.FindAsync(id);
        if (passwordResetToken != null)
        {
            passwordResetToken.IsUsed = true;
            passwordResetToken.UsedAt = DateTime.UtcNow;
            passwordResetToken.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsAsync(string token)
    {
        return await _context.PasswordResetTokens.AnyAsync(prt => prt.Token == token);
    }

    public async Task<bool> IsValidAsync(string token)
    {
        return await _context.PasswordResetTokens
            .AnyAsync(prt => prt.Token == token && !prt.IsUsed && prt.ExpiresAt > DateTime.UtcNow);
    }

    public async Task InvalidateAllForUserAsync(Guid userId)
    {
        var activeTokens = await _context.PasswordResetTokens
            .Where(prt => prt.UserId == userId && !prt.IsUsed && prt.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        foreach (var token in activeTokens)
        {
            token.IsUsed = true;
            token.UsedAt = DateTime.UtcNow;
            token.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task DeleteExpiredTokensAsync()
    {
        var expiredTokens = await _context.PasswordResetTokens
            .Where(prt => prt.ExpiresAt <= DateTime.UtcNow)
            .ToListAsync();

        _context.PasswordResetTokens.RemoveRange(expiredTokens);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> HasValidTokenForUserAsync(Guid userId)
    {
        return await _context.PasswordResetTokens
            .AnyAsync(prt => prt.UserId == userId && !prt.IsUsed && prt.ExpiresAt > DateTime.UtcNow);
    }
}