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
    private readonly ICourseRepository _courseRepository;
    private readonly IUserRepository _userRepository;
    private readonly ILogger<UserCourseService> _logger;
    private readonly GeometryFactory _geometryFactory;

    public UserCourseService(
        IUserCourseRepository userCourseRepository,
        ICourseRepository courseRepository,
        IUserRepository userRepository,
        ILogger<UserCourseService> logger)
    {
        _userCourseRepository = userCourseRepository;
        _courseRepository = courseRepository;
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

            Course course;
            
            if (model.CourseId.HasValue)
            {
                // Option 1: Associate with existing course by ID
                var existingCourseById = await _courseRepository.GetByIdAsync(model.CourseId.Value);
                if (existingCourseById == null)
                {
                    throw new InvalidOperationException($"Course with ID {model.CourseId} not found");
                }
                course = existingCourseById;
            }
            else if (!string.IsNullOrWhiteSpace(model.CourseName) && model.Latitude.HasValue && model.Longitude.HasValue)
            {
                // Option 2: Create new course or find existing by name
                var location = _geometryFactory.CreatePoint(new Coordinate((double)model.Longitude.Value, (double)model.Latitude.Value));
                
                var existingCourse = await _courseRepository.GetByNameAsync(model.CourseName.Trim());
                
                if (existingCourse == null)
                {
                    // Create new course
                    course = new Course
                    {
                        Name = model.CourseName.Trim(),
                        Address = model.Address?.Trim(),
                        City = model.City?.Trim(),
                        State = model.State?.Trim(),
                        Country = model.Country?.Trim(),
                        Location = location,
                        Latitude = model.Latitude.Value,
                        Longitude = model.Longitude.Value
                    };
                    
                    course = await _courseRepository.CreateAsync(course);
                    _logger.LogInformation("New course created: {CourseName} (ID: {CourseId})", course.Name, course.Id);
                }
                else
                {
                    course = existingCourse;
                }
            }
            else
            {
                throw new InvalidOperationException("Either CourseId or (CourseName + Latitude + Longitude) must be provided");
            }

            // Check if user already has access to this course
            if (await _userCourseRepository.ExistsByUserAndCourseAsync(userId, course.Id))
            {
                throw new InvalidOperationException($"User already has access to course '{course.Name}'");
            }

            // Create UserCourse association
            var userCourse = new UserCourse
            {
                UserId = userId,
                CourseId = course.Id
            };

            var createdUserCourse = await _userCourseRepository.CreateAsync(userCourse);
            _logger.LogInformation("User course association created: Course {CourseName} (ID: {CourseId}) for User {UserId}", 
                course.Name, course.Id, userId);

            return MapToUserCourseModel(createdUserCourse, course);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user course association for User {UserId}. Model: {@Model}", userId, model);
            throw;
        }
    }

    public async Task<IEnumerable<UserCourseModel>> GetUserCoursesAsync(int userId)
    {
        try
        {
            var userCourses = await _userCourseRepository.GetByUserIdAsync(userId);
            return userCourses.Select(uc => MapToUserCourseModel(uc, uc.Course));
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
            var userCourse = await _userCourseRepository.GetByUserAndCourseAsync(userId, courseId);
            return userCourse == null ? null : MapToUserCourseModel(userCourse, userCourse.Course);
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
            if (!await _userCourseRepository.UserHasCourseAsync(userId, courseId))
            {
                return false;
            }

            var location = _geometryFactory.CreatePoint(new Coordinate(longitude, latitude));
            return await _courseRepository.IsPointWithinCourseAsync(courseId, location);
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
            return await _userCourseRepository.UserHasCourseAsync(userId, courseId);
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

            var userCourses = await _userCourseRepository.GetCoursesWithinRadiusAsync(userId, location, radiusMeters);
            
            var userCourseModels = new List<UserCourseModel>();
            foreach (var userCourse in userCourses)
            {
                if (userCourse.Course == null)
                {
                    _logger.LogWarning("UserCourse {UserCourseId} has null Course reference", userCourse.Id);
                    continue;
                }

                var userCourseModel = MapToUserCourseModel(userCourse, userCourse.Course);
                
                // Calculate distance and set canPlay based on proximity
                if (userCourse.Course.Location != null)
                {
                    var distance = await _courseRepository.GetDistanceToCourseAsync(userCourse.Course.Id, location);
                    userCourseModel.DistanceKm = distance / 1000.0; // Convert meters to km
                    userCourseModel.CanPlay = distance <= 100; // Can play if within 100 meters
                }
                
                userCourseModels.Add(userCourseModel);
            }

            return userCourseModels.OrderBy(c => c.DistanceKm);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting nearby courses for User {UserId} at location ({Latitude}, {Longitude})", 
                userId, latitude, longitude);
            throw;
        }
    }

    private UserCourseModel MapToUserCourseModel(UserCourse userCourse, Course course)
    {
        return new UserCourseModel
        {
            Id = userCourse.Id,
            CourseId = userCourse.CourseId,
            CourseName = course.Name,
            Address = course.Address,
            City = course.City,
            State = course.State,
            Country = course.Country,
            Latitude = course.Latitude,
            Longitude = course.Longitude,
            CanPlay = false, // Will be set by proximity check
            CreatedAt = userCourse.CreatedAt,
            UpdatedAt = null // UserCourse join table doesn't have UpdatedAt
        };
    }
}