using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenAI;
using OpenAI.Chat;
using caddie.portal.services.Configuration;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using caddie.portal.services.Constants;
using caddie.portal.services.Exceptions;
using caddie.portal.dal.Repositories.Interfaces;
using System.Text.Json;
using System.Collections.Concurrent;
using OpenAIChatMessage = OpenAI.Chat.ChatMessage;

namespace caddie.portal.services.Services;

/// <summary>
/// Simplified service for shot analysis with weather integration and cost-optimized OpenAI recommendations
/// </summary>
public class ShotAnalysisService : IShotAnalysisService
{
    private readonly IWeatherService _weatherService;
    private readonly IUserRepository _userRepository;
    private readonly IRoundRepository _roundRepository;
    private readonly OpenAISettings _openAISettings;
    private readonly ICacheService _cacheService;
    private readonly ILogger<ShotAnalysisService> _logger;
    private readonly OpenAIClient _openAIClient;

    // Cache for similar shot analysis to reduce API costs
    private static readonly ConcurrentDictionary<string, ShotAnalysisResult> _analysisCache = new();

    public ShotAnalysisService(
        IWeatherService weatherService,
        IUserRepository userRepository,
        IRoundRepository roundRepository,
        IOptions<OpenAISettings> openAISettings,
        ICacheService cacheService,
        ILogger<ShotAnalysisService> logger)
    {
        _weatherService = weatherService;
        _userRepository = userRepository;
        _roundRepository = roundRepository;
        _openAISettings = openAISettings.Value;
        _cacheService = cacheService;
        _logger = logger;

        // Get API key from environment variable or configuration
        var apiKey = Environment.GetEnvironmentVariable("CADDIEAI_OPENAI_API_KEY") 
                    ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY") 
                    ?? _openAISettings.ApiKey;
        
        if (string.IsNullOrEmpty(apiKey))
        {
            throw new InvalidOperationException("OpenAI API key not configured. Set CADDIEAI_OPENAI_API_KEY environment variable.");
        }
        
        _openAIClient = new OpenAIClient(apiKey);
    }

    /// <summary>
    /// Generate shot analysis with weather-aware club recommendations
    /// </summary>
    public async Task<ShotAnalysisResult> GenerateAnalysisAsync(
        int userId,
        int roundId,
        int holeNumber,
        int distanceYards,
        double latitude,
        double longitude,
        string? playerSkillLevel = null)
    {
        WeatherData? weatherData = null;
        string? skillLevel = null;

        try
        {
            _logger.LogInformation("Starting shot analysis for user {UserId}, distance {Distance}y", userId, distanceYards);

            // Get weather data for location
            weatherData = await _weatherService.GetWeatherByCoordinatesAsync(latitude, longitude);
            
            // Get user skill level if not provided
            skillLevel = playerSkillLevel ?? await GetUserSkillLevelAsync(userId);

            // Check cache for similar analysis (distance ±5y + similar weather)
            var cacheKey = GenerateCacheKey(distanceYards, weatherData, skillLevel);
            if (_analysisCache.TryGetValue(cacheKey, out var cachedResult) && 
                DateTime.UtcNow.Subtract(cachedResult.WeatherConditions.Timestamp).TotalMinutes < 15)
            {
                _logger.LogInformation("Using cached shot analysis for similar conditions");
                return cachedResult;
            }

            // Generate analysis using OpenAI with cost-optimized prompt
            var analysisResult = await GenerateAIAnalysisAsync(distanceYards, weatherData, skillLevel);

            // Cache the result for similar future requests
            _analysisCache.TryAdd(cacheKey, analysisResult);

            // Clean cache periodically to prevent memory growth
            if (_analysisCache.Count > 100)
            {
                CleanAnalysisCache();
            }

            _logger.LogInformation("Shot analysis completed for user {UserId}, confidence {Confidence}%", 
                userId, analysisResult.ConfidenceScore);

            return analysisResult;
        }
        catch (Exception ex) when (IsQuotaExceededException(ex) || IsOpenAIServiceException(ex))
        {
            _logger.LogWarning(ex, "OpenAI service unavailable, using fallback analysis");
            return await GetFallbackAnalysisAsync(distanceYards, weatherData ?? new WeatherData(), skillLevel ?? "intermediate");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating shot analysis for user {UserId}", userId);
            return await GetFallbackAnalysisAsync(distanceYards, weatherData ?? new WeatherData(), skillLevel ?? "intermediate");
        }
    }

