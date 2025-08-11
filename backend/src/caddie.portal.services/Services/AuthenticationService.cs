using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using caddie.portal.services.Configuration;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using caddie.portal.dal.Repositories.Interfaces;
using caddie.portal.dal.Models;
using DalModels = caddie.portal.dal.Models;

namespace caddie.portal.services.Services;

public class AuthenticationService : IAuthenticationService
{
    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IPasswordResetTokenRepository _passwordResetTokenRepository;
    private readonly IPasswordService _passwordService;
    private readonly ITokenService _tokenService;
    private readonly IEmailService _emailService;
    private readonly AuthenticationSettings _authSettings;
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<AuthenticationService> _logger;

    public AuthenticationService(
        IUserRepository userRepository,
        IRefreshTokenRepository refreshTokenRepository,
        IPasswordResetTokenRepository passwordResetTokenRepository,
        IPasswordService passwordService,
        ITokenService tokenService,
        IEmailService emailService,
        IOptions<AuthenticationSettings> authSettings,
        IOptions<EmailSettings> emailSettings,
        ILogger<AuthenticationService> logger)
    {
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _passwordResetTokenRepository = passwordResetTokenRepository;
        _passwordService = passwordService;
        _tokenService = tokenService;
        _emailService = emailService;
        _authSettings = authSettings.Value;
        _emailSettings = emailSettings.Value;
        _logger = logger;
    }

