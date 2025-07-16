using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using MailKit.Net.Smtp;
using MimeKit;
using caddie.portal.services.Configuration;
using caddie.portal.services.Interfaces;

namespace caddie.portal.services.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
    {
        _emailSettings = emailSettings.Value;
        _logger = logger;
    }

    public async Task SendEmailVerificationAsync(string email, string firstName, string verificationToken)
    {
        var subject = "Verify Your CaddieAI Account";
        var body = $@"
            <html>
                <body>
                    <h2>Welcome to CaddieAI, {firstName}!</h2>
                    <p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
                    <p><a href=""https://app.caddieai.com/verify-email?token={verificationToken}"">Verify Email Address</a></p>
                    <p>If you didn't create an account with us, please ignore this email.</p>
                    <p>This verification link will expire in {_emailSettings.EmailVerificationExpirationHours} hours.</p>
                    <br>
                    <p>Best regards,<br>The CaddieAI Team</p>
                </body>
            </html>";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendPasswordResetAsync(string email, string firstName, string resetToken)
    {
        var subject = "Reset Your CaddieAI Password";
        var body = $@"
            <html>
                <body>
                    <h2>Password Reset Request</h2>
                    <p>Hello {firstName},</p>
                    <p>You requested to reset your password. Click the link below to create a new password:</p>
                    <p><a href=""https://app.caddieai.com/reset-password?token={resetToken}"">Reset Password</a></p>
                    <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
                    <p>This reset link will expire in {_emailSettings.PasswordResetExpirationHours} hour(s).</p>
                    <br>
                    <p>Best regards,<br>The CaddieAI Team</p>
                </body>
            </html>";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendWelcomeEmailAsync(string email, string firstName)
    {
        var subject = "Welcome to CaddieAI!";
        var body = $@"
            <html>
                <body>
                    <h2>Welcome to CaddieAI, {firstName}!</h2>
                    <p>Your account has been successfully verified. You're all set to start improving your golf game with AI-powered insights!</p>
                    <p>Here's what you can do with CaddieAI:</p>
                    <ul>
                        <li>Get personalized club recommendations</li>
                        <li>Track your rounds and performance</li>
                        <li>Receive AI-powered coaching tips</li>
                        <li>Analyze your playing patterns</li>
                    </ul>
                    <p><a href=""https://app.caddieai.com/dashboard"">Get Started</a></p>
                    <br>
                    <p>Happy golfing!<br>The CaddieAI Team</p>
                </body>
            </html>";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendAccountLockedEmailAsync(string email, string firstName, DateTime lockedUntil)
    {
        var subject = "CaddieAI Account Temporarily Locked";
        var body = $@"
            <html>
                <body>
                    <h2>Account Security Notice</h2>
                    <p>Hello {firstName},</p>
                    <p>Your CaddieAI account has been temporarily locked due to multiple failed login attempts.</p>
                    <p>Your account will be automatically unlocked at: {lockedUntil:yyyy-MM-dd HH:mm:ss} UTC</p>
                    <p>If you didn't attempt to log in, please consider changing your password once your account is unlocked.</p>
                    <p>If you need immediate assistance, please contact our support team.</p>
                    <br>
                    <p>Best regards,<br>The CaddieAI Team</p>
                </body>
            </html>";

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendPasswordChangedEmailAsync(string email, string firstName)
    {
        var subject = "CaddieAI Password Changed";
        var body = $@"
            <html>
                <body>
                    <h2>Password Changed Successfully</h2>
                    <p>Hello {firstName},</p>
                    <p>Your CaddieAI password has been successfully changed.</p>
                    <p>If you didn't make this change, please contact our support team immediately.</p>
                    <p>Changed on: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</p>
                    <br>
                    <p>Best regards,<br>The CaddieAI Team</p>
                </body>
            </html>";

        await SendEmailAsync(email, subject, body);
    }

    public async Task<bool> SendEmailAsync(string to, string subject, string body, bool isHtml = true)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_emailSettings.FromName, _emailSettings.FromEmail));
            message.To.Add(new MailboxAddress("", to));
            message.Subject = subject;

            var builder = new BodyBuilder();
            if (isHtml)
            {
                builder.HtmlBody = body;
            }
            else
            {
                builder.TextBody = body;
            }

            message.Body = builder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(_emailSettings.SmtpHost, _emailSettings.SmtpPort, _emailSettings.EnableSsl);
            await client.AuthenticateAsync(_emailSettings.SmtpUsername, _emailSettings.SmtpPassword);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent successfully to {Email}", to);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", to);
            return false;
        }
    }
}