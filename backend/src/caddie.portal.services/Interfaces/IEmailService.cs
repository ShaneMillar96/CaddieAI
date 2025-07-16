namespace caddie.portal.services.Interfaces;

public interface IEmailService
{
    Task SendEmailVerificationAsync(string email, string firstName, string verificationToken);
    Task SendPasswordResetAsync(string email, string firstName, string resetToken);
    Task SendWelcomeEmailAsync(string email, string firstName);
    Task SendAccountLockedEmailAsync(string email, string firstName, DateTime lockedUntil);
    Task SendPasswordChangedEmailAsync(string email, string firstName);
    Task<bool> SendEmailAsync(string to, string subject, string body, bool isHtml = true);
}