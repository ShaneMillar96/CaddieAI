using Microsoft.Extensions.Logging;
using NetTopologySuite.Geometries;
using NetTopologySuite;
using System.Text.Json;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using caddie.portal.dal.Repositories.Interfaces;
using caddie.portal.dal.Models;

namespace caddie.portal.services.Services;

public class CourseService : ICourseService
{
    private readonly ICourseRepository _courseRepository;
    private readonly ILogger<CourseService> _logger;
    private readonly GeometryFactory _geometryFactory;

    public CourseService(
        ICourseRepository courseRepository,
        ILogger<CourseService> logger)
    {
        _courseRepository = courseRepository;
        _logger = logger;
        _geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
    }

    public async Task<CourseModel?> GetCourseByIdAsync(int id)
    {
        try
        {
            var course = await _courseRepository.GetByIdAsync(id);
            return course == null ? null : MapToCourseModel(course);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting course by ID {CourseId}", id);
            throw;
        }
    }

    public async Task<CourseModel?> GetCourseByNameAsync(string name)
    {
        try
        {
            var course = await _courseRepository.GetByNameAsync(name);
            return course == null ? null : MapToCourseModel(course);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting course by name {CourseName}", name);
            throw;
        }
    }

    public async Task<IEnumerable<CourseModel>> GetAllCoursesAsync()
    {
        try
        {
            var courses = await _courseRepository.GetAllAsync();
            return courses.Select(MapToCourseModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all courses");
            throw;
        }
    }

    public async Task<IEnumerable<CourseModel>> GetActiveCoursesAsync()
    {
        try
        {
            var courses = await _courseRepository.GetActiveAsync();
            return courses.Select(MapToCourseModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active courses");
            throw;
        }
    }

    public async Task<IEnumerable<CourseModel>> SearchCoursesAsync(string searchTerm)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                return await GetActiveCoursesAsync();
            }

            var courses = await _courseRepository.SearchAsync(searchTerm);
            return courses.Select(MapToCourseModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching courses with term {SearchTerm}", searchTerm);
            throw;
        }
    }

