using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories.Interfaces;

namespace caddie.portal.dal.Repositories;

public class ChatSessionRepository : IChatSessionRepository
{
    private readonly CaddieAIDbContext _context;
    private readonly ILogger<ChatSessionRepository> _logger;

    public ChatSessionRepository(CaddieAIDbContext context, ILogger<ChatSessionRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ChatSession?> GetByIdAsync(int id)
    {
        try
        {
            return await _context.ChatSessions
                .Include(s => s.User)
                .Include(s => s.Course)
                .Include(s => s.Round)
                .FirstOrDefaultAsync(s => s.Id == id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting chat session by ID {SessionId}", id);
            throw;
        }
    }

    public async Task<ChatSession?> GetByIdWithMessagesAsync(int id)
    {
        try
        {
            return await _context.ChatSessions
                .Include(s => s.User)
                .Include(s => s.Course)
                .Include(s => s.Round)
                .Include(s => s.ChatMessages.OrderBy(m => m.CreatedAt))
                .FirstOrDefaultAsync(s => s.Id == id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting chat session with messages by ID {SessionId}", id);
            throw;
        }
    }

    public async Task<IEnumerable<ChatSession>> GetByUserIdAsync(int userId, bool includeMessages = false)
    {
        try
        {
            var query = _context.ChatSessions
                .Include(s => s.Course)
                .Include(s => s.Round)
                .Where(s => s.UserId == userId);

            if (includeMessages)
            {
                query = query.Include(s => s.ChatMessages.OrderBy(m => m.CreatedAt));
            }

            return await query
                .OrderByDescending(s => s.LastMessageAt ?? s.CreatedAt)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting chat sessions for user {UserId}", userId);
            throw;
        }
    }

    public async Task<ChatSession?> GetActiveSessionForRoundAsync(int userId, int roundId)
    {
        try
        {
            return await _context.ChatSessions
                .Include(s => s.Course)
                .Include(s => s.Round)
                .Where(s => s.UserId == userId && s.RoundId == roundId)
                .OrderByDescending(s => s.LastMessageAt ?? s.CreatedAt)
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active chat session for user {UserId} and round {RoundId}", userId, roundId);
            throw;
        }
    }

    public async Task<IEnumerable<ChatSession>> GetActiveByCourseIdAsync(int courseId)
    {
        try
        {
            return await _context.ChatSessions
                .Include(s => s.User)
                .Include(s => s.Round)
                .Where(s => s.CourseId == courseId)
                .OrderByDescending(s => s.LastMessageAt ?? s.CreatedAt)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active chat sessions for course {CourseId}", courseId);
            throw;
        }
    }

    public async Task<ChatSession> CreateAsync(ChatSession session)
    {
        try
        {
            session.CreatedAt = DateTime.UtcNow;
            session.UpdatedAt = DateTime.UtcNow;
            session.TotalMessages = 0;

            _context.ChatSessions.Add(session);
            await _context.SaveChangesAsync();
            return session;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating chat session for user {UserId}", session.UserId);
            throw;
        }
    }

    public async Task<ChatSession> UpdateAsync(ChatSession session)
    {
        try
        {
            session.UpdatedAt = DateTime.UtcNow;
            _context.ChatSessions.Update(session);
            await _context.SaveChangesAsync();
            return session;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating chat session {SessionId}", session.Id);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        try
        {
            var session = await _context.ChatSessions.FindAsync(id);
            if (session == null)
                return false;

            _context.ChatSessions.Remove(session);
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting chat session {SessionId}", id);
            throw;
        }
    }

    public async Task<bool> ExistsAsync(int id)
    {
        try
        {
            return await _context.ChatSessions.AnyAsync(s => s.Id == id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if chat session exists {SessionId}", id);
            throw;
        }
    }

    public async Task<int> GetTotalMessageCountAsync(int sessionId)
    {
        try
        {
            return await _context.ChatMessages.CountAsync(m => m.SessionId == sessionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting message count for session {SessionId}", sessionId);
            throw;
        }
    }

    public async Task<IEnumerable<ChatSession>> GetPaginatedAsync(int userId, int page, int pageSize)
    {
        try
        {
            return await _context.ChatSessions
                .Include(s => s.Course)
                .Include(s => s.Round)
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.LastMessageAt ?? s.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paginated chat sessions for user {UserId}", userId);
            throw;
        }
    }

    public async Task<int> GetTotalCountAsync(int userId)
    {
        try
        {
            return await _context.ChatSessions.CountAsync(s => s.UserId == userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting total chat session count for user {UserId}", userId);
            throw;
        }
    }

    public async Task<IEnumerable<ChatSession>> GetByDateRangeAsync(int userId, DateTime from, DateTime to)
    {
        try
        {
            return await _context.ChatSessions
                .Include(s => s.Course)
                .Include(s => s.Round)
                .Where(s => s.UserId == userId && s.CreatedAt >= from && s.CreatedAt <= to)
                .OrderByDescending(s => s.LastMessageAt ?? s.CreatedAt)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting chat sessions by date range for user {UserId}", userId);
            throw;
        }
    }
}