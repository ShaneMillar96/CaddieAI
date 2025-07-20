using Microsoft.EntityFrameworkCore;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories.Interfaces;

namespace caddie.portal.dal.Repositories;

public class ClubRecommendationRepository : IClubRecommendationRepository
{
    private readonly CaddieAIDbContext _context;

    public ClubRecommendationRepository(CaddieAIDbContext context)
    {
        _context = context;
    }

    public async Task<ClubRecommendation?> GetByIdAsync(int id)
    {
        return await _context.ClubRecommendations
            .Include(cr => cr.User)
            .Include(cr => cr.Round)
            .Include(cr => cr.Hole)
            .Include(cr => cr.Location)
            .FirstOrDefaultAsync(cr => cr.Id == id);
    }

    public async Task<ClubRecommendation> CreateAsync(ClubRecommendation clubRecommendation)
    {
        clubRecommendation.CreatedAt = DateTime.UtcNow;
        clubRecommendation.UpdatedAt = DateTime.UtcNow;
        
        _context.ClubRecommendations.Add(clubRecommendation);
        await _context.SaveChangesAsync();
        return clubRecommendation;
    }

    public async Task<ClubRecommendation> UpdateAsync(ClubRecommendation clubRecommendation)
    {
        clubRecommendation.UpdatedAt = DateTime.UtcNow;
        
        _context.ClubRecommendations.Update(clubRecommendation);
        await _context.SaveChangesAsync();
        return clubRecommendation;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var clubRecommendation = await _context.ClubRecommendations.FindAsync(id);
        if (clubRecommendation == null) return false;

        _context.ClubRecommendations.Remove(clubRecommendation);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<ClubRecommendation>> GetByUserIdAsync(int userId)
    {
        return await _context.ClubRecommendations
            .Include(cr => cr.Round)
            .Include(cr => cr.Hole)
            .Include(cr => cr.Location)
            .Where(cr => cr.UserId == userId)
            .OrderByDescending(cr => cr.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ClubRecommendation>> GetByRoundIdAsync(int roundId)
    {
        return await _context.ClubRecommendations
            .Include(cr => cr.User)
            .Include(cr => cr.Hole)
            .Include(cr => cr.Location)
            .Where(cr => cr.RoundId == roundId)
            .OrderByDescending(cr => cr.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ClubRecommendation>> GetByHoleIdAsync(int holeId)
    {
        return await _context.ClubRecommendations
            .Include(cr => cr.User)
            .Include(cr => cr.Round)
            .Include(cr => cr.Location)
            .Where(cr => cr.HoleId == holeId)
            .OrderByDescending(cr => cr.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ClubRecommendation>> GetByLocationIdAsync(int locationId)
    {
        return await _context.ClubRecommendations
            .Include(cr => cr.User)
            .Include(cr => cr.Round)
            .Include(cr => cr.Hole)
            .Where(cr => cr.LocationId == locationId)
            .OrderByDescending(cr => cr.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ClubRecommendation>> GetUserRecommendationHistoryAsync(int userId, int? limit = null)
    {
        IQueryable<ClubRecommendation> query = _context.ClubRecommendations
            .Include(cr => cr.Round)
            .Include(cr => cr.Hole)
            .Include(cr => cr.Location)
            .Where(cr => cr.UserId == userId)
            .OrderByDescending(cr => cr.CreatedAt);

        if (limit.HasValue)
        {
            query = query.Take(limit.Value);
        }

        return await query.ToListAsync();
    }

    public async Task<decimal> GetUserAcceptanceRateAsync(int userId)
    {
        var totalRecommendations = await _context.ClubRecommendations
            .Where(cr => cr.UserId == userId && cr.WasAccepted.HasValue)
            .CountAsync();

        if (totalRecommendations == 0) return 0;

        var acceptedRecommendations = await _context.ClubRecommendations
            .Where(cr => cr.UserId == userId && cr.WasAccepted == true)
            .CountAsync();

        return (decimal)acceptedRecommendations / totalRecommendations;
    }

    public async Task<decimal> GetOverallAcceptanceRateAsync()
    {
        var totalRecommendations = await _context.ClubRecommendations
            .Where(cr => cr.WasAccepted.HasValue)
            .CountAsync();

        if (totalRecommendations == 0) return 0;

        var acceptedRecommendations = await _context.ClubRecommendations
            .Where(cr => cr.WasAccepted == true)
            .CountAsync();

        return (decimal)acceptedRecommendations / totalRecommendations;
    }

    public async Task<IEnumerable<(string Club, int Count)>> GetMostRecommendedClubsAsync(int? userId = null)
    {
        var query = _context.ClubRecommendations.AsQueryable();

        if (userId.HasValue)
        {
            query = query.Where(cr => cr.UserId == userId.Value);
        }

        return await query
            .GroupBy(cr => cr.RecommendedClub)
            .Select(g => new { Club = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .Select(x => new ValueTuple<string, int>(x.Club, x.Count))
            .ToListAsync();
    }

    public async Task<IEnumerable<(string Club, decimal AcceptanceRate)>> GetClubAcceptanceRatesAsync()
    {
        var clubStats = await _context.ClubRecommendations
            .Where(cr => cr.WasAccepted.HasValue)
            .GroupBy(cr => cr.RecommendedClub)
            .Select(g => new
            {
                Club = g.Key,
                TotalRecommendations = g.Count(),
                AcceptedRecommendations = g.Count(cr => cr.WasAccepted == true)
            })
            .Where(x => x.TotalRecommendations >= 5) // Only clubs with at least 5 recommendations
            .ToListAsync();

        return clubStats.Select(x => new ValueTuple<string, decimal>(
            x.Club,
            x.TotalRecommendations > 0 ? (decimal)x.AcceptedRecommendations / x.TotalRecommendations : 0
        )).OrderByDescending(x => x.Item2);
    }

    public async Task<IEnumerable<ClubRecommendation>> GetSimilarSituationsAsync(int userId, decimal distanceToTarget, int? holeId = null)
    {
        var distanceTolerance = 10; // meters

        var query = _context.ClubRecommendations
            .Include(cr => cr.Round)
            .Include(cr => cr.Hole)
            .Include(cr => cr.Location)
            .Where(cr => cr.UserId == userId && 
                        cr.DistanceToTarget.HasValue &&
                        Math.Abs(cr.DistanceToTarget.Value - distanceToTarget) <= distanceTolerance);

        if (holeId.HasValue)
        {
            query = query.Where(cr => cr.HoleId == holeId.Value);
        }

        return await query
            .OrderByDescending(cr => cr.CreatedAt)
            .Take(5)
            .ToListAsync();
    }

    public async Task<ClubRecommendation?> GetMostRecentRecommendationAsync(int userId)
    {
        return await _context.ClubRecommendations
            .Include(cr => cr.Round)
            .Include(cr => cr.Hole)
            .Include(cr => cr.Location)
            .Where(cr => cr.UserId == userId)
            .OrderByDescending(cr => cr.CreatedAt)
            .FirstOrDefaultAsync();
    }
}