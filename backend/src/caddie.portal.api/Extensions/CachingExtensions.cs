using Microsoft.Extensions.Caching.Memory;

namespace caddie.portal.api.Extensions;

/// <summary>
/// Extension methods for dependency injection of caching services
/// </summary>
public static class CachingExtensions
{
    /// <summary>
    /// Add caching services to the dependency injection container
    /// </summary>
    public static IServiceCollection AddCaching(this IServiceCollection services)
    {
        // Add memory cache
        services.AddMemoryCache(options =>
        {
            options.SizeLimit = 100; // Max 100 cached entries
            options.TrackStatistics = true; // Enable cache statistics for monitoring
        });

        // Add distributed memory cache as fallback for Redis later
        services.AddDistributedMemoryCache();

        return services;
    }
}