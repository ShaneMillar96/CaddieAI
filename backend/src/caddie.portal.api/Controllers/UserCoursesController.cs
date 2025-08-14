using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using caddie.portal.api.DTOs.UserCourse;
using caddie.portal.api.DTOs.Common;
using System.Security.Claims;

namespace caddie.portal.api.Controllers;

[Authorize]
[ApiController]
[Route("api/user/courses")]
public class UserCoursesController : ControllerBase
{
    private readonly IUserCourseService _userCourseService;
    private readonly IMapper _mapper;
    private readonly ILogger<UserCoursesController> _logger;

    public UserCoursesController(
        IUserCourseService userCourseService,
        IMapper mapper,
        ILogger<UserCoursesController> logger)
    {
        _userCourseService = userCourseService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Add a new course to the user's list
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<UserCourseResponseDto>>> AddUserCourse([FromBody] AddUserCourseRequestDto request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var model = _mapper.Map<AddUserCourseModel>(request);
            
            var userCourse = await _userCourseService.AddUserCourseAsync(userId, model);
            var response = _mapper.Map<UserCourseResponseDto>(userCourse);

            _logger.LogInformation("User {UserId} successfully added course: {CourseName}", userId, request.CourseName ?? $"CourseId {request.CourseId}");

            return Ok(ApiResponse<UserCourseResponseDto>.SuccessResponse(response, "Course added successfully"));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation while adding course for user {UserId}: {Error}", GetCurrentUserId(), ex.Message);
            return BadRequest(ApiResponse<UserCourseResponseDto>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding course for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse<UserCourseResponseDto>.ErrorResponse("An error occurred while adding the course"));
        }
    }

    /// <summary>
    /// Get all courses for the current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<UserCourseResponseDto>>>> GetUserCourses()
    {
        try
        {
            var userId = GetCurrentUserId();
            var userCourses = await _userCourseService.GetUserCoursesAsync(userId);
            var response = _mapper.Map<IEnumerable<UserCourseResponseDto>>(userCourses);

            return Ok(ApiResponse<IEnumerable<UserCourseResponseDto>>.SuccessResponse(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting courses for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse<IEnumerable<UserCourseResponseDto>>.ErrorResponse("An error occurred while retrieving courses"));
        }
    }

    /// <summary>
    /// Get a specific course by ID for the current user
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<UserCourseResponseDto>>> GetUserCourse(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userCourse = await _userCourseService.GetUserCourseByIdAsync(userId, id);
            
            if (userCourse == null)
            {
                return NotFound(ApiResponse<UserCourseResponseDto>.ErrorResponse("Course not found or access denied"));
            }

            var response = _mapper.Map<UserCourseResponseDto>(userCourse);
            return Ok(ApiResponse<UserCourseResponseDto>.SuccessResponse(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting course {CourseId} for user {UserId}", id, GetCurrentUserId());
            return StatusCode(500, ApiResponse<UserCourseResponseDto>.ErrorResponse("An error occurred while retrieving the course"));
        }
    }

    /// <summary>
    /// Check if user is near a specific course (within proximity threshold)
    /// </summary>
    [HttpGet("{id:int}/proximity")]
    public async Task<ActionResult<ApiResponse<UserCourseProximityResponseDto>>> CheckCourseProximity(
        int id, 
        [FromQuery] double latitude, 
        [FromQuery] double longitude, 
        [FromQuery] double proximityThresholdMeters = 100)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            // Validate coordinates
            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
            {
                return BadRequest(ApiResponse<UserCourseProximityResponseDto>.ErrorResponse("Invalid coordinates"));
            }

            var isNearCourse = await _userCourseService.IsUserAtCourseAsync(userId, id, latitude, longitude, proximityThresholdMeters);
            var userCourse = await _userCourseService.GetUserCourseByIdAsync(userId, id);
            
            if (userCourse == null)
            {
                return NotFound(ApiResponse<UserCourseProximityResponseDto>.ErrorResponse("Course not found or access denied"));
            }

            // Calculate actual distance for response
            var distanceMeters = 0.0;
            if (userCourse.Latitude.HasValue && userCourse.Longitude.HasValue)
            {
                // Simple distance calculation (more accurate calculation would use Haversine formula)
                var latDiff = Math.Abs(latitude - (double)userCourse.Latitude.Value);
                var lonDiff = Math.Abs(longitude - (double)userCourse.Longitude.Value);
                distanceMeters = Math.Sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111139; // Approximate conversion to meters
            }

            var response = new UserCourseProximityResponseDto
            {
                UserCourseId = id,
                CourseId = userCourse.CourseId,
                CourseName = userCourse.CourseName,
                IsWithinProximity = isNearCourse,
                DistanceMeters = distanceMeters,
                DistanceKm = distanceMeters / 1000.0
            };

            return Ok(ApiResponse<UserCourseProximityResponseDto>.SuccessResponse(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking proximity for course {CourseId} and user {UserId}", id, GetCurrentUserId());
            return StatusCode(500, ApiResponse<UserCourseProximityResponseDto>.ErrorResponse("An error occurred while checking course proximity"));
        }
    }

    /// <summary>
    /// Get nearby courses for the current user
    /// </summary>
    [HttpGet("nearby")]
    public async Task<ActionResult<ApiResponse<IEnumerable<UserCourseResponseDto>>>> GetNearbyUserCourses(
        [FromQuery] double latitude, 
        [FromQuery] double longitude, 
        [FromQuery] double radiusKm = 5)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            // Validate coordinates
            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
            {
                return BadRequest(ApiResponse<IEnumerable<UserCourseResponseDto>>.ErrorResponse("Invalid coordinates"));
            }

            // Validate radius
            if (radiusKm <= 0 || radiusKm > 100)
            {
                return BadRequest(ApiResponse<IEnumerable<UserCourseResponseDto>>.ErrorResponse("Radius must be between 0 and 100 km"));
            }

            var nearbyCourses = await _userCourseService.GetNearbyUserCoursesAsync(userId, latitude, longitude, radiusKm);
            var response = _mapper.Map<IEnumerable<UserCourseResponseDto>>(nearbyCourses);

            return Ok(ApiResponse<IEnumerable<UserCourseResponseDto>>.SuccessResponse(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting nearby courses for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse<IEnumerable<UserCourseResponseDto>>.ErrorResponse("An error occurred while retrieving nearby courses"));
        }
    }

    /// <summary>
    /// Delete a user course
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteUserCourse(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            // Get the user course first to find the actual course ID
            var userCourse = await _userCourseService.GetUserCourseByIdAsync(userId, id);
            if (userCourse == null)
            {
                return NotFound(ApiResponse<bool>.ErrorResponse("Course not found or access denied"));
            }
            
            var result = await _userCourseService.DeleteUserCourseAsync(userId, userCourse.CourseId);
            
            if (!result)
            {
                return NotFound(ApiResponse<bool>.ErrorResponse("Course not found or access denied"));
            }

            _logger.LogInformation("User {UserId} successfully deleted course {CourseId}", userId, id);
            return Ok(ApiResponse<bool>.SuccessResponse(true, "Course deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting course {CourseId} for user {UserId}", id, GetCurrentUserId());
            return StatusCode(500, ApiResponse<bool>.ErrorResponse("An error occurred while deleting the course"));
        }
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return userId;
    }
}