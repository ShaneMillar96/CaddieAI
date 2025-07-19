using caddie.portal.services.Models;
using NetTopologySuite.Geometries;

namespace caddie.portal.services.Interfaces;

public interface ICourseService
{
    Task<CourseModel?> GetCourseByIdAsync(int id);
    Task<CourseModel?> GetCourseByNameAsync(string name);
    Task<IEnumerable<CourseModel>> GetAllCoursesAsync();
    Task<IEnumerable<CourseModel>> GetActiveCoursesAsync();
    Task<IEnumerable<CourseModel>> SearchCoursesAsync(string searchTerm);
    Task<IEnumerable<CourseModel>> GetNearbyCoursesAsync(double latitude, double longitude, double radiusKm);
    Task<IEnumerable<CourseModel>> GetCoursesByRegionAsync(string region);
    Task<CourseModel> CreateCourseAsync(CreateCourseModel model);
    Task<CourseModel> UpdateCourseAsync(int id, UpdateCourseModel model);
    Task<bool> DeleteCourseAsync(int id);
    Task<bool> IsCourseNameAvailableAsync(string name);
    Task<bool> IsLocationWithinCourseAsync(int courseId, double latitude, double longitude);
    Task<double> GetDistanceToCourseAsync(int courseId, double latitude, double longitude);
    Task<PaginatedResult<CourseModel>> GetPaginatedCoursesAsync(int page, int pageSize, string? searchTerm = null);
}