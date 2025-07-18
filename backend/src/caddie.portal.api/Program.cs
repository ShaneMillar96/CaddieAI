using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using FluentValidation;
using FluentValidation.AspNetCore;
using Serilog;
using System.Text;
using caddie.portal.api.Middleware;
using caddie.portal.api.Mapping;
using caddie.portal.api.Validators.Auth;
using caddie.portal.dal.Context;
using caddie.portal.dal.Repositories;
using caddie.portal.dal.Repositories.Interfaces;
using caddie.portal.services.Configuration;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();

// Configure Entity Framework
builder.Services.AddDbContext<CaddieAIDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.UseNetTopologySuite();
    });
});

// Configure Settings
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.SectionName));
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection(EmailSettings.SectionName));
builder.Services.Configure<AuthenticationSettings>(builder.Configuration.GetSection(AuthenticationSettings.SectionName));

// Add Authentication and Authorization
var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>();
if (jwtSettings == null)
{
    throw new InvalidOperationException("JWT settings are not configured");
}

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
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Register Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IUserSessionRepository, UserSessionRepository>();
builder.Services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();

// Register Services
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
builder.Services.AddScoped<IPasswordService, PasswordService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(AuthMappingProfile));

// Add FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

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
        policy.WithOrigins("http://localhost:3000", "https://app.caddieai.com") // Add your frontend URLs
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

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
app.Urls.Add("http://localhost:5277");

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