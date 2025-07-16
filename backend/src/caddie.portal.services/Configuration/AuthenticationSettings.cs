namespace caddie.portal.services.Configuration;

public class AuthenticationSettings
{
    public const string SectionName = "AuthenticationSettings";
    
    public int MaxFailedLoginAttempts { get; set; } = 5;
    public int AccountLockoutMinutes { get; set; } = 15;
    public int SessionTimeoutMinutes { get; set; } = 1440; // 24 hours
    public int MaxActiveRefreshTokens { get; set; } = 5;
    public int MaxActiveSessions { get; set; } = 10;
    public bool RequireEmailVerification { get; set; } = true;
    public int PasswordMinLength { get; set; } = 8;
    public bool RequireUppercase { get; set; } = true;
    public bool RequireLowercase { get; set; } = true;
    public bool RequireDigit { get; set; } = true;
    public bool RequireSpecialChar { get; set; } = true;
}