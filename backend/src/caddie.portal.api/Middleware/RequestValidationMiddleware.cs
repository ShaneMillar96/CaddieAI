using System.Text;
using System.Text.Json;
using caddie.portal.api.DTOs.Common;

namespace caddie.portal.api.Middleware;

/// <summary>
/// Middleware for request validation and logging
/// </summary>
public class RequestValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestValidationMiddleware> _logger;

    public RequestValidationMiddleware(RequestDelegate next, ILogger<RequestValidationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.TraceIdentifier;
        var userId = GetCurrentUserId(context);
        var endpoint = $"{context.Request.Method} {context.Request.Path}";
        var userAgent = context.Request.Headers.UserAgent.FirstOrDefault() ?? "Unknown";

        // Log request details
        _logger.LogInformation(
            "Request started: {Endpoint}, UserId: {UserId}, CorrelationId: {CorrelationId}, UserAgent: {UserAgent}",
            endpoint, userId, correlationId, userAgent);

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            // Validate request size (prevent large requests)
            if (context.Request.ContentLength > 10 * 1024 * 1024) // 10MB limit
            {
                _logger.LogWarning("Request size exceeded limit: {ContentLength} bytes, CorrelationId: {CorrelationId}", 
                    context.Request.ContentLength, correlationId);
                
                context.Response.StatusCode = 413; // Payload Too Large
                context.Response.ContentType = "application/json";
                
                var errorResponse = ApiResponse.ErrorResponse(
                    "Request size too large", 
                    "PAYLOAD_TOO_LARGE",
                    null,
                    correlationId);
                
                await context.Response.WriteAsync(JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                }));
                return;
            }

            // Validate content type for POST/PUT requests
            if ((context.Request.Method == "POST" || context.Request.Method == "PUT") 
                && context.Request.ContentLength > 0
                && !string.IsNullOrEmpty(context.Request.ContentType)
                && !context.Request.ContentType.StartsWith("application/json")
                && !context.Request.ContentType.StartsWith("multipart/form-data"))
            {
                _logger.LogWarning("Invalid content type: {ContentType}, CorrelationId: {CorrelationId}", 
                    context.Request.ContentType, correlationId);
                
                context.Response.StatusCode = 415; // Unsupported Media Type
                context.Response.ContentType = "application/json";
                
                var errorResponse = ApiResponse.ErrorResponse(
                    "Unsupported media type", 
                    "UNSUPPORTED_MEDIA_TYPE",
                    null,
                    correlationId);
                
                await context.Response.WriteAsync(JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                }));
                return;
            }

            await _next(context);

            stopwatch.Stop();
            _logger.LogInformation(
                "Request completed: {Endpoint}, UserId: {UserId}, StatusCode: {StatusCode}, Duration: {Duration}ms, CorrelationId: {CorrelationId}",
                endpoint, userId, context.Response.StatusCode, stopwatch.ElapsedMilliseconds, correlationId);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex,
                "Request failed: {Endpoint}, UserId: {UserId}, Duration: {Duration}ms, CorrelationId: {CorrelationId}",
                endpoint, userId, stopwatch.ElapsedMilliseconds, correlationId);
            throw; // Re-throw to be handled by error handling middleware
        }
    }

    private static string GetCurrentUserId(HttpContext context)
    {
        return context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "Anonymous";
    }
}