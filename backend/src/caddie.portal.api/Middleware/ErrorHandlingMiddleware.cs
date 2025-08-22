using System.Net;
using System.Text.Json;
using FluentValidation;
using caddie.portal.api.DTOs.Common;

namespace caddie.portal.api.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            // Enhanced logging for swing analysis debugging
            _logger.LogError(ex, "🚫 ErrorHandlingMiddleware: Unhandled exception on {Method} {Path}: {Message}", 
                context.Request.Method, context.Request.Path, ex.Message);
            
            if (context.Request.Path.StartsWithSegments("/api/swing-analysis"))
            {
                _logger.LogError("🏌️ ErrorHandlingMiddleware: Swing analysis request failed - Path: {Path}, Method: {Method}, Exception: {ExceptionType}", 
                    context.Request.Path, context.Request.Method, ex.GetType().Name);
            }
            
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        // Enhanced logging for validation errors
        if (exception is ValidationException validationEx)
        {
            var logger = context.RequestServices.GetRequiredService<ILogger<ErrorHandlingMiddleware>>();
            logger.LogWarning("🚫 ErrorHandlingMiddleware: FluentValidation failed for {Path} with {ErrorCount} errors: {Errors}", 
                context.Request.Path, 
                validationEx.Errors.Count(),
                string.Join(", ", validationEx.Errors.Select(e => $"{e.PropertyName}: {e.ErrorMessage}")));
        }

        var response = exception switch
        {
            ValidationException valEx => new ApiResponse
            {
                Success = false,
                Message = "Validation failed",
                ErrorCode = "VALIDATION_ERROR",
                Errors = valEx.Errors.Select(e => e.ErrorMessage).ToList()
            },
            UnauthorizedAccessException => new ApiResponse
            {
                Success = false,
                Message = "Unauthorized access",
                ErrorCode = "UNAUTHORIZED"
            },
            ArgumentException argumentEx => new ApiResponse
            {
                Success = false,
                Message = argumentEx.Message,
                ErrorCode = "INVALID_ARGUMENT"
            },
            InvalidOperationException invalidOpEx => new ApiResponse
            {
                Success = false,
                Message = invalidOpEx.Message,
                ErrorCode = "INVALID_OPERATION"
            },
            _ => new ApiResponse
            {
                Success = false,
                Message = "An internal server error occurred",
                ErrorCode = "INTERNAL_ERROR"
            }
        };

        context.Response.StatusCode = exception switch
        {
            ValidationException => (int)HttpStatusCode.BadRequest,
            UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
            ArgumentException => (int)HttpStatusCode.BadRequest,
            InvalidOperationException => (int)HttpStatusCode.BadRequest,
            _ => (int)HttpStatusCode.InternalServerError
        };

        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(jsonResponse);
    }
}