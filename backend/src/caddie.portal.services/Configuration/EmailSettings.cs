namespace caddie.portal.services.Configuration;

public class EmailSettings
{
    public const string SectionName = "EmailSettings";
    
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string SmtpUsername { get; set; } = string.Empty;
    public string SmtpPassword { get; set; } = string.Empty;
    public bool EnableSsl { get; set; } = true;
    public string FromName { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public bool EnableEmailVerification { get; set; } = true;
    public int EmailVerificationExpirationHours { get; set; } = 24;
    public int PasswordResetExpirationHours { get; set; } = 1;
}