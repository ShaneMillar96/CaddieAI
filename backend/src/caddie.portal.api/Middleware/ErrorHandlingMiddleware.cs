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
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var correlationId = context.TraceIdentifier;
        var userId = GetCurrentUserId(context);
        var endpoint = $"{context.Request.Method} {context.Request.Path}";

        // Log the exception with structured data
        _logger.LogError(exception,
            "Unhandled exception occurred. CorrelationId: {CorrelationId}, UserId: {UserId}, Endpoint: {Endpoint}",
            correlationId, userId, endpoint);

        context.Response.ContentType = "application/json";

        var response = exception switch
        {
            ValidationException validationEx => new ApiResponse
            {
                Success = false,
                Message = "Validation failed",
                ErrorCode = "VALIDATION_ERROR",
                Errors = validationEx.Errors.Select(e => e.ErrorMessage).ToList(),
                CorrelationId = correlationId
            },
            UnauthorizedAccessException => new ApiResponse
            {
                Success = false,
                Message = "Unauthorized access",
                ErrorCode = "UNAUTHORIZED",
                CorrelationId = correlationId
            },
            ArgumentException argumentEx => new ApiResponse
            {
                Success = false,
                Message = argumentEx.Message,
                ErrorCode = "INVALID_ARGUMENT",
                CorrelationId = correlationId
            },
            InvalidOperationException invalidOpEx => new ApiResponse
            {
                Success = false,
                Message = invalidOpEx.Message,
                ErrorCode = "INVALID_OPERATION",
                CorrelationId = correlationId
            },
            _ => new ApiResponse
            {
                Success = false,
                Message = "An internal server error occurred",
                ErrorCode = "INTERNAL_ERROR",
                CorrelationId = correlationId
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

    private static string GetCurrentUserId(HttpContext context)
    {
        return context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "Anonymous";
    }
}