using System.Security.Claims;
using caddie.portal.services.Models;

namespace caddie.portal.services.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(int userId, string email, IEnumerable<string>? roles = null);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    Task<TokenResponse> GenerateTokensAsync(int userId, string email, IEnumerable<string>? roles = null);
    Task<bool> ValidateRefreshTokenAsync(string refreshToken);
    Task RevokeRefreshTokenAsync(string refreshToken);
    Task RevokeAllRefreshTokensAsync(int userId);
    Task<TokenResponse?> RefreshTokenAsync(string refreshToken);
    string GenerateEmailVerificationToken();
    string GeneratePasswordResetToken();
}