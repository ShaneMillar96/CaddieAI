using Microsoft.EntityFrameworkCore;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories.Interfaces;
using NetTopologySuite.Geometries;

namespace caddie.portal.dal.Repositories;

public class UserCourseRepository : IUserCourseRepository
{
    private readonly CaddieAIDbContext _context;

    public UserCourseRepository(CaddieAIDbContext context)
    {
        _context = context;
    }

    public async Task<Course?> GetByIdAsync(int id)
    {
        return await _context.Courses
            .Include(c => c.Holes.Where(h => h.UserId == c.UserId))
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Course?> GetByUserAndIdAsync(int userId, int courseId)
    {
        return await _context.Courses
            .Include(c => c.Holes.Where(h => h.UserId == userId))
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == courseId && c.UserId == userId);
    }

    public async Task<IEnumerable<Course>> GetByUserIdAsync(int userId)
    {
        return await _context.Courses
            .Include(c => c.Holes.Where(h => h.UserId == userId))
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<IEnumerable<Course>> GetNearbyUserCoursesAsync(int userId, Point location, double radiusMeters)
    {
        return await _context.Courses
            .Include(c => c.Holes.Where(h => h.UserId == userId))
            .Where(c => c.UserId == userId && 
                       c.Location != null &&
                       c.Location.Distance(location) <= radiusMeters)
            .OrderBy(c => c.Location!.Distance(location))
            .ToListAsync();
    }

    public async Task<Course> CreateAsync(Course course)
    {
        _context.Courses.Add(course);
        await _context.SaveChangesAsync();
        return course;
    }

    public async Task<Course> UpdateAsync(Course course)
    {
        _context.Courses.Update(course);
        await _context.SaveChangesAsync();
        return course;
    }

    public async Task<bool> DeleteAsync(int userId, int courseId)
    {
        var course = await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == courseId && c.UserId == userId);
        
        if (course == null)
        {
            return false;
        }

        _context.Courses.Remove(course);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsForUserAsync(int userId, string name)
    {
        return await _context.Courses
            .AnyAsync(c => c.UserId == userId && 
                          c.Name.ToLower() == name.ToLower());
    }

    public async Task<bool> UserHasCourseAccessAsync(int userId, int courseId)
    {
        return await _context.Courses
            .AnyAsync(c => c.Id == courseId && 
                          c.UserId == userId);
    }

    public async Task<double> GetDistanceToCourseAsync(int courseId, Point location)
    {
        var course = await _context.Courses
            .Where(c => c.Id == courseId && c.Location != null)
            .Select(c => new { c.Location })
            .FirstOrDefaultAsync();

        if (course?.Location == null)
        {
            return double.MaxValue;
        }

        return course.Location.Distance(location);
    }

    public async Task<bool> IsPointWithinProximityAsync(int courseId, Point location, double proximityMeters)
    {
        return await _context.Courses
            .AnyAsync(c => c.Id == courseId && 
                          c.Location != null && 
                          c.Location.Distance(location) <= proximityMeters);
    }
}