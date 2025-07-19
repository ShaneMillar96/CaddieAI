using caddie.portal.dal.Models;
using NetTopologySuite.Geometries;

namespace caddie.portal.dal.Repositories.Interfaces;

public interface ICourseRepository
{
    Task<Course?> GetByIdAsync(int id);
    Task<Course?> GetByNameAsync(string name);
    Task<IEnumerable<Course>> GetAllAsync();
    Task<IEnumerable<Course>> GetActiveAsync();
    Task<IEnumerable<Course>> SearchAsync(string searchTerm);
    Task<IEnumerable<Course>> GetNearbyAsync(Point location, double radiusMeters);
    Task<IEnumerable<Course>> GetByRegionAsync(string region);
    Task<Course> CreateAsync(Course course);
    Task<Course> UpdateAsync(Course course);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(string name);
    Task<bool> IsPointWithinCourseAsync(int courseId, Point point);
    Task<double> GetDistanceToCourseAsync(int courseId, Point point);
    Task<IEnumerable<Course>> GetPaginatedAsync(int page, int pageSize, string? searchTerm = null);
    Task<int> GetTotalCountAsync(string? searchTerm = null);
}