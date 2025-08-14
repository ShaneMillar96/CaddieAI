using caddie.portal.dal.Models;
using NetTopologySuite.Geometries;

namespace caddie.portal.dal.Repositories.Interfaces;

public interface IUserCourseRepository
{
    Task<UserCourse?> GetByIdAsync(int id);
    Task<UserCourse?> GetByUserAndCourseAsync(int userId, int courseId);
    Task<IEnumerable<UserCourse>> GetByUserIdAsync(int userId);
    Task<IEnumerable<UserCourse>> GetCoursesWithinRadiusAsync(int userId, Point location, double radiusMeters);
    Task<UserCourse> CreateAsync(UserCourse userCourse);
    Task<bool> DeleteAsync(int userId, int courseId);
    Task<bool> UserHasCourseAsync(int userId, int courseId);
    Task<bool> ExistsByUserAndCourseAsync(int userId, int courseId);
}