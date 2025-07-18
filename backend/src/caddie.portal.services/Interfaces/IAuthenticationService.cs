using caddie.portal.services.Models;

namespace caddie.portal.services.Interfaces;

public interface IAuthenticationService
{
    Task<AuthenticationResult> RegisterAsync(UserRegistrationModel model);
    Task<AuthenticationResult> LoginAsync(UserLoginModel model);
    Task<AuthenticationResult> RefreshTokenAsync(string refreshToken);
    Task<bool> LogoutAsync(string refreshToken);
    Task<bool> LogoutAllAsync(int userId);
    Task<bool> VerifyEmailAsync(string token);
    Task<bool> ForgotPasswordAsync(string email);
    Task<bool> ResetPasswordAsync(string token, string newPassword);
    Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
    Task<UserModel?> GetUserAsync(int userId);
    Task<bool> IsEmailAvailableAsync(string email);
    Task<bool> IsAccountLockedAsync(int userId);
    Task<bool> UnlockAccountAsync(int userId);
}