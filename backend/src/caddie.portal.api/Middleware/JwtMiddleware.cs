using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using caddie.portal.services.Configuration;
using caddie.portal.services.Interfaces;

namespace caddie.portal.api.Middleware;

public class JwtMiddleware
{
    private readonly RequestDelegate _next;
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<JwtMiddleware> _logger;

    public JwtMiddleware(
        RequestDelegate next,
        IOptions<JwtSettings> jwtSettings,
        ILogger<JwtMiddleware> logger)
    {
        _next = next;
        _jwtSettings = jwtSettings.Value;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IAuthenticationService authService)
    {
        var token = ExtractTokenFromHeader(context);

        if (!string.IsNullOrEmpty(token))
        {
            await AttachUserToContext(context, token, authService);
        }

        await _next(context);
    }

    private string? ExtractTokenFromHeader(HttpContext context)
    {
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        
        if (authHeader != null && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return authHeader.Substring("Bearer ".Length).Trim();
        }

        return null;
    }

    private async Task AttachUserToContext(HttpContext context, string token, IAuthenticationService authService)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtSettings.Secret);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _jwtSettings.Issuer,
                ValidAudience = _jwtSettings.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

            if (validatedToken is JwtSecurityToken jwtToken &&
                jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                if (Guid.TryParse(userIdClaim, out var userId))
                {
                    // Optionally verify user still exists and is active
                    var user = await authService.GetUserAsync(userId);
                    if (user != null && user.Status == caddie.portal.dal.Models.Users.UserStatus.Active)
                    {
                        context.User = principal;
                        context.Items["UserId"] = userId;
                        context.Items["User"] = user;
                    }
                }
            }
        }
        catch (SecurityTokenExpiredException)
        {
            _logger.LogDebug("JWT token expired");
        }
        catch (SecurityTokenValidationException ex)
        {
            _logger.LogDebug(ex, "JWT token validation failed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing JWT token");
        }
    }
}