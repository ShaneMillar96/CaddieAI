using Microsoft.EntityFrameworkCore;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories.Interfaces;
using RoundStatus = caddie.portal.dal.Enums.RoundStatus;

namespace caddie.portal.dal.Repositories;

public class RoundRepository : IRoundRepository
{
    private readonly CaddieAIDbContext _context;

    public RoundRepository(CaddieAIDbContext context)
    {
        _context = context;
    }

    public async Task<Round?> GetByIdAsync(int id)
    {
        return await _context.Rounds
            .Include(r => r.Status)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<Round?> GetByIdWithDetailsAsync(int id)
    {
        return await _context.Rounds
            .Include(r => r.User)
                .ThenInclude(u => u.SkillLevel)
            .Include(r => r.User)
                .ThenInclude(u => u.Status)
            .Include(r => r.Course)
                .ThenInclude(c => c.Holes)
            .Include(r => r.Status)
            .Include(r => r.Locations)
            .Include(r => r.ChatSessions)
            .Include(r => r.ClubRecommendations)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<IEnumerable<Round>> GetByUserIdAsync(int userId)
    {
        return await _context.Rounds
            .Include(r => r.Course)
            .Include(r => r.Status)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.RoundDate)
            .ThenByDescending(r => r.StartTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Round>> GetByUserIdWithDateRangeAsync(int userId, DateOnly startDate, DateOnly endDate)
    {
        return await _context.Rounds
            .Include(r => r.Course)
            .Include(r => r.Status)
            .Where(r => r.UserId == userId && r.RoundDate >= startDate && r.RoundDate <= endDate)
            .OrderByDescending(r => r.RoundDate)
            .ThenByDescending(r => r.StartTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Round>> GetByCourseIdAsync(int courseId)
    {
        return await _context.Rounds
            .Include(r => r.User)
                .ThenInclude(u => u.SkillLevel)
            .Include(r => r.User)
                .ThenInclude(u => u.Status)
            .Include(r => r.Status)
            .Where(r => r.CourseId == courseId)
            .OrderByDescending(r => r.RoundDate)
            .ThenByDescending(r => r.StartTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Round>> GetActiveRoundsAsync()
    {
        return await _context.Rounds
            .Include(r => r.User)
                .ThenInclude(u => u.SkillLevel)
            .Include(r => r.User)
                .ThenInclude(u => u.Status)
            .Include(r => r.Course)
            .Include(r => r.Status)
            .Where(r => r.Status.Name == "in_progress" || r.Status.Name == "paused")
            .OrderBy(r => r.StartTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Round>> GetRoundsByStatusAsync(string status)
    {
        return await _context.Rounds
            .Include(r => r.User)
                .ThenInclude(u => u.SkillLevel)
            .Include(r => r.User)
                .ThenInclude(u => u.Status)
            .Include(r => r.Course)
            .Include(r => r.Status)
            .Where(r => r.Status.Name == status)
            .OrderByDescending(r => r.RoundDate)
            .ThenByDescending(r => r.StartTime)
            .ToListAsync();
    }

    public async Task<Round?> GetActiveRoundByUserIdAsync(int userId)
    {
        return await _context.Rounds
            .Include(r => r.Course)
                .ThenInclude(c => c.Holes)
            .Include(r => r.Status)
            .Include(r => r.Locations)
            .Where(r => r.UserId == userId && (r.StatusId == (int)RoundStatus.InProgress || r.StatusId == (int)RoundStatus.Paused))
            .FirstOrDefaultAsync();
    }

    public async Task<Round> CreateAsync(Round round)
    {
        // Set default status if not provided
        if (round.StatusId == 0)
        {
            var notStartedStatus = await _context.RoundStatuses
                .FirstOrDefaultAsync(s => s.Id == (int)RoundStatus.NotStarted);
            round.StatusId = notStartedStatus?.Id ?? 1;
        }

        _context.Rounds.Add(round);
        await _context.SaveChangesAsync();
        return round;
    }

    public async Task<Round> UpdateAsync(Round round)
    {
        _context.Rounds.Update(round);
        await _context.SaveChangesAsync();
        return round;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var round = await _context.Rounds.FindAsync(id);
        if (round == null) return false;

        _context.Rounds.Remove(round);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.Rounds.AnyAsync(r => r.Id == id);
    }

    public async Task<bool> UpdateStatusAsync(int id, string status)
    {
        var round = await _context.Rounds.FindAsync(id);
        if (round == null) return false;

        var roundStatus = await _context.RoundStatuses
            .FirstOrDefaultAsync(s => s.Name == status);
        if (roundStatus == null) return false;

        round.StatusId = roundStatus.Id;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateHoleScoreAsync(int roundId, int holeNumber, int score)
    {
        var round = await _context.Rounds
            .Include(r => r.HoleScores)
            .FirstOrDefaultAsync(r => r.Id == roundId);
        if (round == null) return false;

        // Get the hole information to get the HoleId
        var hole = await _context.Holes
            .FirstOrDefaultAsync(h => h.CourseId == round.CourseId && h.HoleNumber == holeNumber);
        if (hole == null) return false;

        var existingScore = round.HoleScores?.FirstOrDefault(s => s.HoleNumber == holeNumber);
        if (existingScore != null)
        {
            // Update existing score
            existingScore.Score = score;
            existingScore.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            // Create new hole score
            var holeScore = new HoleScore
            {
                RoundId = roundId,
                HoleId = hole.Id,
                HoleNumber = holeNumber,
                Score = score,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.HoleScores.Add(holeScore);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UserHasActiveRoundAsync(int userId)
    {
        return await _context.Rounds
            .Include(r => r.Status)
            .AnyAsync(r => r.UserId == userId && (r.StatusId == (int)RoundStatus.InProgress || r.StatusId == (int)RoundStatus.Paused));
    }

    public async Task<IEnumerable<Round>> GetRecentRoundsAsync(int userId, int count = 10)
    {
        return await _context.Rounds
            .Include(r => r.Course)
            .Include(r => r.Status)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.RoundDate)
            .ThenByDescending(r => r.StartTime)
            .Take(count)
            .ToListAsync();
    }

    public async Task<IEnumerable<Round>> GetPaginatedAsync(int page, int pageSize, int? userId = null, string? status = null)
    {
        var query = _context.Rounds
            .Include(r => r.User)
                .ThenInclude(u => u.SkillLevel)
            .Include(r => r.User)
                .ThenInclude(u => u.Status)
            .Include(r => r.Course)
            .Include(r => r.Status)
            .AsQueryable();

        if (userId.HasValue)
        {
            query = query.Where(r => r.UserId == userId.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(r => r.Status.Name == status);
        }

        return await query
            .OrderByDescending(r => r.RoundDate)
            .ThenByDescending(r => r.StartTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetTotalCountAsync(int? userId = null, string? status = null)
    {
        var query = _context.Rounds.AsQueryable();

        if (userId.HasValue)
        {
            query = query.Where(r => r.UserId == userId.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Include(r => r.Status).Where(r => r.Status.Name == status);
        }

        return await query.CountAsync();
    }

    public async Task<object?> GetRoundStatisticsAsync(int userId, DateOnly? startDate = null, DateOnly? endDate = null)
    {
        var query = _context.Rounds
            .Include(r => r.Status)
            .Where(r => r.UserId == userId && r.StatusId == (int)RoundStatus.Completed);

        if (startDate.HasValue)
        {
            query = query.Where(r => r.RoundDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(r => r.RoundDate <= endDate.Value);
        }

        var completedRounds = await query.ToListAsync();

        if (!completedRounds.Any())
        {
            return null;
        }

        return new
        {
            TotalRounds = completedRounds.Count,
            AverageScore = completedRounds.Where(r => r.TotalScore.HasValue).Any() 
                ? completedRounds.Where(r => r.TotalScore.HasValue).Average(r => r.TotalScore!.Value) 
                : (double?)null,
            BestScore = completedRounds.Where(r => r.TotalScore.HasValue).Any() 
                ? completedRounds.Where(r => r.TotalScore.HasValue).Min(r => r.TotalScore!.Value) 
                : (int?)null,
            WorstScore = completedRounds.Where(r => r.TotalScore.HasValue).Any() 
                ? completedRounds.Where(r => r.TotalScore.HasValue).Max(r => r.TotalScore!.Value) 
                : (int?)null,
            AveragePutts = completedRounds.Where(r => r.TotalPutts.HasValue).Any() 
                ? completedRounds.Where(r => r.TotalPutts.HasValue).Average(r => r.TotalPutts!.Value) 
                : (double?)null,
            AverageFairwaysHit = completedRounds.Where(r => r.FairwaysHit.HasValue).Any() 
                ? completedRounds.Where(r => r.FairwaysHit.HasValue).Average(r => r.FairwaysHit!.Value) 
                : (double?)null,
            AverageGreensInRegulation = completedRounds.Where(r => r.GreensInRegulation.HasValue).Any() 
                ? completedRounds.Where(r => r.GreensInRegulation.HasValue).Average(r => r.GreensInRegulation!.Value) 
                : (double?)null,
            DateRange = new
            {
                StartDate = startDate,
                EndDate = endDate,
                ActualStartDate = completedRounds.Any() ? completedRounds.Min(r => r.RoundDate) : (DateOnly?)null,
                ActualEndDate = completedRounds.Any() ? completedRounds.Max(r => r.RoundDate) : (DateOnly?)null
            }
        };
    }
}