    /// <summary>
    /// Generate AI-powered shot analysis with cost-optimized prompt
    /// </summary>
    private async Task<ShotAnalysisResult> GenerateAIAnalysisAsync(int distanceYards, WeatherData weatherData, string skillLevel)
    {
        // Ultra-concise prompt for cost optimization (< 80 tokens)
        var prompt = $"Golf shot analysis. Distance: {distanceYards}y. Weather: {weatherData.Conditions}, Wind: {(int)weatherData.WindSpeed}mph {weatherData.WindDirection}. Player: {skillLevel}.\n\n" +
                     "Response format:\n" +
                     "Club: [club name]\n" +
                     "Tips:\n" +
                     "- [tip 1 max 8 words]\n" +
                     "- [tip 2 max 8 words]\n" +
                     "- [tip 3 max 8 words]\n\n" +
                     "Keep under 80 tokens.";

        var messages = new List<OpenAIChatMessage>
        {
            OpenAIChatMessage.CreateSystemMessage("Golf caddie. Brief, helpful advice. Max 80 tokens."),
            OpenAIChatMessage.CreateUserMessage(prompt)
        };

        var chatClient = _openAIClient.GetChatClient(_openAISettings.Model);
        
        using var cancellationTokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        
        var response = await ExecuteWithRetryAsync(async () =>
            await chatClient.CompleteChatAsync(
                messages,
                new ChatCompletionOptions
                {
                    Temperature = 0.6f, // Lower temperature for consistent, focused responses
                    MaxOutputTokenCount = 80, // Strict token limit for cost control
                    FrequencyPenalty = 0.2f // Reduce repetitive responses
                },
                cancellationTokenSource.Token));

        if (response?.Value?.Content == null || response.Value.Content.Count == 0)
        {
            throw new InvalidOperationException("No response received from OpenAI");
        }

        var responseContent = string.Join("", response.Value.Content.Select(c => c.Text));
        
        _logger.LogInformation("OpenAI shot analysis generated, used {TokenCount} tokens", response.Value.Usage?.TotalTokenCount);

        return ParseAIResponse(responseContent, weatherData, distanceYards, true);
    }

