namespace caddie.portal.services.Configuration;

public class JwtSettings
{
    public const string SectionName = "JwtSettings";
    
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int AccessTokenExpirationMinutes { get; set; } = 15;
    public int RefreshTokenExpirationDays { get; set; } = 7;
    public string Algorithm { get; set; } = "HS256";
}