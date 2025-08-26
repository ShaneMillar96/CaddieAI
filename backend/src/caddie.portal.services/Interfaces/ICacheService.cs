namespace caddie.portal.services.Interfaces;

/// <summary>
/// Service interface for application-level caching operations
/// </summary>
public interface ICacheService
{
    /// <summary>
    /// Get a cached value by key
    /// </summary>
    Task<T?> GetAsync<T>(string key) where T : class;

    /// <summary>
    /// Set a value in cache with optional expiration
    /// </summary>
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class;

    /// <summary>
    /// Remove a cached value by key
    /// </summary>
    Task RemoveAsync(string key);

    /// <summary>
    /// Clear all cached values
    /// </summary>
    Task ClearAsync();

    /// <summary>
    /// Get cached value or set it if not found
    /// </summary>
    Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> getItem, TimeSpan? expiration = null) where T : class;
}