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

    public async Task<UserCourse?> GetByIdAsync(int id)
    {
        return await _context.UserCourses
            .Include(uc => uc.User)
            .FirstOrDefaultAsync(uc => uc.Id == id);
    }

    public async Task<UserCourse?> GetByUserAndIdAsync(int userId, int courseId)
    {
        return await _context.UserCourses
            .Include(uc => uc.User)
            .FirstOrDefaultAsync(uc => uc.Id == courseId && uc.UserId == userId);
    }

    public async Task<IEnumerable<UserCourse>> GetByUserIdAsync(int userId)
    {
        return await _context.UserCourses
            .Include(uc => uc.User)
            .Where(uc => uc.UserId == userId)
            .OrderBy(uc => uc.CourseName)
            .ToListAsync();
    }

    public async Task<IEnumerable<UserCourse>> GetNearbyUserCoursesAsync(int userId, Point location, double radiusMeters)
    {
        return await _context.UserCourses
            .Include(uc => uc.User)
            .Where(uc => uc.UserId == userId && 
                        uc.Location != null &&
                        uc.Location.Distance(location) <= radiusMeters)
            .OrderBy(uc => uc.Location!.Distance(location))
            .ToListAsync();
    }

    public async Task<UserCourse> CreateAsync(UserCourse userCourse)
    {
        _context.UserCourses.Add(userCourse);
        await _context.SaveChangesAsync();
        return userCourse;
    }

    public async Task<UserCourse> UpdateAsync(UserCourse userCourse)
    {
        _context.UserCourses.Update(userCourse);
        await _context.SaveChangesAsync();
        return userCourse;
    }

    public async Task<bool> DeleteAsync(int userId, int courseId)
    {
        var userCourse = await _context.UserCourses
            .FirstOrDefaultAsync(uc => uc.Id == courseId && uc.UserId == userId);
        
        if (userCourse == null)
        {
            return false;
        }

        _context.UserCourses.Remove(userCourse);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsForUserAsync(int userId, string name)
    {
        return await _context.UserCourses
            .AnyAsync(uc => uc.UserId == userId && 
                           uc.CourseName.ToLower() == name.ToLower());
    }

    public async Task<bool> UserHasCourseAccessAsync(int userId, int courseId)
    {
        return await _context.UserCourses
            .AnyAsync(uc => uc.Id == courseId && 
                           uc.UserId == userId);
    }

    public async Task<double> GetDistanceToCourseAsync(int courseId, Point location)
    {
        var userCourse = await _context.UserCourses
            .Where(uc => uc.Id == courseId && uc.Location != null)
            .Select(uc => new { uc.Location })
            .FirstOrDefaultAsync();

        if (userCourse?.Location == null)
        {
            return double.MaxValue;
        }

        return userCourse.Location.Distance(location);
    }

    public async Task<bool> IsPointWithinProximityAsync(int courseId, Point location, double proximityMeters)
    {
        return await _context.UserCourses
            .AnyAsync(uc => uc.Id == courseId && 
                           uc.Location != null && 
                           uc.Location.Distance(location) <= proximityMeters);
    }
}