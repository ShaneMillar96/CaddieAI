using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AutoMapper;
using System.Security.Claims;
using caddie.portal.api.DTOs.Auth;
using caddie.portal.api.DTOs.Common;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;

namespace caddie.portal.api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthenticationService _authService;
    private readonly IMapper _mapper;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthenticationService authService,
        IMapper mapper,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user account
    /// </summary>
    /// <param name="request">Registration details</param>
    /// <returns>Authentication result with tokens</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
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

            var model = _mapper.Map<UserRegistrationModel>(request);

            var result = await _authService.RegisterAsync(model);

            if (!result.IsSuccess)
            {
                var statusCode = result.ErrorCode switch
                {
                    "EMAIL_EXISTS" => StatusCodes.Status409Conflict,
                    "INVALID_PASSWORD" => StatusCodes.Status400BadRequest,
                    _ => StatusCodes.Status400BadRequest
                };

                return StatusCode(statusCode, ApiResponse.ErrorResponse(result.ErrorMessage!, result.ErrorCode));
            }

            var response = _mapper.Map<LoginResponseDto>(result);
            return Ok(ApiResponse<LoginResponseDto>.SuccessResponse(response, "Registration successful"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user registration");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred during registration", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Authenticate user and return tokens
    /// </summary>
    /// <param name="request">Login credentials</param>
    /// <returns>Authentication result with tokens</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status423Locked)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
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

            var model = _mapper.Map<UserLoginModel>(request);
            model.IpAddress = GetClientIpAddress();
            model.UserAgent = Request.Headers.UserAgent.ToString();

            var result = await _authService.LoginAsync(model);

            if (!result.IsSuccess)
            {
                var statusCode = result.ErrorCode switch
                {
                    "ACCOUNT_LOCKED" => StatusCodes.Status423Locked,
                    "ACCOUNT_INACTIVE" => StatusCodes.Status401Unauthorized,
                    "EMAIL_NOT_VERIFIED" => StatusCodes.Status401Unauthorized,
                    "INVALID_CREDENTIALS" => StatusCodes.Status401Unauthorized,
                    _ => StatusCodes.Status400BadRequest
                };

                return StatusCode(statusCode, ApiResponse.ErrorResponse(result.ErrorMessage!, result.ErrorCode));
            }

            var response = _mapper.Map<LoginResponseDto>(result);
            return Ok(ApiResponse<LoginResponseDto>.SuccessResponse(response, "Login successful"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user login");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred during login", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    /// <param name="request">Refresh token</param>
    /// <returns>New access token</returns>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto request)
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

            var result = await _authService.RefreshTokenAsync(request.RefreshToken);

            if (!result.IsSuccess)
            {
                return Unauthorized(ApiResponse.ErrorResponse(result.ErrorMessage!, result.ErrorCode));
            }

            var response = _mapper.Map<LoginResponseDto>(result);
            return Ok(ApiResponse<LoginResponseDto>.SuccessResponse(response, "Token refreshed successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred during token refresh", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Logout user and revoke refresh token
    /// </summary>
    /// <param name="request">Refresh token to revoke</param>
    /// <returns>Success message</returns>
    [HttpPost("logout")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto request)
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

            var result = await _authService.LogoutAsync(request.RefreshToken);

            if (!result)
            {
                return BadRequest(ApiResponse.ErrorResponse("Logout failed", "LOGOUT_ERROR"));
            }

            return Ok(ApiResponse.SuccessResponse("Logged out successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred during logout", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Logout user from all devices
    /// </summary>
    /// <returns>Success message</returns>
    [HttpPost("logout-all")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LogoutAll()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));
            }

            var result = await _authService.LogoutAllAsync(userId.Value);

            if (!result)
            {
                return BadRequest(ApiResponse.ErrorResponse("Logout all failed", "LOGOUT_ALL_ERROR"));
            }

            return Ok(ApiResponse.SuccessResponse("Logged out from all devices successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout all");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred during logout all", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Verify email address
    /// </summary>
    /// <param name="request">Email verification token</param>
    /// <returns>Success message</returns>
    [HttpPost("verify-email")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequestDto request)
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

            var result = await _authService.VerifyEmailAsync(request.Token);

            if (!result)
            {
                return BadRequest(ApiResponse.ErrorResponse("Invalid or expired verification token", "INVALID_TOKEN"));
            }

            return Ok(ApiResponse.SuccessResponse("Email verified successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during email verification");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred during email verification", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Send password reset email
    /// </summary>
    /// <param name="request">Email address</param>
    /// <returns>Success message</returns>
    [HttpPost("forgot-password")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
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

            // Always return success for security reasons (don't reveal if email exists)
            await _authService.ForgotPasswordAsync(request.Email);

            return Ok(ApiResponse.SuccessResponse("If the email exists, a password reset link has been sent"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during forgot password");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred during password reset request", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Reset password using reset token
    /// </summary>
    /// <param name="request">Reset token and new password</param>
    /// <returns>Success message</returns>
    [HttpPost("reset-password")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
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

            var result = await _authService.ResetPasswordAsync(request.Token, request.NewPassword);

            if (!result)
            {
                return BadRequest(ApiResponse.ErrorResponse("Invalid or expired reset token", "INVALID_TOKEN"));
            }

            return Ok(ApiResponse.SuccessResponse("Password reset successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password reset");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred during password reset", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Change password for authenticated user
    /// </summary>
    /// <param name="request">Current and new password</param>
    /// <returns>Success message</returns>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
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

            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));
            }

            var result = await _authService.ChangePasswordAsync(userId.Value, request.CurrentPassword, request.NewPassword);

            if (!result)
            {
                return BadRequest(ApiResponse.ErrorResponse("Current password is incorrect or new password is invalid", "INVALID_PASSWORD"));
            }

            return Ok(ApiResponse.SuccessResponse("Password changed successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password change");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred during password change", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Check if email is available for registration
    /// </summary>
    /// <param name="email">Email address to check</param>
    /// <returns>Availability status</returns>
    [HttpGet("check-email")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CheckEmailAvailability([FromQuery] string email)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest(ApiResponse.ErrorResponse("Email is required", "VALIDATION_ERROR"));
            }

            var isAvailable = await _authService.IsEmailAvailableAsync(email);

            return Ok(ApiResponse<bool>.SuccessResponse(isAvailable, 
                isAvailable ? "Email is available" : "Email is already taken"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking email availability");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                ApiResponse.ErrorResponse("An error occurred while checking email availability", "INTERNAL_ERROR"));
        }
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private string GetClientIpAddress()
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        if (string.IsNullOrEmpty(ipAddress) || ipAddress == "::1")
        {
            ipAddress = "127.0.0.1";
        }
        return ipAddress;
    }
}