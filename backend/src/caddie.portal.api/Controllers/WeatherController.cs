using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using caddie.portal.services.Interfaces;
using caddie.portal.api.DTOs.Common;

namespace caddie.portal.api.Controllers;

/// <summary>
/// Controller for weather-related operations
/// </summary>
[ApiController]
[Route("api")]
public class WeatherController : ControllerBase
{
    private readonly IWeatherService _weatherService;
    private readonly ICourseService _courseService;
    private readonly ILogger<WeatherController> _logger;

    public WeatherController(
        IWeatherService weatherService,
        ICourseService courseService,
        ILogger<WeatherController> logger)
    {
        _weatherService = weatherService;
        _courseService = courseService;
        _logger = logger;
    }

    /// <summary>
    /// Get weather information for a specific course
    /// </summary>
    [HttpGet("course/{courseId}/weather")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> GetCourseWeather(int courseId)
    {
        try
        {
            // Get course details to get coordinates
            var course = await _courseService.GetCourseByIdAsync(courseId);
            if (course == null)
            {
                return NotFound(ApiResponse<object>.ErrorResponse("Course not found", "COURSE_NOT_FOUND"));
            }

            if (!course.Latitude.HasValue || !course.Longitude.HasValue)
            {
                _logger.LogWarning("Course {CourseId} does not have coordinates set", courseId);
                return BadRequest(ApiResponse<object>.ErrorResponse("Course coordinates not available", "COORDINATES_MISSING"));
            }

            // Get weather data
            var weatherData = await _weatherService.GetWeatherByCoordinatesAsync(
                (double)course.Latitude.Value, 
                (double)course.Longitude.Value);

            var response = new
            {
                CourseId = courseId,
                CourseName = course.Name,
                Weather = new
                {
                    weatherData.Temperature,
                    weatherData.WindSpeed,
                    weatherData.WindDirection,
                    weatherData.Humidity,
                    weatherData.Precipitation,
                    weatherData.Conditions,
                    weatherData.Timestamp
                },
                Location = new
                {
                    Latitude = course.Latitude,
                    Longitude = course.Longitude
                }
            };

            _logger.LogInformation("Successfully retrieved weather for course {CourseId}: {Conditions}, {Temperature}°C", 
                courseId, weatherData.Conditions, weatherData.Temperature);

            return Ok(ApiResponse<object>.SuccessResponse(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving weather for course {CourseId}", courseId);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("An error occurred while retrieving weather data"));
        }
    }

    /// <summary>
    /// Get weather information by coordinates
    /// </summary>
    [HttpGet("weather")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> GetWeatherByCoordinates(
        [FromQuery] double latitude, 
        [FromQuery] double longitude)
    {
        try
        {
            // Validate coordinates
            if (latitude < -90 || latitude > 90)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Invalid latitude. Must be between -90 and 90", "INVALID_LATITUDE"));
            }

            if (longitude < -180 || longitude > 180)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Invalid longitude. Must be between -180 and 180", "INVALID_LONGITUDE"));
            }

            var weatherData = await _weatherService.GetWeatherByCoordinatesAsync(latitude, longitude);

            var response = new
            {
                weatherData.Temperature,
                weatherData.WindSpeed,
                weatherData.WindDirection,
                weatherData.Humidity,
                weatherData.Precipitation,
                weatherData.Conditions,
                weatherData.Timestamp,
                Location = new { Latitude = latitude, Longitude = longitude }
            };

            _logger.LogInformation("Successfully retrieved weather for coordinates ({Latitude}, {Longitude}): {Conditions}, {Temperature}°C", 
                latitude, longitude, weatherData.Conditions, weatherData.Temperature);

            return Ok(ApiResponse<object>.SuccessResponse(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving weather for coordinates ({Latitude}, {Longitude})", latitude, longitude);
            return StatusCode(500, ApiResponse<object>.ErrorResponse("An error occurred while retrieving weather data"));
        }
    }
}