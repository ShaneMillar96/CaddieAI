using Microsoft.Extensions.Logging;
using NetTopologySuite.Geometries;
using NetTopologySuite;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using caddie.portal.dal.Repositories.Interfaces;
using caddie.portal.dal.Models;

namespace caddie.portal.services.Services;

public class UserCourseService : IUserCourseService
{
    private readonly IUserCourseRepository _userCourseRepository;
    private readonly IUserRepository _userRepository;
    private readonly ILogger<UserCourseService> _logger;
    private readonly GeometryFactory _geometryFactory;

    public UserCourseService(
        IUserCourseRepository userCourseRepository,
        IUserRepository userRepository,
        ILogger<UserCourseService> logger)
    {
        _userCourseRepository = userCourseRepository;
        _userRepository = userRepository;
        _logger = logger;
        _geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
    }

    public async Task<UserCourseModel> AddUserCourseAsync(int userId, AddUserCourseModel model)
    {
        try
        {
            // Validate user exists
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException($"User with ID {userId} not found");
            }

            // Check if course name already exists for user
            if (await _userCourseRepository.ExistsForUserAsync(userId, model.Name))
            {
                throw new InvalidOperationException($"A course with the name '{model.Name}' already exists for this user");
            }

            // Create course location point
            var location = _geometryFactory.CreatePoint(new Coordinate(model.Longitude, model.Latitude));

            var course = new Course
            {
                UserId = userId,
                Name = model.Name.Trim(),
                Location = location
            };

            var createdCourse = await _userCourseRepository.CreateAsync(course);
            _logger.LogInformation("User course created successfully: {CourseName} (ID: {CourseId}) for User {UserId}", 
                model.Name, createdCourse.Id, userId);

            return MapToUserCourseModel(createdCourse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user course {CourseName} for User {UserId}", model.Name, userId);
            throw;
        }
    }

    public async Task<IEnumerable<UserCourseModel>> GetUserCoursesAsync(int userId)
    {
        try
        {
            var courses = await _userCourseRepository.GetByUserIdAsync(userId);
            return courses.Select(MapToUserCourseModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting courses for User {UserId}", userId);
            throw;
        }
    }

    public async Task<UserCourseModel?> GetUserCourseByIdAsync(int userId, int courseId)
    {
        try
        {
            var course = await _userCourseRepository.GetByUserAndIdAsync(userId, courseId);
            return course == null ? null : MapToUserCourseModel(course);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting course {CourseId} for User {UserId}", courseId, userId);
            throw;
        }
    }

    public async Task<bool> IsUserAtCourseAsync(int userId, int courseId, double latitude, double longitude, double proximityThresholdMeters = 100)
    {
        try
        {
            // Check if user has access to the course
            if (!await _userCourseRepository.UserHasCourseAccessAsync(userId, courseId))
            {
                return false;
            }

            var location = _geometryFactory.CreatePoint(new Coordinate(longitude, latitude));
            return await _userCourseRepository.IsPointWithinProximityAsync(courseId, location, proximityThresholdMeters);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if User {UserId} is at Course {CourseId}", userId, courseId);
            throw;
        }
    }

    public async Task<bool> UserHasCourseAccessAsync(int userId, int courseId)
    {
        try
        {
            return await _userCourseRepository.UserHasCourseAccessAsync(userId, courseId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking course access for User {UserId} and Course {CourseId}", userId, courseId);
            throw;
        }
    }

    public async Task<bool> DeleteUserCourseAsync(int userId, int courseId)
    {
        try
        {
            var result = await _userCourseRepository.DeleteAsync(userId, courseId);
            if (result)
            {
                _logger.LogInformation("User course deleted successfully: Course {CourseId} for User {UserId}", courseId, userId);
            }
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting course {CourseId} for User {UserId}", courseId, userId);
            throw;
        }
    }

    public async Task<IEnumerable<UserCourseModel>> GetNearbyUserCoursesAsync(int userId, double latitude, double longitude, double radiusKm = 5)
    {
        try
        {
            var location = _geometryFactory.CreatePoint(new Coordinate(longitude, latitude));
            var radiusMeters = radiusKm * 1000; // Convert km to meters

            var courses = await _userCourseRepository.GetNearbyUserCoursesAsync(userId, location, radiusMeters);
            
            var userCourses = new List<UserCourseModel>();
            foreach (var course in courses)
            {
                var userCourse = MapToUserCourseModel(course);
                
                // Calculate distance and set canPlay based on proximity
                if (course.Location != null)
                {
                    var distance = await _userCourseRepository.GetDistanceToCourseAsync(course.Id, location);
                    userCourse.DistanceKm = distance / 1000.0; // Convert meters to km
                    userCourse.CanPlay = distance <= 100; // Can play if within 100 meters
                }
                
                userCourses.Add(userCourse);
            }

            return userCourses.OrderBy(c => c.DistanceKm);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting nearby courses for User {UserId} at location ({Latitude}, {Longitude})", 
                userId, latitude, longitude);
            throw;
        }
    }

    private UserCourseModel MapToUserCourseModel(Course course)
    {
        return new UserCourseModel
        {
            Id = course.Id,
            Name = course.Name,
            Latitude = course.Location?.Y,
            Longitude = course.Location?.X,
            CanPlay = false, // Will be set by proximity check
            CreatedAt = course.CreatedAt,
            UpdatedAt = course.UpdatedAt,
            Holes = course.Holes?.Select(h => new UserHoleModel
            {
                Id = h.Id,
                HoleNumber = h.HoleNumber,
                Par = h.Par
            }).OrderBy(h => h.HoleNumber).ToList() ?? new List<UserHoleModel>()
        };
    }
}