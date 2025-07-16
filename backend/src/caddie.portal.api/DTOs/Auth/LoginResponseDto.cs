using caddie.portal.api.DTOs.User;

namespace caddie.portal.api.DTOs.Auth;

public class LoginResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public string TokenType { get; set; } = "Bearer";
    public int ExpiresIn { get; set; }
    public UserDto User { get; set; } = null!;
}