using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AutoMapper;
using caddie.portal.api.DTOs.Course;
using caddie.portal.api.DTOs.Common;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;

namespace caddie.portal.api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CourseController : ControllerBase
{
    private readonly ICourseService _courseService;
    private readonly IMapper _mapper;
    private readonly ILogger<CourseController> _logger;

    public CourseController(
        ICourseService courseService,
        IMapper mapper,
        ILogger<CourseController> logger)
    {
        _courseService = courseService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get all courses with optional search and pagination
    /// </summary>
    /// <param name="request">Search and pagination parameters</param>
    /// <returns>Paginated list of courses</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PaginatedCourseResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetCourses([FromQuery] CourseSearchRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            var result = await _courseService.GetPaginatedCoursesAsync(request.Page, request.PageSize, request.SearchTerm);
            var response = _mapper.Map<PaginatedCourseResponseDto>(result);
            
            return Ok(ApiResponse<PaginatedCourseResponseDto>.SuccessResponse(response, "Courses retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting courses");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while retrieving courses", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get course by ID with full details
    /// </summary>
    /// <param name="id">Course ID</param>
    /// <returns>Course details</returns>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<CourseResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCourse(int id)
    {
        try
        {
            var course = await _courseService.GetCourseByIdAsync(id);
            if (course == null)
            {
                return NotFound(ApiResponse.ErrorResponse($"Course with ID {id} not found", "COURSE_NOT_FOUND"));
            }

            var response = _mapper.Map<CourseResponseDto>(course);
            return Ok(ApiResponse<CourseResponseDto>.SuccessResponse(response, "Course retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting course {CourseId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while retrieving the course", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Search courses by name
    /// </summary>
    /// <param name="name">Course name</param>
    /// <returns>Course details</returns>
    [HttpGet("name/{name}")]
    [ProducesResponseType(typeof(ApiResponse<CourseResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCourseByName(string name)
    {
        try
        {
            var course = await _courseService.GetCourseByNameAsync(name);
            if (course == null)
            {
                return NotFound(ApiResponse.ErrorResponse($"Course with name '{name}' not found", "COURSE_NOT_FOUND"));
            }

            var response = _mapper.Map<CourseResponseDto>(course);
            return Ok(ApiResponse<CourseResponseDto>.SuccessResponse(response, "Course retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting course by name {CourseName}", name);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while retrieving the course", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get nearby courses within specified radius
    /// </summary>
    /// <param name="request">Location and radius parameters</param>
    /// <returns>List of nearby courses</returns>
    [HttpPost("nearby")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CourseListResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetNearbyCourses([FromBody] NearbyCourseSearchRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            var courses = await _courseService.GetNearbyCoursesAsync(request.Latitude, request.Longitude, request.RadiusKm);
            var response = courses.Select(c => _mapper.Map<CourseListResponseDto>(c));
            
            return Ok(ApiResponse<IEnumerable<CourseListResponseDto>>.SuccessResponse(response, "Nearby courses retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting nearby courses for location ({Latitude}, {Longitude})", request.Latitude, request.Longitude);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while retrieving nearby courses", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get courses by region (city, state, or country)
    /// </summary>
    /// <param name="request">Region search parameters</param>
    /// <returns>List of courses in the region</returns>
    [HttpPost("region")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CourseListResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetCoursesByRegion([FromBody] RegionCourseSearchRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            var courses = await _courseService.GetCoursesByRegionAsync(request.Region);
            var response = courses.Select(c => _mapper.Map<CourseListResponseDto>(c));
            
            return Ok(ApiResponse<IEnumerable<CourseListResponseDto>>.SuccessResponse(response, "Courses retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting courses by region {Region}", request.Region);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while retrieving courses", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Create a new course
    /// </summary>
    /// <param name="request">Course creation details</param>
    /// <returns>Created course details</returns>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<CourseResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            var model = _mapper.Map<CreateCourseModel>(request);
            var course = await _courseService.CreateCourseAsync(model);
            var response = _mapper.Map<CourseResponseDto>(course);
            
            return CreatedAtAction(
                nameof(GetCourse), 
                new { id = course.Id }, 
                ApiResponse<CourseResponseDto>.SuccessResponse(response, "Course created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse.ErrorResponse(ex.Message, "COURSE_EXISTS"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating course {CourseName}", request.Name);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while creating the course", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Update an existing course
    /// </summary>
    /// <param name="id">Course ID</param>
    /// <param name="request">Course update details</param>
    /// <returns>Updated course details</returns>
    [HttpPut("{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<CourseResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateCourse(int id, [FromBody] UpdateCourseRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            var model = _mapper.Map<UpdateCourseModel>(request);
            var course = await _courseService.UpdateCourseAsync(id, model);
            var response = _mapper.Map<CourseResponseDto>(course);
            
            return Ok(ApiResponse<CourseResponseDto>.SuccessResponse(response, "Course updated successfully"));
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
        {
            return NotFound(ApiResponse.ErrorResponse(ex.Message, "COURSE_NOT_FOUND"));
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already exists"))
        {
            return Conflict(ApiResponse.ErrorResponse(ex.Message, "COURSE_EXISTS"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating course {CourseId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while updating the course", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Delete a course
    /// </summary>
    /// <param name="id">Course ID</param>
    /// <returns>Success message</returns>
    [HttpDelete("{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCourse(int id)
    {
        try
        {
            var result = await _courseService.DeleteCourseAsync(id);
            if (!result)
            {
                return NotFound(ApiResponse.ErrorResponse($"Course with ID {id} not found", "COURSE_NOT_FOUND"));
            }

            return Ok(ApiResponse.SuccessResponse("Course deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting course {CourseId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while deleting the course", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Check if course name is available
    /// </summary>
    /// <param name="name">Course name to check</param>
    /// <returns>Availability status</returns>
    [HttpGet("check-name/{name}")]
    [ProducesResponseType(typeof(ApiResponse<CourseNameAvailabilityResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckCourseNameAvailability(string name)
    {
        try
        {
            var isAvailable = await _courseService.IsCourseNameAvailableAsync(name);
            var response = new CourseNameAvailabilityResponseDto
            {
                IsAvailable = isAvailable,
                Message = isAvailable ? "Course name is available" : "Course name is already taken"
            };

            return Ok(ApiResponse<CourseNameAvailabilityResponseDto>.SuccessResponse(response, "Name availability checked successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking course name availability {CourseName}", name);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while checking name availability", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Check if location is within course boundaries
    /// </summary>
    /// <param name="id">Course ID</param>
    /// <param name="request">Location coordinates</param>
    /// <returns>Location within course status</returns>
    [HttpPost("{id:int}/check-location")]
    [ProducesResponseType(typeof(ApiResponse<LocationWithinCourseResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CheckLocationWithinCourse(int id, [FromBody] LocationWithinCourseRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            // First check if course exists
            var course = await _courseService.GetCourseByIdAsync(id);
            if (course == null)
            {
                return NotFound(ApiResponse.ErrorResponse($"Course with ID {id} not found", "COURSE_NOT_FOUND"));
            }

            var isWithin = await _courseService.IsLocationWithinCourseAsync(id, request.Latitude, request.Longitude);
            var response = new LocationWithinCourseResponseDto
            {
                IsWithinCourse = isWithin,
                Message = isWithin ? "Location is within course boundaries" : "Location is outside course boundaries"
            };

            return Ok(ApiResponse<LocationWithinCourseResponseDto>.SuccessResponse(response, "Location check completed successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if location ({Latitude}, {Longitude}) is within course {CourseId}", request.Latitude, request.Longitude, id);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while checking location", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get distance from location to course
    /// </summary>
    /// <param name="id">Course ID</param>
    /// <param name="request">Location coordinates</param>
    /// <returns>Distance to course in kilometers</returns>
    [HttpPost("{id:int}/distance")]
    [ProducesResponseType(typeof(ApiResponse<DistanceToCourseResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDistanceToCourse(int id, [FromBody] DistanceToCourseRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            // First check if course exists
            var course = await _courseService.GetCourseByIdAsync(id);
            if (course == null)
            {
                return NotFound(ApiResponse.ErrorResponse($"Course with ID {id} not found", "COURSE_NOT_FOUND"));
            }

            var distance = await _courseService.GetDistanceToCourseAsync(id, request.Latitude, request.Longitude);
            var response = new DistanceToCourseResponseDto
            {
                DistanceKm = Math.Round(distance, 2),
                Message = $"Distance to course is {Math.Round(distance, 2)} kilometers"
            };

            return Ok(ApiResponse<DistanceToCourseResponseDto>.SuccessResponse(response, "Distance calculated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating distance from location ({Latitude}, {Longitude}) to course {CourseId}", request.Latitude, request.Longitude, id);
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while calculating distance", "INTERNAL_ERROR"));
        }
    }
}