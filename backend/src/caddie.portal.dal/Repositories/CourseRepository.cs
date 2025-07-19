using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NetTopologySuite.Geometries;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories.Interfaces;

namespace caddie.portal.dal.Repositories;

public class CourseRepository : ICourseRepository
{
    private readonly CaddieAIDbContext _context;
    private readonly ILogger<CourseRepository> _logger;

    public CourseRepository(CaddieAIDbContext context, ILogger<CourseRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Course?> GetByIdAsync(int id)
    {
        try
        {
            return await _context.Courses
                .Include(c => c.Holes)
                .FirstOrDefaultAsync(c => c.Id == id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting course by ID {CourseId}", id);
            throw;
        }
    }

    public async Task<Course?> GetByNameAsync(string name)
    {
        try
        {
            return await _context.Courses
                .Include(c => c.Holes)
                .FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting course by name {CourseName}", name);
            throw;
        }
    }

    public async Task<IEnumerable<Course>> GetAllAsync()
    {
        try
        {
            return await _context.Courses
                .Include(c => c.Holes)
                .OrderBy(c => c.Name)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all courses");
            throw;
        }
    }

    public async Task<IEnumerable<Course>> GetActiveAsync()
    {
        try
        {
            return await _context.Courses
                .Include(c => c.Holes)
                .Where(c => c.IsActive == true)
                .OrderBy(c => c.Name)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active courses");
            throw;
        }
    }

    public async Task<IEnumerable<Course>> SearchAsync(string searchTerm)
    {
        try
        {
            var lowerSearchTerm = searchTerm.ToLower();
            return await _context.Courses
                .Include(c => c.Holes)
                .Where(c => c.IsActive == true && (
                    c.Name.ToLower().Contains(lowerSearchTerm) ||
                    (c.Description != null && c.Description.ToLower().Contains(lowerSearchTerm)) ||
                    (c.Address != null && c.Address.ToLower().Contains(lowerSearchTerm)) ||
                    (c.City != null && c.City.ToLower().Contains(lowerSearchTerm)) ||
                    (c.State != null && c.State.ToLower().Contains(lowerSearchTerm)) ||
                    c.Country.ToLower().Contains(lowerSearchTerm)))
                .OrderBy(c => c.Name)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching courses with term {SearchTerm}", searchTerm);
            throw;
        }
    }

    public async Task<IEnumerable<Course>> GetNearbyAsync(Point location, double radiusMeters)
    {
        try
        {
            return await _context.Courses
                .Include(c => c.Holes)
                .Where(c => c.IsActive == true && c.Location != null && c.Location.IsWithinDistance(location, radiusMeters))
                .OrderBy(c => c.Location!.Distance(location))
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting nearby courses for location {Location} within {Radius}m", location, radiusMeters);
            throw;
        }
    }

    public async Task<IEnumerable<Course>> GetByRegionAsync(string region)
    {
        try
        {
            var lowerRegion = region.ToLower();
            return await _context.Courses
                .Include(c => c.Holes)
                .Where(c => c.IsActive == true && (
                    (c.City != null && c.City.ToLower() == lowerRegion) ||
                    (c.State != null && c.State.ToLower() == lowerRegion) ||
                    c.Country.ToLower() == lowerRegion))
                .OrderBy(c => c.Name)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting courses by region {Region}", region);
            throw;
        }
    }

    public async Task<Course> CreateAsync(Course course)
    {
        try
        {
            course.CreatedAt = DateTime.UtcNow;
            course.UpdatedAt = DateTime.UtcNow;

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Course created successfully: {CourseName} (ID: {CourseId})", course.Name, course.Id);
            return course;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating course {CourseName}", course.Name);
            throw;
        }
    }

    public async Task<Course> UpdateAsync(Course course)
    {
        try
        {
            course.UpdatedAt = DateTime.UtcNow;
            
            _context.Courses.Update(course);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Course updated successfully: {CourseName} (ID: {CourseId})", course.Name, course.Id);
            return course;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating course {CourseId}", course.Id);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        try
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null)
            {
                return false;
            }

            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Course deleted successfully: ID {CourseId}", id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting course {CourseId}", id);
            throw;
        }
    }

    public async Task<bool> ExistsAsync(string name)
    {
        try
        {
            return await _context.Courses
                .AnyAsync(c => c.Name.ToLower() == name.ToLower());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if course exists {CourseName}", name);
            throw;
        }
    }

    public async Task<bool> IsPointWithinCourseAsync(int courseId, Point point)
    {
        try
        {
            var course = await _context.Courses
                .Where(c => c.Id == courseId && c.Boundary != null)
                .FirstOrDefaultAsync();

            if (course?.Boundary == null)
            {
                return false;
            }

            return course.Boundary.Contains(point);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if point {Point} is within course {CourseId}", point, courseId);
            throw;
        }
    }

    public async Task<double> GetDistanceToCourseAsync(int courseId, Point point)
    {
        try
        {
            var course = await _context.Courses
                .Where(c => c.Id == courseId)
                .FirstOrDefaultAsync();

            if (course?.Location == null)
            {
                return double.MaxValue;
            }

            return course.Location.Distance(point);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating distance to course {CourseId} from point {Point}", courseId, point);
            throw;
        }
    }

    public async Task<IEnumerable<Course>> GetPaginatedAsync(int page, int pageSize, string? searchTerm = null)
    {
        try
        {
            var query = _context.Courses
                .Include(c => c.Holes)
                .Where(c => c.IsActive == true);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var lowerSearchTerm = searchTerm.ToLower();
                query = query.Where(c => 
                    c.Name.ToLower().Contains(lowerSearchTerm) ||
                    (c.Description != null && c.Description.ToLower().Contains(lowerSearchTerm)) ||
                    (c.Address != null && c.Address.ToLower().Contains(lowerSearchTerm)) ||
                    (c.City != null && c.City.ToLower().Contains(lowerSearchTerm)) ||
                    (c.State != null && c.State.ToLower().Contains(lowerSearchTerm)) ||
                    c.Country.ToLower().Contains(lowerSearchTerm));
            }

            return await query
                .OrderBy(c => c.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paginated courses (page: {Page}, size: {PageSize}, search: {SearchTerm})", page, pageSize, searchTerm);
            throw;
        }
    }

    public async Task<int> GetTotalCountAsync(string? searchTerm = null)
    {
        try
        {
            var query = _context.Courses.Where(c => c.IsActive == true);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var lowerSearchTerm = searchTerm.ToLower();
                query = query.Where(c => 
                    c.Name.ToLower().Contains(lowerSearchTerm) ||
                    (c.Description != null && c.Description.ToLower().Contains(lowerSearchTerm)) ||
                    (c.Address != null && c.Address.ToLower().Contains(lowerSearchTerm)) ||
                    (c.City != null && c.City.ToLower().Contains(lowerSearchTerm)) ||
                    (c.State != null && c.State.ToLower().Contains(lowerSearchTerm)) ||
                    c.Country.ToLower().Contains(lowerSearchTerm));
            }

            return await query.CountAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting total count of courses (search: {SearchTerm})", searchTerm);
            throw;
        }
    }
}