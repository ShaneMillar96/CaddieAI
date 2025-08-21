using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AutoMapper;
using System.Security.Claims;
using caddie.portal.api.DTOs.GarminDevice;
using caddie.portal.api.DTOs.Common;
using caddie.portal.api.Mapping;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;

namespace caddie.portal.api.Controllers;

/// <summary>
/// API Controller for Garmin device management operations
/// </summary>
[ApiController]
[Route("api/garmin-devices")]
[Authorize]
[Produces("application/json")]
public class GarminDeviceController : ControllerBase
{
    private readonly IGarminDeviceService _garminDeviceService;
    private readonly IMapper _mapper;
    private readonly ILogger<GarminDeviceController> _logger;

    public GarminDeviceController(
        IGarminDeviceService garminDeviceService,
        IMapper mapper,
        ILogger<GarminDeviceController> logger)
    {
        _garminDeviceService = garminDeviceService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get all Garmin devices for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Collection of user's Garmin devices</returns>
    [HttpGet("user/{userId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<GarminDeviceResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUserGarminDevices(int userId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            // Verify user can only access their own devices
            if (currentUserId.Value != userId)
                return Forbid();

            var devices = await _garminDeviceService.GetByUserIdAsync(userId);
            var responseDto = _mapper.Map<IEnumerable<GarminDeviceResponseDto>>(devices);

            return Ok(ApiResponse.SuccessResponse(responseDto, "Garmin devices retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Garmin devices for user {UserId}", userId);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve Garmin devices", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Register a new Garmin device
    /// </summary>
    /// <param name="request">Device registration request</param>
    /// <returns>Device pairing result</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<DevicePairingResultResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RegisterGarminDevice([FromBody] RegisterGarminDeviceRequestDto request)
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

            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var model = _mapper.Map<RegisterGarminDeviceModel>(request);
            model.UserId = currentUserId.Value;

            var result = await _garminDeviceService.RegisterDeviceAsync(model);
            var responseDto = _mapper.Map<DevicePairingResultResponseDto>(result);

            if (result.Success)
            {
                return CreatedAtAction(nameof(GetGarminDeviceById), new { id = result.Device!.Id }, 
                    ApiResponse.SuccessResponse(responseDto, "Garmin device registered successfully"));
            }
            else
            {
                return result.ErrorCode switch
                {
                    "DEVICE_ALREADY_REGISTERED" => Conflict(ApiResponse.ErrorResponse(result.ErrorMessage!, result.ErrorCode)),
                    "USER_NOT_FOUND" => BadRequest(ApiResponse.ErrorResponse(result.ErrorMessage!, result.ErrorCode)),
                    _ => BadRequest(ApiResponse.ErrorResponse(result.ErrorMessage!, result.ErrorCode))
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering Garmin device for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to register Garmin device", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get Garmin device by ID
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <returns>Garmin device details</returns>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<GarminDeviceResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetGarminDeviceById(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            // Verify user has access to this device
            if (!await _garminDeviceService.HasUserAccessAsync(id, currentUserId.Value))
                return Forbid();

            var device = await _garminDeviceService.GetByIdAsync(id);
            if (device == null)
                return NotFound(ApiResponse.ErrorResponse("Garmin device not found", "DEVICE_NOT_FOUND"));

            var responseDto = _mapper.Map<GarminDeviceResponseDto>(device);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Garmin device retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Garmin device {DeviceId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve Garmin device", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Update Garmin device information
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <param name="request">Device update request</param>
    /// <returns>Updated device</returns>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<GarminDeviceResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateGarminDevice(int id, [FromBody] UpdateGarminDeviceRequestDto request)
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

            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var model = _mapper.Map<UpdateGarminDeviceModel>(request);
            var updatedDevice = await _garminDeviceService.UpdateDeviceAsync(id, model, currentUserId.Value);
            
            if (updatedDevice == null)
                return NotFound(ApiResponse.ErrorResponse("Garmin device not found", "DEVICE_NOT_FOUND"));

            var responseDto = _mapper.Map<GarminDeviceResponseDto>(updatedDevice);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Garmin device updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating Garmin device {DeviceId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to update Garmin device", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Update device connection status
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <param name="request">Connection status update request</param>
    /// <returns>Updated device</returns>
    [HttpPut("{id:int}/status")]
    [ProducesResponseType(typeof(ApiResponse<GarminDeviceResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateConnectionStatus(int id, [FromBody] UpdateConnectionStatusRequestDto request)
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

            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var model = _mapper.Map<UpdateConnectionStatusModel>(request);
            var updatedDevice = await _garminDeviceService.UpdateConnectionStatusAsync(id, model, currentUserId.Value);
            
            if (updatedDevice == null)
                return NotFound(ApiResponse.ErrorResponse("Garmin device not found", "DEVICE_NOT_FOUND"));

            var responseDto = _mapper.Map<GarminDeviceResponseDto>(updatedDevice);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Connection status updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating connection status for Garmin device {DeviceId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to update connection status", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Delete a Garmin device
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <returns>Success message</returns>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteGarminDevice(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var deleted = await _garminDeviceService.DeleteDeviceAsync(id, currentUserId.Value);
            if (!deleted)
                return NotFound(ApiResponse.ErrorResponse("Garmin device not found", "DEVICE_NOT_FOUND"));

            return Ok(ApiResponse.SuccessResponse("Garmin device deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting Garmin device {DeviceId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to delete Garmin device", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Set a device as the preferred device for the current user
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <returns>Success message</returns>
    [HttpPost("{id:int}/set-preferred")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> SetPreferredDevice(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var success = await _garminDeviceService.SetPreferredDeviceAsync(id, currentUserId.Value);
            if (!success)
                return NotFound(ApiResponse.ErrorResponse("Garmin device not found", "DEVICE_NOT_FOUND"));

            return Ok(ApiResponse.SuccessResponse("Preferred device set successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting preferred Garmin device {DeviceId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to set preferred device", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get device connection summary for the current user
    /// </summary>
    /// <returns>Device connection summary</returns>
    [HttpGet("connection-summary")]
    [ProducesResponseType(typeof(ApiResponse<DeviceConnectionSummaryResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetConnectionSummary()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var summary = await _garminDeviceService.GetConnectionSummaryAsync(currentUserId.Value);
            var responseDto = _mapper.Map<DeviceConnectionSummaryResponseDto>(summary);

            return Ok(ApiResponse.SuccessResponse(responseDto, "Connection summary retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving connection summary for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve connection summary", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get connected Garmin devices for the current user
    /// </summary>
    /// <returns>Collection of connected Garmin devices</returns>
    [HttpGet("connected")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<GarminDeviceResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetConnectedDevices()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var devices = await _garminDeviceService.GetConnectedDevicesAsync(currentUserId.Value);
            var responseDto = _mapper.Map<IEnumerable<GarminDeviceResponseDto>>(devices);

            return Ok(ApiResponse.SuccessResponse(responseDto, "Connected devices retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving connected devices for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve connected devices", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get the current user's preferred Garmin device
    /// </summary>
    /// <returns>Preferred Garmin device or null if none set</returns>
    [HttpGet("preferred")]
    [ProducesResponseType(typeof(ApiResponse<GarminDeviceResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetPreferredDevice()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var device = await _garminDeviceService.GetPreferredDeviceAsync(currentUserId.Value);
            if (device == null)
                return NotFound(ApiResponse.ErrorResponse("No preferred device set", "NO_PREFERRED_DEVICE"));

            var responseDto = _mapper.Map<GarminDeviceResponseDto>(device);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Preferred device retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving preferred device for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve preferred device", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get device health status
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <returns>Device health status</returns>
    [HttpGet("{id:int}/health")]
    [ProducesResponseType(typeof(ApiResponse<DeviceHealthStatusResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetDeviceHealth(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var health = await _garminDeviceService.GetDeviceHealthAsync(id, currentUserId.Value);
            if (health == null)
                return NotFound(ApiResponse.ErrorResponse("Garmin device not found", "DEVICE_NOT_FOUND"));

            var responseDto = _mapper.Map<DeviceHealthStatusResponseDto>(health);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Device health status retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving device health for device {DeviceId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve device health", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Test device connectivity
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <returns>Connectivity test result</returns>
    [HttpPost("{id:int}/test-connectivity")]
    [ProducesResponseType(typeof(ApiResponse<ConnectivityTestResultResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> TestConnectivity(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var (isConnected, statusMessage) = await _garminDeviceService.TestConnectivityAsync(id, currentUserId.Value);
            
            var responseDto = new ConnectivityTestResultResponseDto
            {
                IsConnected = isConnected,
                StatusMessage = statusMessage
            };

            return Ok(ApiResponse.SuccessResponse(responseDto, "Connectivity test completed"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing connectivity for device {DeviceId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to test connectivity", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Sync device data and update connection status
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <returns>Updated device with sync results</returns>
    [HttpPost("{id:int}/sync")]
    [ProducesResponseType(typeof(ApiResponse<GarminDeviceResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> SyncDeviceData(int id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var syncedDevice = await _garminDeviceService.SyncDeviceDataAsync(id, currentUserId.Value);
            if (syncedDevice == null)
                return NotFound(ApiResponse.ErrorResponse("Garmin device not found", "DEVICE_NOT_FOUND"));

            var responseDto = _mapper.Map<GarminDeviceResponseDto>(syncedDevice);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Device data synced successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing device data for device {DeviceId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to sync device data", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get current user ID from JWT claims
    /// </summary>
    /// <returns>User ID or null if not authenticated</returns>
    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}