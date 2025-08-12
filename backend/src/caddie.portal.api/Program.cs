using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Security.Claims;
using System.Text;
using caddie.portal.api.Extensions;
using caddie.portal.api.Middleware;
using caddie.portal.dal.Context;
using caddie.portal.services.Configuration;

var builder = WebApplication.CreateBuilder(args);

// Configure additional configuration sources for environment variables and local config
builder.Configuration
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true)
    .AddJsonFile("appsettings.Local.json", optional: true) // Local development overrides
    .AddEnvironmentVariables("CADDIEAI_") // Prefix for environment variables
    .AddEnvironmentVariables(); // Standard environment variables

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();

// Configure database and Entity Framework
builder.Services.AddDatabase(builder.Configuration);

// Configure application settings
builder.Services.AddConfigurationSettings(builder.Configuration);

// Add Authentication and Authorization
var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>();
if (jwtSettings == null)
{
    throw new InvalidOperationException("JWT settings are not configured");
}

// Override JWT secret from environment variables
var jwtSecret = Environment.GetEnvironmentVariable("CADDIEAI_JWT_SECRET") 
               ?? Environment.GetEnvironmentVariable("JwtSettings__Secret") 
               ?? jwtSettings.Secret;

if (string.IsNullOrEmpty(jwtSecret))
{
    throw new InvalidOperationException("JWT secret is not configured. Set CADDIEAI_JWT_SECRET environment variable or configure in appsettings.json");
}

jwtSettings.Secret = jwtSecret;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
        ClockSkew = TimeSpan.Zero,
        NameClaimType = ClaimTypes.NameIdentifier
    };
    
    // Support JWT authentication for WebSocket connections from query string
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            // Check for token in query string for WebSocket connections
            var accessToken = context.Request.Query["token"];
            
            // If the request is for a WebSocket endpoint and has a token in the query string
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && 
                (path.StartsWithSegments("/api/realtimeaudio", StringComparison.OrdinalIgnoreCase) || 
                 path.StartsWithSegments("/api/RealtimeAudio") || 
                 context.HttpContext.WebSockets.IsWebSocketRequest))
            {
                // Read the token from the query string
                context.Token = accessToken;
            }
            
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// Register repositories and services
builder.Services.AddRepositories();
builder.Services.AddBusinessServices();

// Configure OpenAI
builder.Services.AddOpenAI(builder.Configuration);

// Add AutoMapper and FluentValidation
builder.Services.AddAutoMapperProfiles();
builder.Services.AddValidation();

// Configure API Documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "CaddieAI API", 
        Version = "v1",
        Description = "CaddieAI Golf Assistant API"
    });
    
    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://app.caddieai.com", "http://localhost:8081") // Add React Native metro server
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// WebSocket support is built-in to ASP.NET Core

// Configure HTTP Context
builder.Services.AddHttpContextAccessor();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "CaddieAI API V1");
        c.RoutePrefix = string.Empty; // Serve Swagger UI at the root
    });
}

// Custom middleware
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseMiddleware<JwtMiddleware>();

// Standard middleware
// app.UseHttpsRedirection(); // Commented out for development - causes hanging on HTTP-only setup
app.UseCors("AllowFrontend");

// Enable WebSockets with options
app.UseWebSockets(new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromMinutes(2)
    // ReceiveBufferSize is obsolete and has no effect in .NET 9
    // Remove AllowedOrigins restriction for development - React Native WebSocket might not send proper Origin header
});

app.UseAuthentication();
app.UseAuthorization();

// Map controllers
app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Timestamp = DateTime.UtcNow }));

// Database migration on startup (only in development)
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<CaddieAIDbContext>();
    
    try
    {
        await dbContext.Database.EnsureCreatedAsync();
        Log.Information("Database connection verified");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Failed to connect to database");
    }
}

Log.Information("CaddieAI API starting up");

// Configure URLs explicitly (needed when running DLL directly)
// Bind to all interfaces for development (allows direct IP connections from mobile devices)
app.Urls.Add("http://0.0.0.0:5277");

try
{
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "CaddieAI API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}