    public async Task<IEnumerable<CourseModel>> GetNearbyCoursesAsync(double latitude, double longitude, double radiusKm)
    {
        try
        {
            var location = _geometryFactory.CreatePoint(new Coordinate(longitude, latitude));
            var radiusMeters = radiusKm * 1000; // Convert km to meters

            var courses = await _courseRepository.GetNearbyAsync(location, radiusMeters);
            return courses.Select(MapToCourseModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting nearby courses for location ({Latitude}, {Longitude}) within {RadiusKm}km", latitude, longitude, radiusKm);
            throw;
        }
    }

    public async Task<IEnumerable<CourseModel>> GetCoursesByRegionAsync(string region)
    {
        try
        {
            var courses = await _courseRepository.GetByRegionAsync(region);
            return courses.Select(MapToCourseModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting courses by region {Region}", region);
            throw;
        }
    }

    public async Task<CourseModel> CreateCourseAsync(CreateCourseModel model)
    {
        try
        {
            // Check if course name already exists
            if (await _courseRepository.ExistsAsync(model.Name))
            {
                throw new InvalidOperationException($"A course with the name '{model.Name}' already exists");
            }

            var course = new Course
            {
                Name = model.Name.Trim(),
                Description = model.Description?.Trim(),
                Address = model.Address?.Trim(),
                City = model.City?.Trim(),
                State = model.State?.Trim(),
                Country = model.Country.Trim(),
                Phone = model.Phone?.Trim(),
                Website = model.Website?.Trim(),
                Email = model.Email?.Trim(),
                TotalHoles = model.TotalHoles,
                ParTotal = model.ParTotal,
                SlopeRating = model.SlopeRating,
                CourseRating = model.CourseRating,
                YardageTotal = model.YardageTotal,
                GreenFeeRange = model.GreenFeeRange,
                Timezone = model.Timezone,
                IsActive = model.IsActive,
                Location = _geometryFactory.CreatePoint(new Coordinate(model.Longitude, model.Latitude)),
                Amenities = model.Amenities != null ? JsonSerializer.Serialize(model.Amenities) : null,
                Holes = model.Holes.Select(h => new Hole
                {
                    HoleNumber = h.HoleNumber,
                    Par = h.Par,
                    YardageBlue = h.YardageMen,
                    YardageRed = h.YardageWomen,
                    StrokeIndex = h.Handicap,
                    HoleDescription = h.Description?.Trim()
                }).ToList()
            };

            var createdCourse = await _courseRepository.CreateAsync(course);
            _logger.LogInformation("Course created successfully: {CourseName} (ID: {CourseId})", model.Name, createdCourse.Id);
            
            return MapToCourseModel(createdCourse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating course {CourseName}", model.Name);
            throw;
        }
    }

    public async Task<CourseModel> UpdateCourseAsync(int id, UpdateCourseModel model)
    {
        try
        {
            var existingCourse = await _courseRepository.GetByIdAsync(id);
            if (existingCourse == null)
            {
                throw new InvalidOperationException($"Course with ID {id} not found");
            }

            // Check if new name conflicts with existing course (excluding current course)
            var courseWithSameName = await _courseRepository.GetByNameAsync(model.Name);
            if (courseWithSameName != null && courseWithSameName.Id != id)
            {
                throw new InvalidOperationException($"A course with the name '{model.Name}' already exists");
            }

            // Update course properties
            existingCourse.Name = model.Name.Trim();
            existingCourse.Description = model.Description?.Trim();
            existingCourse.Address = model.Address?.Trim();
            existingCourse.City = model.City?.Trim();
            existingCourse.State = model.State?.Trim();
            existingCourse.Country = model.Country.Trim();
            existingCourse.Phone = model.Phone?.Trim();
            existingCourse.Website = model.Website?.Trim();
            existingCourse.Email = model.Email?.Trim();
            existingCourse.TotalHoles = model.TotalHoles;
            existingCourse.ParTotal = model.ParTotal;
            existingCourse.SlopeRating = model.SlopeRating;
            existingCourse.CourseRating = model.CourseRating;
            existingCourse.YardageTotal = model.YardageTotal;
            existingCourse.GreenFeeRange = model.GreenFeeRange;
            existingCourse.Timezone = model.Timezone;
            existingCourse.IsActive = model.IsActive;
            existingCourse.Location = _geometryFactory.CreatePoint(new Coordinate(model.Longitude, model.Latitude));
            existingCourse.Amenities = model.Amenities != null ? JsonSerializer.Serialize(model.Amenities) : null;

            var updatedCourse = await _courseRepository.UpdateAsync(existingCourse);
            _logger.LogInformation("Course updated successfully: {CourseName} (ID: {CourseId})", model.Name, id);
            
            return MapToCourseModel(updatedCourse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating course {CourseId}", id);
            throw;
        }
    }

    public async Task<bool> DeleteCourseAsync(int id)
    {
        try
        {
            var result = await _courseRepository.DeleteAsync(id);
            if (result)
            {
                _logger.LogInformation("Course deleted successfully: ID {CourseId}", id);
            }
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting course {CourseId}", id);
            throw;
        }
    }

    public async Task<bool> IsCourseNameAvailableAsync(string name)
    {
        try
        {
            return !await _courseRepository.ExistsAsync(name);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking course name availability {CourseName}", name);
            throw;
        }
    }

    public async Task<bool> IsLocationWithinCourseAsync(int courseId, double latitude, double longitude)
    {
        try
        {
            var location = _geometryFactory.CreatePoint(new Coordinate(longitude, latitude));
            return await _courseRepository.IsPointWithinCourseAsync(courseId, location);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if location ({Latitude}, {Longitude}) is within course {CourseId}", latitude, longitude, courseId);
            throw;
        }
    }

    public async Task<double> GetDistanceToCourseAsync(int courseId, double latitude, double longitude)
    {
        try
        {
            var location = _geometryFactory.CreatePoint(new Coordinate(longitude, latitude));
            var distance = await _courseRepository.GetDistanceToCourseAsync(courseId, location);
            
            // Convert from meters to kilometers
            return distance / 1000.0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating distance to course {CourseId} from location ({Latitude}, {Longitude})", courseId, latitude, longitude);
            throw;
        }
    }

    public async Task<PaginatedResult<CourseModel>> GetPaginatedCoursesAsync(int page, int pageSize, string? searchTerm = null)
    {
        try
        {
            var courses = await _courseRepository.GetPaginatedAsync(page, pageSize, searchTerm);
            var totalCount = await _courseRepository.GetTotalCountAsync(searchTerm);
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            return new PaginatedResult<CourseModel>
            {
                Data = courses.Select(MapToCourseModel),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages,
                HasNextPage = page < totalPages,
                HasPreviousPage = page > 1
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paginated courses (page: {Page}, size: {PageSize}, search: {SearchTerm})", page, pageSize, searchTerm);
            throw;
        }
    }

    private CourseModel MapToCourseModel(Course course)
    {
        return new CourseModel
        {
            Id = course.Id,
            Name = course.Name,
            Description = course.Description,
            Address = course.Address,
            City = course.City,
            State = course.State,
            Country = course.Country,
            Phone = course.Phone,
            Website = course.Website,
            Email = course.Email,
            TotalHoles = course.TotalHoles,
            ParTotal = course.ParTotal,
            SlopeRating = course.SlopeRating,
            CourseRating = course.CourseRating,
            YardageTotal = course.YardageTotal,
            GreenFeeRange = course.GreenFeeRange,
            Timezone = course.Timezone,
            IsActive = course.IsActive,
            Latitude = course.Location?.Y,
            Longitude = course.Location?.X,
            Amenities = course.Amenities != null ? JsonSerializer.Deserialize<Dictionary<string, object>>(course.Amenities) : null,
            Holes = course.Holes?.Select(h => new HoleModel
            {
                Id = h.Id,
                HoleNumber = h.HoleNumber,
                Par = h.Par,
                YardageMen = h.YardageBlue,
                YardageWomen = h.YardageRed,
                Handicap = h.StrokeIndex,
                Description = h.HoleDescription
            }).ToList() ?? new List<HoleModel>(),
            CreatedAt = course.CreatedAt,
            UpdatedAt = course.UpdatedAt
        };
    }
}