using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories.Interfaces;

namespace caddie.portal.dal.Repositories;

/// <summary>
/// Repository implementation for shot placement data operations
/// </summary>
public class ShotPlacementRepository : IShotPlacementRepository
{
    private readonly CaddieAIDbContext _context;

    public ShotPlacementRepository(CaddieAIDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get shot placement by ID
    /// </summary>
    public async Task<ShotPlacement?> GetByIdAsync(int id)
    {
        return await _context.ShotPlacements
            .Include(sp => sp.User)
            .Include(sp => sp.Round)
            .Include(sp => sp.Hole)
            .FirstOrDefaultAsync(sp => sp.Id == id);
    }

    /// <summary>
    /// Get all shot placements for a specific round
    /// </summary>
    public async Task<IEnumerable<ShotPlacement>> GetByRoundIdAsync(int roundId)
    {
        return await _context.ShotPlacements
            .Include(sp => sp.Hole)
            .Where(sp => sp.RoundId == roundId)
            .OrderBy(sp => sp.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Get shot placements for a specific hole in a round
    /// </summary>
    public async Task<IEnumerable<ShotPlacement>> GetByRoundAndHoleAsync(int roundId, int holeId)
    {
        return await _context.ShotPlacements
            .Include(sp => sp.Hole)
            .Where(sp => sp.RoundId == roundId && sp.HoleId == holeId)
            .OrderBy(sp => sp.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Get shot placements for a user
    /// </summary>
    public async Task<IEnumerable<ShotPlacement>> GetByUserIdAsync(int userId, int? limit = null)
    {
        var query = _context.ShotPlacements
            .Include(sp => sp.Round)
            .Include(sp => sp.Hole)
            .Where(sp => sp.UserId == userId)
            .OrderByDescending(sp => sp.CreatedAt);

        if (limit.HasValue)
        {
            return await query.Take(limit.Value).ToListAsync();
        }

        return await query.ToListAsync();
    }

    /// <summary>
    /// Get shot placements for a user within a date range
    /// </summary>
    public async Task<IEnumerable<ShotPlacement>> GetByUserAndDateRangeAsync(int userId, DateTime fromDate, DateTime toDate)
    {
        return await _context.ShotPlacements
            .Include(sp => sp.Round)
            .Include(sp => sp.Hole)
            .Where(sp => sp.UserId == userId && 
                         sp.CreatedAt >= fromDate && 
                         sp.CreatedAt <= toDate)
            .OrderByDescending(sp => sp.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Get recent shot placements for a user
    /// </summary>
    public async Task<IEnumerable<ShotPlacement>> GetRecentByUserIdAsync(int userId, int limit = 10)
    {
        return await _context.ShotPlacements
            .Include(sp => sp.Round)
            .Include(sp => sp.Hole)
            .Where(sp => sp.UserId == userId)
            .OrderByDescending(sp => sp.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    /// <summary>
    /// Create a new shot placement
    /// </summary>
    public async Task<ShotPlacement> CreateAsync(ShotPlacement shotPlacement)
    {
        shotPlacement.CreatedAt = DateTime.UtcNow;
        
        _context.ShotPlacements.Add(shotPlacement);
        await _context.SaveChangesAsync();
        
        // Return the created entity with includes
        return await GetByIdAsync(shotPlacement.Id) ?? shotPlacement;
    }

    /// <summary>
    /// Update an existing shot placement
    /// </summary>
    public async Task<ShotPlacement> UpdateAsync(ShotPlacement shotPlacement)
    {
        shotPlacement.UpdatedAt = DateTime.UtcNow;
        
        _context.Entry(shotPlacement).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        
        // Return the updated entity with includes
        return await GetByIdAsync(shotPlacement.Id) ?? shotPlacement;
    }

    /// <summary>
    /// Delete a shot placement
    /// </summary>
    public async Task<bool> DeleteAsync(int id)
    {
        var shotPlacement = await _context.ShotPlacements.FindAsync(id);
        if (shotPlacement == null)
        {
            return false;
        }

        _context.ShotPlacements.Remove(shotPlacement);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Check if a shot placement exists
    /// </summary>
    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.ShotPlacements.AnyAsync(sp => sp.Id == id);
    }

    /// <summary>
    /// Get shot placement statistics for a user
    /// </summary>
    public async Task<(int totalShots, int completedShots, double? avgDistanceToPin, double? avgAccuracy)> GetStatsAsync(int userId, DateTime? fromDate = null)
    {
        var query = _context.ShotPlacements.Where(sp => sp.UserId == userId);
        
        if (fromDate.HasValue)
        {
            query = query.Where(sp => sp.CreatedAt >= fromDate.Value);
        }

        var stats = await query
            .GroupBy(sp => sp.UserId)
            .Select(g => new
            {
                TotalShots = g.Count(),
                CompletedShots = g.Count(sp => sp.IsCompleted),
                AvgDistanceToPin = g.Where(sp => sp.DistanceToPinYards.HasValue)
                                   .Average(sp => (double?)sp.DistanceToPinYards),
                AvgAccuracy = g.Where(sp => sp.AccuracyMeters.HasValue)
                               .Average(sp => sp.AccuracyMeters)
            })
            .FirstOrDefaultAsync();

        if (stats == null)
        {
            return (0, 0, null, null);
        }

        return (stats.TotalShots, stats.CompletedShots, stats.AvgDistanceToPin, stats.AvgAccuracy);
    }

    /// <summary>
    /// Get most common club recommendations for a user
    /// </summary>
    public async Task<IEnumerable<(string club, int count)>> GetMostCommonClubsAsync(int userId, int limit = 10)
    {
        return await _context.ShotPlacements
            .Where(sp => sp.UserId == userId && !string.IsNullOrEmpty(sp.ClubRecommendation))
            .GroupBy(sp => sp.ClubRecommendation!)
            .Select(g => new { Club = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(limit)
            .Select(x => new ValueTuple<string, int>(x.Club, x.Count))
            .ToListAsync();
    }

    /// <summary>
    /// Get all shot placements (for admin purposes)
    /// </summary>
    public async Task<IEnumerable<ShotPlacement>> GetAllAsync()
    {
        return await _context.ShotPlacements
            .Include(sp => sp.User)
            .Include(sp => sp.Round)
            .Include(sp => sp.Hole)
            .OrderByDescending(sp => sp.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Helper method to create PostGIS Point from latitude and longitude
    /// </summary>
    public static Point CreatePoint(double longitude, double latitude)
    {
        var geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        return geometryFactory.CreatePoint(new Coordinate(longitude, latitude));
    }

    /// <summary>
    /// Helper method to extract latitude and longitude from PostGIS Point
    /// </summary>
    public static (double latitude, double longitude) ExtractCoordinates(Point? point)
    {
        if (point == null)
            return (0, 0);
        
        return (point.Y, point.X);
    }
}