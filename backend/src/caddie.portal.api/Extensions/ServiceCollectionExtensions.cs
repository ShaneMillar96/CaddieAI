using Microsoft.EntityFrameworkCore;
using FluentValidation;
using FluentValidation.AspNetCore;
using caddie.portal.dal.Context;
using caddie.portal.dal.Repositories;
using caddie.portal.dal.Repositories.Interfaces;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Services;
using caddie.portal.services.Configuration;
using caddie.portal.api.Mapping;
using caddie.portal.api.MappingProfiles;
using caddie.portal.api.Validators.Auth;

namespace caddie.portal.api.Extensions;

/// <summary>
/// Extension methods for IServiceCollection to organize dependency injection registrations
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Add Entity Framework and database configuration
    /// </summary>
    public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<CaddieAIDbContext>(options =>
        {
            var connectionString = Environment.GetEnvironmentVariable("CADDIEAI_CONNECTION_STRING") 
                                  ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
                                  ?? configuration.GetConnectionString("DefaultConnection");
            
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("Database connection string is not configured. Set CADDIEAI_CONNECTION_STRING environment variable or configure in appsettings.json");
            }
            
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.UseNetTopologySuite();
            });
        });

        return services;
    }

    /// <summary>
    /// Add all repository implementations
    /// </summary>
    public static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        // Authentication repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IUserSessionRepository, UserSessionRepository>();
        services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();
        
        // Core domain repositories
        services.AddScoped<ICourseRepository, CourseRepository>();
        services.AddScoped<IUserCourseRepository, UserCourseRepository>();
        services.AddScoped<IRoundRepository, RoundRepository>();
        services.AddScoped<ILocationRepository, LocationRepository>();
        services.AddScoped<IHoleRepository, HoleRepository>();
        
        // Swing analysis and Garmin device repositories
        services.AddScoped<ISwingAnalysisRepository, SwingAnalysisRepository>();
        services.AddScoped<IGarminDeviceRepository, GarminDeviceRepository>();
        
        // AI and chat repositories - removed unused implementations
        
        // Shot tracking repositories - removed unused implementations

        return services;
    }

    /// <summary>
    /// Add all business service implementations
    /// </summary>
    public static IServiceCollection AddBusinessServices(this IServiceCollection services)
    {
        // Authentication services
        services.AddScoped<IAuthenticationService, AuthenticationService>();
        services.AddScoped<IPasswordService, PasswordService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IEmailService, EmailService>();
        
        // Core domain services
        services.AddScoped<ICourseService, CourseService>();
        services.AddScoped<IUserCourseService, UserCourseService>();
        services.AddScoped<IRoundService, RoundService>();
        // Removed IHoleService and IShotService - unused implementations
        
        // Swing analysis and Garmin device services
        services.AddScoped<ISwingAnalysisService, SwingAnalysisService>();
        services.AddScoped<IGarminDeviceService, GarminDeviceService>();
        
        // AI services
        services.AddScoped<IOpenAIService, OpenAIService>();
        services.AddScoped<IGolfContextService, GolfContextService>();
        services.AddScoped<IAIScoreService, AIScoreService>();
        services.AddScoped<IRealtimeAudioService, RealtimeAudioService>();
        
        // Enhanced AI Caddie services
        services.AddScoped<IShotTypeDetectionService, ShotTypeDetectionService>();
        services.AddScoped<ISkillBasedAdviceService, SkillBasedAdviceService>();
        services.AddScoped<IEnhancedShotAnalysisService, EnhancedShotAnalysisService>();
        
        // Removed IClubRecommendationService - unused implementation
        
        // Analytics services - removed unused implementations

        return services;
    }

    /// <summary>
    /// Add OpenAI configuration and HTTP client
    /// </summary>
    public static IServiceCollection AddOpenAI(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure OpenAI settings with environment variable support
        services.Configure<OpenAISettings>(options =>
        {
            configuration.GetSection(OpenAISettings.SectionName).Bind(options);
            
            // Override API key from environment variables if available
            var envApiKey = Environment.GetEnvironmentVariable("CADDIEAI_OPENAI_API_KEY")
                           ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");
            if (!string.IsNullOrEmpty(envApiKey))
            {
                options.ApiKey = envApiKey;
            }
        });

        // Get OpenAI settings for HTTP client configuration
        var openAISettings = configuration.GetSection(OpenAISettings.SectionName).Get<OpenAISettings>();
        if (openAISettings == null)
        {
            throw new InvalidOperationException("OpenAI settings are not configured");
        }

        // Get API key from environment variable or configuration
        var apiKey = Environment.GetEnvironmentVariable("CADDIEAI_OPENAI_API_KEY")
                    ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY") 
                    ?? openAISettings.ApiKey;

        if (string.IsNullOrEmpty(apiKey))
        {
            throw new InvalidOperationException("OpenAI API key is not configured. Set CADDIEAI_OPENAI_API_KEY environment variable or configure in appsettings.json");
        }

        // Configure HTTP client for OpenAI
        services.AddHttpClient("OpenAI", client =>
        {
            client.BaseAddress = new Uri(openAISettings.BaseUrl);
            client.Timeout = TimeSpan.FromSeconds(openAISettings.TimeoutSeconds);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
        });

        return services;
    }

    /// <summary>
    /// Add configuration settings with environment variable support
    /// </summary>
    public static IServiceCollection AddConfigurationSettings(this IServiceCollection services, IConfiguration configuration)
    {
        // JWT settings with environment variable support
        services.Configure<JwtSettings>(options =>
        {
            configuration.GetSection(JwtSettings.SectionName).Bind(options);
            
            var envJwtSecret = Environment.GetEnvironmentVariable("CADDIEAI_JWT_SECRET") 
                              ?? Environment.GetEnvironmentVariable("JwtSettings__Secret");
            if (!string.IsNullOrEmpty(envJwtSecret))
            {
                options.Secret = envJwtSecret;
            }
        });

        // Email settings with environment variable support
        services.Configure<EmailSettings>(options =>
        {
            configuration.GetSection(EmailSettings.SectionName).Bind(options);
            
            var envSmtpHost = Environment.GetEnvironmentVariable("CADDIEAI_SMTP_HOST") 
                             ?? Environment.GetEnvironmentVariable("EmailSettings__SmtpHost");
            if (!string.IsNullOrEmpty(envSmtpHost))
            {
                options.SmtpHost = envSmtpHost;
            }
            
            var envSmtpUsername = Environment.GetEnvironmentVariable("CADDIEAI_SMTP_USERNAME") 
                                 ?? Environment.GetEnvironmentVariable("EmailSettings__SmtpUsername");
            if (!string.IsNullOrEmpty(envSmtpUsername))
            {
                options.SmtpUsername = envSmtpUsername;
            }
            
            var envSmtpPassword = Environment.GetEnvironmentVariable("CADDIEAI_SMTP_PASSWORD") 
                                 ?? Environment.GetEnvironmentVariable("EmailSettings__SmtpPassword");
            if (!string.IsNullOrEmpty(envSmtpPassword))
            {
                options.SmtpPassword = envSmtpPassword;
            }
            
            var envFromEmail = Environment.GetEnvironmentVariable("CADDIEAI_FROM_EMAIL") 
                              ?? Environment.GetEnvironmentVariable("EmailSettings__FromEmail");
            if (!string.IsNullOrEmpty(envFromEmail))
            {
                options.FromEmail = envFromEmail;
            }
        });

        // Other settings without environment variable overrides
        services.Configure<AuthenticationSettings>(configuration.GetSection(AuthenticationSettings.SectionName));
        services.Configure<OpenAISettings>(configuration.GetSection(OpenAISettings.SectionName));

        return services;
    }

    /// <summary>
    /// Add AutoMapper with all mapping profiles
    /// </summary>
    public static IServiceCollection AddAutoMapperProfiles(this IServiceCollection services)
    {
        services.AddAutoMapper(
            typeof(AuthMappingProfile),
            typeof(CourseMappingProfile), 
            typeof(UserCourseMappingProfile),
            typeof(RoundMappingProfile),
            typeof(HoleScoreMappingProfile),
            typeof(AICaddieMappingProfile),
            typeof(SwingAnalysisMappingProfile),
            typeof(GarminDeviceMappingProfile)
            // Removed unused mapping profiles
        );

        return services;
    }

    /// <summary>
    /// Add FluentValidation with all validators
    /// </summary>
    public static IServiceCollection AddValidation(this IServiceCollection services)
    {
        services.AddFluentValidationAutoValidation();
        services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

        return services;
    }
}