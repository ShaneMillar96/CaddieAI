using caddie.portal.dal.Models;
using NetTopologySuite.Geometries;

namespace caddie.portal.dal.Repositories.Interfaces;

public interface IUserCourseRepository
{
    Task<UserCourse?> GetByIdAsync(int id);
    Task<UserCourse?> GetByUserAndIdAsync(int userId, int courseId);
    Task<IEnumerable<UserCourse>> GetByUserIdAsync(int userId);
    Task<IEnumerable<UserCourse>> GetNearbyUserCoursesAsync(int userId, Point location, double radiusMeters);
    Task<UserCourse> CreateAsync(UserCourse userCourse);
    Task<UserCourse> UpdateAsync(UserCourse userCourse);
    Task<bool> DeleteAsync(int userId, int courseId);
    Task<bool> ExistsForUserAsync(int userId, string name);
    Task<bool> UserHasCourseAccessAsync(int userId, int courseId);
    Task<double> GetDistanceToCourseAsync(int courseId, Point location);
    Task<bool> IsPointWithinProximityAsync(int courseId, Point location, double proximityMeters);
}