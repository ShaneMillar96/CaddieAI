using Microsoft.EntityFrameworkCore;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories.Interfaces;

namespace caddie.portal.dal.Repositories;

public class HoleRepository : IHoleRepository
{
    private readonly CaddieAIDbContext _context;

    public HoleRepository(CaddieAIDbContext context)
    {
        _context = context;
    }

    public async Task<Hole?> GetByIdAsync(int id)
    {
        return await _context.Holes
            .Include(h => h.Course)
            .FirstOrDefaultAsync(h => h.Id == id);
    }

    public async Task<Hole?> GetByCourseIdAndHoleNumberAsync(int courseId, int holeNumber)
    {
        return await _context.Holes
            .Include(h => h.Course)
            .FirstOrDefaultAsync(h => h.CourseId == courseId && h.HoleNumber == holeNumber);
    }

    public Task<Hole?> GetHoleByNumberAsync(int courseId, int holeNumber)
    {
        // Alias for GetByCourseIdAndHoleNumberAsync to match AIScoreService usage
        return GetByCourseIdAndHoleNumberAsync(courseId, holeNumber);
    }

    public async Task<IEnumerable<Hole>> GetByCourseIdAsync(int courseId)
    {
        return await _context.Holes
            .Include(h => h.Course)
            .Where(h => h.CourseId == courseId)
            .OrderBy(h => h.HoleNumber)
            .ToListAsync();
    }

    public async Task<IEnumerable<Hole>> GetAllAsync()
    {
        return await _context.Holes
            .Include(h => h.Course)
            .OrderBy(h => h.CourseId)
            .ThenBy(h => h.HoleNumber)
            .ToListAsync();
    }

    public async Task<Hole> CreateAsync(Hole hole)
    {
        _context.Holes.Add(hole);
        await _context.SaveChangesAsync();
        return hole;
    }

    public async Task<Hole> UpdateAsync(Hole hole)
    {
        _context.Holes.Update(hole);
        await _context.SaveChangesAsync();
        return hole;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var hole = await GetByIdAsync(id);
        if (hole == null)
            return false;

        _context.Holes.Remove(hole);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsAsync(int courseId, int holeNumber)
    {
        return await _context.Holes
            .AnyAsync(h => h.CourseId == courseId && h.HoleNumber == holeNumber);
    }

    public async Task<IEnumerable<Hole>> GetByParAsync(int par)
    {
        return await _context.Holes
            .Include(h => h.Course)
            .Where(h => h.Par == par)
            .OrderBy(h => h.CourseId)
            .ThenBy(h => h.HoleNumber)
            .ToListAsync();
    }

    public async Task<int> GetTotalHolesForCourseAsync(int courseId)
    {
        return await _context.Holes
            .CountAsync(h => h.CourseId == courseId);
    }
}