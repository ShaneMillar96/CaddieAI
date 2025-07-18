namespace caddie.portal.services.Models;

public class AuthenticationResult
{
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
    public int? UserId { get; set; }
    public TokenResponse? TokenResponse { get; set; }
    public UserModel? User { get; set; }
    
    public static AuthenticationResult Success(int userId, TokenResponse tokenResponse, UserModel user)
    {
        return new AuthenticationResult
        {
            IsSuccess = true,
            UserId = userId,
            TokenResponse = tokenResponse,
            User = user
        };
    }
    
    public static AuthenticationResult Failure(string errorMessage, string? errorCode = null)
    {
        return new AuthenticationResult
        {
            IsSuccess = false,
            ErrorMessage = errorMessage,
            ErrorCode = errorCode
        };
    }
}