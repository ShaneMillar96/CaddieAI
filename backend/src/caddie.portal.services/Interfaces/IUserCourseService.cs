using caddie.portal.services.Models;

namespace caddie.portal.services.Interfaces;

public interface IUserCourseService
{
    Task<UserCourseModel> AddUserCourseAsync(int userId, AddUserCourseModel model);
    Task<IEnumerable<UserCourseModel>> GetUserCoursesAsync(int userId);
    Task<UserCourseModel?> GetUserCourseByIdAsync(int userId, int courseId);
    Task<bool> IsUserAtCourseAsync(int userId, int courseId, double latitude, double longitude, double proximityThresholdMeters = 100);
    Task<bool> UserHasCourseAccessAsync(int userId, int courseId);
    Task<bool> DeleteUserCourseAsync(int userId, int courseId);
    Task<IEnumerable<UserCourseModel>> GetNearbyUserCoursesAsync(int userId, double latitude, double longitude, double radiusKm = 5);
}