using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories.Interfaces;

namespace caddie.portal.dal.Repositories;

public class ChatMessageRepository : IChatMessageRepository
{
    private readonly CaddieAIDbContext _context;
    private readonly ILogger<ChatMessageRepository> _logger;

    public ChatMessageRepository(CaddieAIDbContext context, ILogger<ChatMessageRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ChatMessage?> GetByIdAsync(int id)
    {
        try
        {
            return await _context.ChatMessages
                .Include(m => m.Session)
                .Include(m => m.User)
                .FirstOrDefaultAsync(m => m.Id == id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting chat message by ID {MessageId}", id);
            throw;
        }
    }

    public async Task<IEnumerable<ChatMessage>> GetBySessionIdAsync(int sessionId, int limit = 50)
    {
        try
        {
            return await _context.ChatMessages
                .Include(m => m.User)
                .Where(m => m.SessionId == sessionId)
                .OrderByDescending(m => m.CreatedAt)
                .Take(limit)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting chat messages for session {SessionId}", sessionId);
            throw;
        }
    }

    public async Task<IEnumerable<ChatMessage>> GetByUserIdAsync(int userId, int limit = 100)
    {
        try
        {
            return await _context.ChatMessages
                .Include(m => m.Session)
                .Where(m => m.UserId == userId)
                .OrderByDescending(m => m.CreatedAt)
                .Take(limit)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting chat messages for user {UserId}", userId);
            throw;
        }
    }

    public async Task<ChatMessage> CreateAsync(ChatMessage message)
    {
        try
        {
            message.CreatedAt = DateTime.UtcNow;
            message.UpdatedAt = DateTime.UtcNow;
            message.Timestamp = DateTime.UtcNow;

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();
            return message;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating chat message for session {SessionId}", message.SessionId);
            throw;
        }
    }

    public async Task<ChatMessage> UpdateAsync(ChatMessage message)
    {
        try
        {
            message.UpdatedAt = DateTime.UtcNow;
            _context.ChatMessages.Update(message);
            await _context.SaveChangesAsync();
            return message;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating chat message {MessageId}", message.Id);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        try
        {
            var message = await _context.ChatMessages.FindAsync(id);
            if (message == null)
                return false;

            _context.ChatMessages.Remove(message);
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting chat message {MessageId}", id);
            throw;
        }
    }

    public async Task<bool> ExistsAsync(int id)
    {
        try
        {
            return await _context.ChatMessages.AnyAsync(m => m.Id == id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if chat message exists {MessageId}", id);
            throw;
        }
    }

    public async Task<IEnumerable<ChatMessage>> GetPaginatedAsync(int sessionId, int page, int pageSize)
    {
        try
        {
            return await _context.ChatMessages
                .Include(m => m.User)
                .Where(m => m.SessionId == sessionId)
                .OrderBy(m => m.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paginated chat messages for session {SessionId}", sessionId);
            throw;
        }
    }

    public async Task<int> GetTotalCountAsync(int sessionId)
    {
        try
        {
            return await _context.ChatMessages.CountAsync(m => m.SessionId == sessionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting total message count for session {SessionId}", sessionId);
            throw;
        }
    }

    public async Task<int> GetTokenUsageAsync(int userId, DateTime? fromDate = null)
    {
        try
        {
            var query = _context.ChatMessages.Where(m => m.UserId == userId);
            
            if (fromDate.HasValue)
            {
                query = query.Where(m => m.CreatedAt >= fromDate.Value);
            }

            return await query.SumAsync(m => m.TokensConsumed ?? 0);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting token usage for user {UserId}", userId);
            throw;
        }
    }

    public async Task<int> GetMessageCountAsync(int userId, DateTime? fromDate = null)
    {
        try
        {
            var query = _context.ChatMessages.Where(m => m.UserId == userId);
            
            if (fromDate.HasValue)
            {
                query = query.Where(m => m.CreatedAt >= fromDate.Value);
            }

            return await query.CountAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting message count for user {UserId}", userId);
            throw;
        }
    }

    public async Task<IEnumerable<ChatMessage>> GetRecentByUserAsync(int userId, int minutes = 60)
    {
        try
        {
            var cutoffTime = DateTime.UtcNow.AddMinutes(-minutes);
            
            return await _context.ChatMessages
                .Include(m => m.Session)
                .Where(m => m.UserId == userId && m.CreatedAt >= cutoffTime)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recent messages for user {UserId}", userId);
            throw;
        }
    }

    public async Task<ChatMessage?> GetLastMessageAsync(int sessionId)
    {
        try
        {
            return await _context.ChatMessages
                .Include(m => m.User)
                .Where(m => m.SessionId == sessionId)
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting last message for session {SessionId}", sessionId);
            throw;
        }
    }
}