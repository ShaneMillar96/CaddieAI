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
            .Include(uc => uc.Course)
            .FirstOrDefaultAsync(uc => uc.Id == id);
    }

    public async Task<UserCourse?> GetByUserAndCourseAsync(int userId, int courseId)
    {
        return await _context.UserCourses
            .Include(uc => uc.User)
            .Include(uc => uc.Course)
            .FirstOrDefaultAsync(uc => uc.UserId == userId && uc.CourseId == courseId);
    }

    public async Task<IEnumerable<UserCourse>> GetByUserIdAsync(int userId)
    {
        return await _context.UserCourses
            .Include(uc => uc.User)
            .Include(uc => uc.Course)
            .Where(uc => uc.UserId == userId)
            .OrderBy(uc => uc.Course.Name)
            .ToListAsync();
    }

    public async Task<IEnumerable<UserCourse>> GetCoursesWithinRadiusAsync(int userId, Point location, double radiusMeters)
    {
        return await _context.UserCourses
            .Include(uc => uc.User)
            .Include(uc => uc.Course)
            .Where(uc => uc.UserId == userId && 
                        uc.Course.Location != null &&
                        uc.Course.Location.Distance(location) <= radiusMeters)
            .OrderBy(uc => uc.Course.Location!.Distance(location))
            .ToListAsync();
    }

    public async Task<UserCourse> CreateAsync(UserCourse userCourse)
    {
        _context.UserCourses.Add(userCourse);
        await _context.SaveChangesAsync();
        return userCourse;
    }


    public async Task<bool> DeleteAsync(int userId, int courseId)
    {
        var userCourse = await _context.UserCourses
            .FirstOrDefaultAsync(uc => uc.UserId == userId && uc.CourseId == courseId);
        
        if (userCourse == null)
        {
            return false;
        }

        _context.UserCourses.Remove(userCourse);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsByUserAndCourseAsync(int userId, int courseId)
    {
        return await _context.UserCourses
            .AnyAsync(uc => uc.UserId == userId && 
                           uc.CourseId == courseId);
    }

    public async Task<bool> UserHasCourseAsync(int userId, int courseId)
    {
        return await _context.UserCourses
            .AnyAsync(uc => uc.UserId == userId && 
                           uc.CourseId == courseId);
    }

}