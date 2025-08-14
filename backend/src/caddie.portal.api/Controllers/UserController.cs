using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AutoMapper;
using System.Security.Claims;
using caddie.portal.api.DTOs.User;
using caddie.portal.api.DTOs.Common;
using caddie.portal.services.Interfaces;

namespace caddie.portal.api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class UserController : ControllerBase
{
    private readonly IAuthenticationService _authService;
    private readonly IMapper _mapper;
    private readonly ILogger<UserController> _logger;

    public UserController(
        IAuthenticationService authService,
        IMapper mapper,
        ILogger<UserController> logger)
    {
        _authService = authService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get current user profile
    /// </summary>
    /// <returns>User profile information</returns>
    [HttpGet("profile")]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfile()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));
            }

            var user = await _authService.GetUserAsync(userId.Value);
            if (user == null)
            {
                return NotFound(ApiResponse.ErrorResponse("User not found", "USER_NOT_FOUND"));
            }

            var userDto = _mapper.Map<UserDto>(user);
            return Ok(ApiResponse<UserDto>.SuccessResponse(userDto, "Profile retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user profile");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while retrieving profile", "INTERNAL_ERROR"));
        }
    }


    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}