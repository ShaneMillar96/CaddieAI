using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using caddie.portal.services.Interfaces;

namespace caddie.portal.services.Services;

/// <summary>
/// Service for managing application-level caching
/// </summary>
public class CacheService : ICacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<CacheService> _logger;

    public CacheService(IMemoryCache memoryCache, ILogger<CacheService> logger)
    {
        _memoryCache = memoryCache;
        _logger = logger;
    }

    public Task<T?> GetAsync<T>(string key) where T : class
    {
        try
        {
            if (_memoryCache.TryGetValue(key, out T? cachedValue))
            {
                _logger.LogDebug("Cache hit for key: {CacheKey}", key);
                return Task.FromResult(cachedValue);
            }

            _logger.LogDebug("Cache miss for key: {CacheKey}", key);
            return Task.FromResult<T?>(null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving from cache for key: {CacheKey}", key);
            return Task.FromResult<T?>(null);
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class
    {
        try
        {
            var cacheOptions = new MemoryCacheEntryOptions
            {
                Size = 1, // Each entry counts as 1 towards the SizeLimit
                Priority = CacheItemPriority.Normal
            };

            if (expiration.HasValue)
            {
                cacheOptions.AbsoluteExpirationRelativeToNow = expiration;
            }
            else
            {
                // Default expiration: 30 minutes
                cacheOptions.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30);
            }

            // Set sliding expiration to 5 minutes (reset on access)
            cacheOptions.SlidingExpiration = TimeSpan.FromMinutes(5);

            _memoryCache.Set(key, value, cacheOptions);
            _logger.LogDebug("Cached item with key: {CacheKey}, Expiration: {Expiration}", 
                key, cacheOptions.AbsoluteExpirationRelativeToNow);

            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting cache for key: {CacheKey}", key);
        }
    }

    public async Task RemoveAsync(string key)
    {
        try
        {
            _memoryCache.Remove(key);
            _logger.LogDebug("Removed cache entry for key: {CacheKey}", key);
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cache for key: {CacheKey}", key);
        }
    }

    public async Task ClearAsync()
    {
        try
        {
            // Memory cache doesn't have a clear all method, 
            // so we'd need to track keys or recreate the cache instance
            _logger.LogInformation("Cache clear requested - individual entries will expire naturally");
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cache");
        }
    }

    public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> getItem, TimeSpan? expiration = null) where T : class
    {
        var cachedValue = await GetAsync<T>(key);
        if (cachedValue != null)
        {
            return cachedValue;
        }

        var newValue = await getItem();
        if (newValue != null)
        {
            await SetAsync(key, newValue, expiration);
            return newValue;
        }

        return newValue!;
    }
}