    /// <summary>
    /// Parse OpenAI response into structured result
    /// </summary>
    private ShotAnalysisResult ParseAIResponse(string aiResponse, WeatherData weatherData, int distanceYards, bool isAIGenerated)
    {
        var result = new ShotAnalysisResult
        {
            WeatherConditions = weatherData,
            IsAIGenerated = isAIGenerated,
            ConfidenceScore = isAIGenerated ? 85 : 70
        };

        try
        {
            var lines = aiResponse.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            var tips = new List<string>();

            foreach (var line in lines)
            {
                var trimmedLine = line.Trim();
                
                if (trimmedLine.StartsWith("Club:", StringComparison.OrdinalIgnoreCase))
                {
                    result.RecommendedClub = trimmedLine.Substring(5).Trim();
                }
                else if (trimmedLine.StartsWith("- "))
                {
                    var tip = trimmedLine.Substring(2).Trim();
                    if (!string.IsNullOrEmpty(tip) && tips.Count < 3)
                    {
                        tips.Add(tip);
                    }
                }
            }

            result.ShotTips = tips.Count > 0 ? tips : GetDefaultTips(distanceYards, weatherData);
            
            // Generate weather adjustment and alternatives
            result.WeatherAdjustmentYards = CalculateWeatherAdjustment(distanceYards, weatherData);
            result.AlternativeClubs = GenerateAlternativeClubs(result.RecommendedClub, distanceYards);

            // If parsing fails, use fallback club
            if (string.IsNullOrEmpty(result.RecommendedClub))
            {
                result.RecommendedClub = GetFallbackClubRecommendation(distanceYards);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parsing AI response, using fallback values");
            result.RecommendedClub = GetFallbackClubRecommendation(distanceYards);
            result.ShotTips = GetDefaultTips(distanceYards, weatherData);
            result.ConfidenceScore = 60;
        }

        return result;
    }

    /// <summary>
    /// Get fallback recommendation when AI services are unavailable
    /// </summary>
    public async Task<ShotAnalysisResult> GetFallbackAnalysisAsync(
        int distanceYards,
        WeatherData weatherData,
        string skillLevel = "intermediate")
    {
        var result = new ShotAnalysisResult
        {
            RecommendedClub = GetFallbackClubRecommendation(distanceYards),
            ShotTips = GetDefaultTips(distanceYards, weatherData),
            WeatherConditions = weatherData,
            ConfidenceScore = 70,
            IsAIGenerated = false,
            WeatherAdjustmentYards = CalculateWeatherAdjustment(distanceYards, weatherData)
        };

        result.AlternativeClubs = GenerateAlternativeClubs(result.RecommendedClub, distanceYards);

        _logger.LogInformation("Generated fallback shot analysis: {Club} for {Distance}y", result.RecommendedClub, distanceYards);

        return await Task.FromResult(result);
    }

    #region Helper Methods

    private async Task<string> GetUserSkillLevelAsync(int userId)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(userId);
            return user?.SkillLevel?.Name?.ToLower() ?? "intermediate";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not retrieve user skill level for user {UserId}", userId);
            return "intermediate";
        }
    }

    private string GenerateCacheKey(int distance, WeatherData weather, string skillLevel)
    {
        // Round distance to nearest 5 yards and wind to nearest 5 mph for cache grouping
        var roundedDistance = ((distance + 2) / 5) * 5;
        var roundedWind = ((int)weather.WindSpeed / 5) * 5;
        
        return $"{roundedDistance}_{weather.Conditions?.ToLower()}_{roundedWind}_{weather.WindDirection}_{skillLevel}";
    }

    private void CleanAnalysisCache()
    {
        var keysToRemove = _analysisCache
            .Where(kvp => DateTime.UtcNow.Subtract(kvp.Value.WeatherConditions.Timestamp).TotalMinutes > 30)
            .Select(kvp => kvp.Key)
            .Take(50)
            .ToList();

        foreach (var key in keysToRemove)
        {
            _analysisCache.TryRemove(key, out _);
        }

        _logger.LogDebug("Cleaned {Count} entries from analysis cache", keysToRemove.Count);
    }

    private string GetFallbackClubRecommendation(int distanceYards)
    {
        return distanceYards switch
        {
            < 50 => "Lob Wedge",
            < 80 => "Sand Wedge",
            < 110 => "Pitching Wedge",
            < 130 => "Gap Wedge",
            < 150 => "9 Iron",
            < 170 => "8 Iron",
            < 190 => "7 Iron",
            < 210 => "6 Iron",
            < 230 => "5 Iron",
            < 250 => "4 Iron",
            < 280 => "3 Iron",
            _ => "Driver"
        };
    }

    private List<string> GetDefaultTips(int distanceYards, WeatherData weather)
    {
        var tips = new List<string>();

        if (weather.WindSpeed > 15)
        {
            tips.Add("Take one more club for wind");
            tips.Add("Keep ball flight lower");
        }
        else if (weather.WindSpeed > 8)
        {
            tips.Add("Allow for wind drift");
        }

        if (weather.Temperature < 50)
        {
            tips.Add("Ball travels shorter in cold");
        }
        else if (weather.Temperature > 85)
        {
            tips.Add("Ball carries farther when hot");
        }

        // Add distance-based tips
        if (distanceYards < 100)
        {
            if (tips.Count < 3) tips.Add("Focus on solid contact");
            if (tips.Count < 3) tips.Add("Accelerate through impact");
        }
        else
        {
            if (tips.Count < 3) tips.Add("Commit to your target");
            if (tips.Count < 3) tips.Add("Trust your distance");
        }

        // Ensure we always have at least one tip
        if (tips.Count == 0)
        {
            tips.Add("Smooth tempo and follow through");
        }

        return tips.Take(3).ToList();
    }

    private int CalculateWeatherAdjustment(int distanceYards, WeatherData weather)
    {
        var adjustment = 0;

        // Wind adjustments
        if (weather.WindSpeed > 10)
        {
            var windEffect = (int)(weather.WindSpeed * 0.8); // Rough calculation
            if (weather.WindDirection?.ToLower().Contains("head") == true)
            {
                adjustment -= windEffect; // Headwind reduces distance
            }
            else if (weather.WindDirection?.ToLower().Contains("tail") == true)
            {
                adjustment += windEffect; // Tailwind increases distance
            }
            // Crosswind doesn't significantly affect total distance
        }

        // Temperature adjustments
        if (weather.Temperature < 50)
        {
            adjustment -= (int)(distanceYards * 0.02); // 2% reduction in cold
        }
        else if (weather.Temperature > 85)
        {
            adjustment += (int)(distanceYards * 0.02); // 2% increase in heat
        }

        return adjustment;
    }

    private List<string> GenerateAlternativeClubs(string primaryClub, int distanceYards)
    {
        var alternatives = new List<string>();

        // Generate logical alternatives based on primary club
        if (primaryClub.Contains("Iron") && int.TryParse(primaryClub.Split(' ')[0], out int ironNumber))
        {
            if (ironNumber > 3 && ironNumber <= 9)
            {
                alternatives.Add($"{ironNumber - 1} Iron"); // One club more distance
            }
            if (ironNumber >= 3 && ironNumber < 9)
            {
                alternatives.Add($"{ironNumber + 1} Iron"); // One club less distance
            }
        }
        else if (primaryClub.Contains("Wedge"))
        {
            if (primaryClub == "Pitching Wedge")
            {
                alternatives.Add("9 Iron");
                alternatives.Add("Gap Wedge");
            }
            else if (primaryClub == "Gap Wedge")
            {
                alternatives.Add("Pitching Wedge");
                alternatives.Add("Sand Wedge");
            }
        }

        // If no specific alternatives, provide distance-based options
        if (alternatives.Count == 0)
        {
            var longerClub = GetFallbackClubRecommendation(distanceYards + 15);
            var shorterClub = GetFallbackClubRecommendation(distanceYards - 15);
            
            if (longerClub != primaryClub) alternatives.Add(longerClub);
            if (shorterClub != primaryClub) alternatives.Add(shorterClub);
        }

        return alternatives.Take(2).ToList(); // Limit to 2 alternatives
    }

    private bool IsQuotaExceededException(Exception ex)
    {
        return ex.Message?.Contains("quota") == true || 
               ex.Message?.Contains("rate limit") == true ||
               ex.Message?.Contains("insufficient credits") == true;
    }

    private bool IsOpenAIServiceException(Exception ex)
    {
        return ex.Message?.Contains("timeout") == true ||
               ex.Message?.Contains("service unavailable") == true ||
               ex.Message?.Contains("connection") == true;
    }

    /// <summary>
    /// Execute OpenAI operation with retry logic
    /// </summary>
    private async Task<T> ExecuteWithRetryAsync<T>(Func<Task<T>> operation, int maxRetries = 2)
    {
        var baseDelay = TimeSpan.FromSeconds(1);
        
        for (int attempt = 0; attempt <= maxRetries; attempt++)
        {
            try
            {
                return await operation();
            }
            catch (Exception ex) when (IsRetryableException(ex) && attempt < maxRetries)
            {
                var delay = TimeSpan.FromMilliseconds(baseDelay.TotalMilliseconds * Math.Pow(2, attempt));
                _logger.LogWarning("OpenAI request attempt {Attempt} failed, retrying in {Delay}ms: {Error}", 
                    attempt + 1, delay.TotalMilliseconds, ex.Message);
                await Task.Delay(delay);
            }
        }
        
        // This should never be reached due to the exception handling above
        throw new InvalidOperationException("All retry attempts failed");
    }

    /// <summary>
    /// Check if exception is retryable
    /// </summary>
    private bool IsRetryableException(Exception ex)
    {
        return ex.Message?.Contains("timeout") == true ||
               ex.Message?.Contains("rate limit") == true ||
               ex.Message?.Contains("temporarily unavailable") == true ||
               ex.Message?.Contains("server error") == true;
    }

    #endregion
}