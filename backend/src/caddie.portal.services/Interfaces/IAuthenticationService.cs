using caddie.portal.services.Models;

namespace caddie.portal.services.Interfaces;

public interface IAuthenticationService
{
    Task<AuthenticationResult> RegisterAsync(UserRegistrationModel model);
    Task<AuthenticationResult> LoginAsync(UserLoginModel model);
    Task<AuthenticationResult> RefreshTokenAsync(string refreshToken);
    Task<bool> LogoutAsync(string refreshToken);
    Task<bool> LogoutAllAsync(Guid userId);
    Task<bool> VerifyEmailAsync(string token);
    Task<bool> ForgotPasswordAsync(string email);
    Task<bool> ResetPasswordAsync(string token, string newPassword);
    Task<bool> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword);
    Task<UserModel?> GetUserAsync(Guid userId);
    Task<bool> IsEmailAvailableAsync(string email);
    Task<bool> IsAccountLockedAsync(Guid userId);
    Task<bool> UnlockAccountAsync(Guid userId);
}