    public async Task<AuthenticationResult> RegisterAsync(UserRegistrationModel model)
    {
        try
        {
            // Check if email already exists
            if (await _userRepository.ExistsAsync(model.Email))
            {
                return AuthenticationResult.Failure("Email address is already registered", "EMAIL_EXISTS");
            }

            // Validate password
            if (!_passwordService.IsPasswordValid(model.Password))
            {
                return AuthenticationResult.Failure("Password does not meet requirements", "INVALID_PASSWORD");
            }

            // Create user
            var user = new User
            {
                Email = model.Email.ToLowerInvariant(),
                PasswordHash = _passwordService.HashPassword(model.Password),
                FirstName = model.FirstName.Trim(),
                LastName = model.LastName.Trim(),
                Handicap = model.Handicap,
                SkillLevelId = model.SkillLevelId,
                StatusId = 1, // Active
                EmailVerified = _authSettings.RequireEmailVerification
            };

            // Set preferences and playing style if provided
            if (model.Preferences != null)
            {
                user.Preferences = JsonSerializer.Serialize(model.Preferences);
            }

            if (model.PlayingStyle != null)
            {
                user.PlayingStyle = JsonSerializer.Serialize(model.PlayingStyle);
            }

            // Generate email verification token if required
            if (_authSettings.RequireEmailVerification)
            {
                user.EmailVerificationToken = _tokenService.GenerateEmailVerificationToken();
                user.EmailVerificationExpires = DateTime.UtcNow.AddHours(_emailSettings.EmailVerificationExpirationHours);
            }

            // Save user
            var createdUser = await _userRepository.CreateAsync(user);

            // Send verification email if required
            if (_authSettings.RequireEmailVerification)
            {
                await _emailService.SendEmailVerificationAsync(
                    createdUser.Email,
                    createdUser.FirstName,
                    createdUser.EmailVerificationToken!);
            }
            else
            {
                // Send welcome email for verified users
                await _emailService.SendWelcomeEmailAsync(createdUser.Email, createdUser.FirstName);
            }

            // Generate tokens
            var tokens = await _tokenService.GenerateTokensAsync(createdUser.Id, createdUser.Email);
            var userModel = MapToUserModel(createdUser);

            _logger.LogInformation("User registered successfully: {Email}", model.Email);
            return AuthenticationResult.Success(createdUser.Id, tokens, userModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user registration for {Email}", model.Email);
            return AuthenticationResult.Failure("Registration failed", "REGISTRATION_ERROR");
        }
    }

    public async Task<AuthenticationResult> LoginAsync(UserLoginModel model)
    {
        try
        {
            var user = await _userRepository.GetByEmailAsync(model.Email);
            if (user == null)
            {
                return AuthenticationResult.Failure("Invalid email or password", "INVALID_CREDENTIALS");
            }

            // Check if account is locked
            if (user.LockedUntil.HasValue && user.LockedUntil.Value > DateTime.UtcNow)
            {
                return AuthenticationResult.Failure("Account is temporarily locked", "ACCOUNT_LOCKED");
            }

            // Check if account is active (Status ID 1 = Active)
            if (user.StatusId != 1)
            {
                return AuthenticationResult.Failure("Account is not active", "ACCOUNT_INACTIVE");
            }

            // Verify password
            if (!_passwordService.VerifyPassword(model.Password, user.PasswordHash))
            {
                await _userRepository.IncrementFailedLoginAttemptsAsync(user.Id);
                
                // Check if account should be locked after this failed attempt
                if (user.FailedLoginAttempts + 1 >= _authSettings.MaxFailedLoginAttempts)
                {
                    var lockedUntil = DateTime.UtcNow.AddMinutes(_authSettings.AccountLockoutMinutes);
                    await _emailService.SendAccountLockedEmailAsync(user.Email, user.FirstName, lockedUntil);
                }

                return AuthenticationResult.Failure("Invalid email or password", "INVALID_CREDENTIALS");
            }

            // Check email verification if required
            if (_authSettings.RequireEmailVerification && !user.EmailVerified.GetValueOrDefault())
            {
                return AuthenticationResult.Failure("Email address not verified", "EMAIL_NOT_VERIFIED");
            }

            // Reset failed login attempts on successful login
            await _userRepository.ResetFailedLoginAttemptsAsync(user.Id);

            // Update last login
            await _userRepository.UpdateLastLoginAsync(user.Id);

            // Generate tokens
            var tokens = await _tokenService.GenerateTokensAsync(user.Id, user.Email);
            var userModel = MapToUserModel(user);

            _logger.LogInformation("User logged in successfully: {Email}", model.Email);
            return AuthenticationResult.Success(user.Id, tokens, userModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user login for {Email}", model.Email);
            return AuthenticationResult.Failure("Login failed", "LOGIN_ERROR");
        }
    }

    public async Task<AuthenticationResult> RefreshTokenAsync(string refreshToken)
    {
        try
        {
            var tokenResponse = await _tokenService.RefreshTokenAsync(refreshToken);
            if (tokenResponse == null)
            {
                return AuthenticationResult.Failure("Invalid refresh token", "INVALID_REFRESH_TOKEN");
            }

            // Get user for the response
            var token = await _refreshTokenRepository.GetByTokenAsync(refreshToken);
            if (token?.User == null)
            {
                return AuthenticationResult.Failure("Invalid refresh token", "INVALID_REFRESH_TOKEN");
            }

            var userModel = MapToUserModel(token.User);
            return AuthenticationResult.Success(token.UserId, tokenResponse, userModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return AuthenticationResult.Failure("Token refresh failed", "REFRESH_ERROR");
        }
    }

    public async Task<bool> LogoutAsync(string refreshToken)
    {
        try
        {
            await _tokenService.RevokeRefreshTokenAsync(refreshToken);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return false;
        }
    }

    public async Task<bool> LogoutAllAsync(int userId)
    {
        try
        {
            await _tokenService.RevokeAllRefreshTokensAsync(userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout all for user {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> VerifyEmailAsync(string token)
    {
        try
        {
            var user = await _userRepository.GetByEmailVerificationTokenAsync(token);
            if (user == null || user.EmailVerificationExpires < DateTime.UtcNow)
            {
                return false;
            }

            user.EmailVerified = true;
            user.EmailVerificationToken = null;
            user.EmailVerificationExpires = null;
            
            await _userRepository.UpdateAsync(user);
            await _emailService.SendWelcomeEmailAsync(user.Email, user.FirstName);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during email verification");
            return false;
        }
    }

    public async Task<bool> ForgotPasswordAsync(string email)
    {
        try
        {
            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null)
            {
                // Don't reveal if email exists
                return true;
            }

            // Invalidate existing password reset tokens
            await _passwordResetTokenRepository.InvalidateAllForUserAsync(user.Id);

            // Generate new password reset token
            var resetToken = new PasswordResetToken
            {
                UserId = user.Id,
                Token = _tokenService.GeneratePasswordResetToken(),
                ExpiresAt = DateTime.UtcNow.AddHours(_emailSettings.PasswordResetExpirationHours)
            };

            await _passwordResetTokenRepository.CreateAsync(resetToken);
            await _emailService.SendPasswordResetAsync(user.Email, user.FirstName, resetToken.Token);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during forgot password for {Email}", email);
            return false;
        }
    }

    public async Task<bool> ResetPasswordAsync(string token, string newPassword)
    {
        try
        {
            var resetToken = await _passwordResetTokenRepository.GetValidByTokenAsync(token);
            if (resetToken == null)
            {
                return false;
            }

            if (!_passwordService.IsPasswordValid(newPassword))
            {
                return false;
            }

            // Update password
            var user = resetToken.User;
            user.PasswordHash = _passwordService.HashPassword(newPassword);
            user.FailedLoginAttempts = 0;
            user.LockedUntil = null;

            await _userRepository.UpdateAsync(user);
            await _passwordResetTokenRepository.MarkAsUsedAsync(resetToken.Id);

            // Revoke all refresh tokens for security
            await _tokenService.RevokeAllRefreshTokensAsync(user.Id);

            await _emailService.SendPasswordChangedEmailAsync(user.Email, user.FirstName);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password reset");
            return false;
        }
    }

    public async Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return false;
            }

            if (!_passwordService.VerifyPassword(currentPassword, user.PasswordHash))
            {
                return false;
            }

            if (!_passwordService.IsPasswordValid(newPassword))
            {
                return false;
            }

            user.PasswordHash = _passwordService.HashPassword(newPassword);
            await _userRepository.UpdateAsync(user);

            await _emailService.SendPasswordChangedEmailAsync(user.Email, user.FirstName);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password change for user {UserId}", userId);
            return false;
        }
    }

    public async Task<UserModel?> GetUserAsync(int userId)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(userId);
            return user == null ? null : MapToUserModel(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user {UserId}", userId);
            return null;
        }
    }

    public async Task<bool> IsEmailAvailableAsync(string email)
    {
        return !await _userRepository.ExistsAsync(email);
    }

    public async Task<bool> IsAccountLockedAsync(int userId)
    {
        return await _userRepository.IsAccountLockedAsync(userId);
    }

    public async Task<bool> UnlockAccountAsync(int userId)
    {
        try
        {
            await _userRepository.UnlockUserAccountAsync(userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unlocking account for user {UserId}", userId);
            return false;
        }
    }

    private UserModel MapToUserModel(User user)
    {
        return new UserModel
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = $"{user.FirstName} {user.LastName}",
            Handicap = user.Handicap,
            SkillLevel = user.SkillLevel,
            Preferences = user.Preferences != null ? JsonSerializer.Deserialize<Dictionary<string, object>>(user.Preferences) : null,
            PlayingStyle = user.PlayingStyle != null ? JsonSerializer.Deserialize<Dictionary<string, object>>(user.PlayingStyle) : null,
            Status = user.Status,
            EmailVerified = user.EmailVerified.GetValueOrDefault(),
            LastLoginAt = user.LastLoginAt,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            TwoFactorEnabled = user.TwoFactorEnabled.GetValueOrDefault()
        };
    }
}