using Microsoft.EntityFrameworkCore;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories.Interfaces;

namespace caddie.portal.dal.Repositories;

/// <summary>
/// Repository implementation for swing analysis data operations
/// </summary>
public class SwingAnalysisRepository : ISwingAnalysisRepository
{
    private readonly CaddieAIDbContext _context;

    public SwingAnalysisRepository(CaddieAIDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get swing analysis by ID
    /// </summary>
    public async Task<SwingAnalysis?> GetByIdAsync(int id)
    {
        return await _context.SwingAnalyses
            .Include(s => s.User)
            .Include(s => s.Round)
            .Include(s => s.Hole)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    /// <summary>
    /// Get swing analyses by user ID and round ID
    /// </summary>
    public async Task<IEnumerable<SwingAnalysis>> GetByUserIdAndRoundIdAsync(int userId, int roundId)
    {
        return await _context.SwingAnalyses
            .Include(s => s.User)
            .Include(s => s.Round)
            .Include(s => s.Hole)
            .Where(s => s.UserId == userId && s.RoundId == roundId)
            .OrderBy(s => s.DetectedAt ?? s.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Get swing analyses by user ID
    /// </summary>
    public async Task<IEnumerable<SwingAnalysis>> GetByUserIdAsync(int userId)
    {
        return await _context.SwingAnalyses
            .Include(s => s.User)
            .Include(s => s.Round)
            .Include(s => s.Hole)
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.DetectedAt ?? s.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Get swing analyses by round ID
    /// </summary>
    public async Task<IEnumerable<SwingAnalysis>> GetByRoundIdAsync(int roundId)
    {
        return await _context.SwingAnalyses
            .Include(s => s.User)
            .Include(s => s.Round)
            .Include(s => s.Hole)
            .Where(s => s.RoundId == roundId)
            .OrderBy(s => s.DetectedAt ?? s.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Get swing analyses by hole ID
    /// </summary>
    public async Task<IEnumerable<SwingAnalysis>> GetByHoleIdAsync(int holeId)
    {
        return await _context.SwingAnalyses
            .Include(s => s.User)
            .Include(s => s.Round)
            .Include(s => s.Hole)
            .Where(s => s.HoleId == holeId)
            .OrderBy(s => s.DetectedAt ?? s.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Get swing analyses by detection source
    /// </summary>
    public async Task<IEnumerable<SwingAnalysis>> GetByDetectionSourceAsync(int userId, string detectionSource)
    {
        return await _context.SwingAnalyses
            .Include(s => s.User)
            .Include(s => s.Round)
            .Include(s => s.Hole)
            .Where(s => s.UserId == userId && s.DetectionSource == detectionSource)
            .OrderByDescending(s => s.DetectedAt ?? s.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Create a new swing analysis
    /// </summary>
    public async Task<SwingAnalysis> CreateAsync(SwingAnalysis swingAnalysis)
    {
        swingAnalysis.CreatedAt = DateTime.UtcNow;
        swingAnalysis.UpdatedAt = DateTime.UtcNow;
        
        if (!swingAnalysis.DetectedAt.HasValue)
        {
            swingAnalysis.DetectedAt = DateTime.UtcNow;
        }

        _context.SwingAnalyses.Add(swingAnalysis);
        await _context.SaveChangesAsync();
        
        return await GetByIdAsync(swingAnalysis.Id) ?? swingAnalysis;
    }

    /// <summary>
    /// Update an existing swing analysis
    /// </summary>
    public async Task<SwingAnalysis> UpdateAsync(SwingAnalysis swingAnalysis)
    {
        swingAnalysis.UpdatedAt = DateTime.UtcNow;
        
        _context.SwingAnalyses.Update(swingAnalysis);
        await _context.SaveChangesAsync();
        
        return await GetByIdAsync(swingAnalysis.Id) ?? swingAnalysis;
    }

    /// <summary>
    /// Delete a swing analysis
    /// </summary>
    public async Task<bool> DeleteAsync(int id)
    {
        var swingAnalysis = await _context.SwingAnalyses.FindAsync(id);
        if (swingAnalysis == null)
        {
            return false;
        }

        _context.SwingAnalyses.Remove(swingAnalysis);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Check if a swing analysis exists
    /// </summary>
    public async Task<bool> ExistsAsync(int id)
    {
        return await _context.SwingAnalyses.AnyAsync(s => s.Id == id);
    }

    /// <summary>
    /// Get swing analysis statistics for a user
    /// </summary>
    public async Task<SwingAnalysisStats> GetStatsAsync(int userId)
    {
        var swings = await _context.SwingAnalyses
            .Where(s => s.UserId == userId)
            .ToListAsync();

        return new SwingAnalysisStats
        {
            TotalSwings = swings.Count,
            AverageSwingSpeed = swings.Where(s => s.SwingSpeedMph.HasValue)
                .Select(s => s.SwingSpeedMph!.Value)
                .DefaultIfEmpty(0)
                .Average(),
            AverageQualityScore = swings.Where(s => s.SwingQualityScore.HasValue)
                .Select(s => s.SwingQualityScore!.Value)
                .DefaultIfEmpty(0)
                .Average(),
            GarminSwings = swings.Count(s => s.DetectionSource == "garmin"),
            MobileSwings = swings.Count(s => s.DetectionSource == "mobile"),
            LastSwingDate = swings.Max(s => s.DetectedAt ?? s.CreatedAt)
        };
    }
}