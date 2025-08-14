using caddie.portal.dal.Models;
using NetTopologySuite.Geometries;

namespace caddie.portal.dal.Repositories.Interfaces;

public interface IUserCourseRepository
{
    Task<Course?> GetByIdAsync(int id);
    Task<Course?> GetByUserAndIdAsync(int userId, int courseId);
    Task<IEnumerable<Course>> GetByUserIdAsync(int userId);
    Task<IEnumerable<Course>> GetNearbyUserCoursesAsync(int userId, Point location, double radiusMeters);
    Task<Course> CreateAsync(Course course);
    Task<Course> UpdateAsync(Course course);
    Task<bool> DeleteAsync(int userId, int courseId);
    Task<bool> ExistsForUserAsync(int userId, string name);
    Task<bool> UserHasCourseAccessAsync(int userId, int courseId);
    Task<double> GetDistanceToCourseAsync(int courseId, Point location);
    Task<bool> IsPointWithinProximityAsync(int courseId, Point location, double proximityMeters);
}