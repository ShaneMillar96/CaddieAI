using Microsoft.Extensions.Logging;
using System.Text.Json;
using caddie.portal.services.Configuration;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using caddie.portal.dal.Repositories.Interfaces;
using caddie.portal.dal.Models;
using LocationContext = caddie.portal.services.Models.LocationContext;

namespace caddie.portal.services.Services;

public class GolfContextService : IGolfContextService
{
    private readonly IUserRepository _userRepository;
    private readonly ICourseRepository _courseRepository;
    private readonly IRoundRepository _roundRepository;
    private readonly ILocationRepository _locationRepository;
    private readonly ILogger<GolfContextService> _logger;

    public GolfContextService(
        IUserRepository userRepository,
        ICourseRepository courseRepository,
        IRoundRepository roundRepository,
        ILocationRepository locationRepository,
        ILogger<GolfContextService> logger)
    {
        _userRepository = userRepository;
        _courseRepository = courseRepository;
        _roundRepository = roundRepository;
        _locationRepository = locationRepository;
        _logger = logger;
    }

    public async Task<GolfContext> GenerateContextAsync(int userId, int? roundId = null, int? courseId = null, int? currentHole = null)
    {
        try
        {
            var context = new GolfContext();

            // Get user profile
            context.User = await GetUserGolfProfileAsync(userId);

            // Get course information
            if (courseId.HasValue)
            {
                context.Course = await GetCourseContextAsync(courseId.Value);
            }

            // Get round information
            if (roundId.HasValue)
            {
                context.Round = await GetRoundContextAsync(roundId.Value);
                
                // If round exists but no course specified, get course from round
                if (context.Course == null && context.Round != null)
                {
                    var round = await _roundRepository.GetByIdAsync(roundId.Value);
                    if (round?.CourseId != null)
                    {
                        context.Course = await GetCourseContextAsync(round.CourseId);
                    }
                }
            }

            // Get current hole information
            if (currentHole.HasValue && context.Course != null)
            {
                context.CurrentHole = await GetHoleContextAsync(context.Course.CourseId, currentHole.Value);
            }

            // Get location information
            if (roundId.HasValue)
            {
                context.Location = await GetLocationContextAsync(userId, roundId.Value);
            }

            // Get performance context
            context.Performance = await GetPerformanceContextAsync(userId, roundId);

            // Add weather context (placeholder - integrate with weather service later)
            context.Weather = GetDefaultWeatherContext();

            _logger.LogInformation("Generated golf context for user {UserId}, round {RoundId}, course {CourseId}", 
                userId, roundId, courseId);

            return context;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating golf context for user {UserId}", userId);
            throw;
        }
    }

    public async Task<GolfContext> UpdateContextAsync(GolfContext context, int? currentHole = null, Location? location = null)
    {
        try
        {
            // Update current hole if changed
            if (currentHole.HasValue && context.Course != null && 
                (context.CurrentHole?.HoleNumber != currentHole.Value))
            {
                context.CurrentHole = await GetHoleContextAsync(context.Course.CourseId, currentHole.Value);
            }

            // Update location if provided
            if (location != null)
            {
                context.Location = new LocationContext
                {
                    Latitude = (decimal)location.Latitude,
                    Longitude = (decimal)location.Longitude,
                    Timestamp = location.Timestamp ?? DateTime.UtcNow
                };

                // Calculate distances if we have hole information
                if (context.CurrentHole != null)
                {
                    // This would integrate with distance calculation service
                    context.Location.DistanceToPinMeters = (decimal?)CalculateDistanceToPin(location, context.CurrentHole);
                }
            }

            // Update round context if round is active
            if (context.Round != null)
            {
                var round = await _roundRepository.GetByIdAsync(context.Round.RoundId);
                if (round != null)
                {
                    context.Round.CurrentHole = round.CurrentHole;
                    context.Round.Status = round.Status?.Name;
                    context.Round.ElapsedTime = round.StartTime.HasValue 
                        ? DateTime.UtcNow - round.StartTime.Value 
                        : null;
                }
            }

            context.GeneratedAt = DateTime.UtcNow;

            return context;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating golf context");
            throw;
        }
    }

    public async Task<string> GenerateSystemPromptAsync(GolfContext context, string personalityType = "encouraging_caddie")
    {
        // Determine the appropriate prompt based on user skill level and context
        var skillLevel = context.User?.SkillLevel ?? "intermediate";
        var playingStyle = context.User?.PlayingStyle;
        
        // Determine situation context
        string? situation = null;
        if (context.Performance?.CurrentRoundScore != null && context.Round?.CurrentHole != null)
        {
            var parSoFar = context.Round.CurrentHole.Value * 4; // Rough estimate
            var scoreRelativeToPar = context.Performance.CurrentRoundScore.Value - parSoFar;
            
            situation = scoreRelativeToPar switch
            {
                < -2 => "playing_well",
                > 4 => "struggling",
                _ => null
            };
        }

        var basePrompt = SystemPrompts.GetPromptForContext(skillLevel, playingStyle, situation);
        var contextualInfo = await BuildContextualInfoAsync(context);

        return $"{basePrompt}\n\n{contextualInfo}";
    }

    public Task<ClubRecommendationResult> GetClubRecommendationAsync(GolfContext context, double distanceToPin, string? conditions = null)
    {
        try
        {
            // This is a simplified club recommendation algorithm
            // In a real implementation, this would be more sophisticated
            
            var recommendation = new ClubRecommendationResult
            {
                Confidence = 0.8
            };

            // Basic distance-based recommendation
            var club = distanceToPin switch
            {
                < 50 => "Sand Wedge",
                < 80 => "Pitching Wedge",
                < 110 => "Gap Wedge",
                < 130 => "9 Iron",
                < 150 => "8 Iron",
                < 170 => "7 Iron",
                < 190 => "6 Iron",
                < 210 => "5 Iron",
                < 230 => "4 Iron",
                < 250 => "3 Iron or Hybrid",
                _ => "Driver or 3 Wood"
            };

            recommendation.Club = club;
            recommendation.Reasoning = $"Based on {distanceToPin} yards to pin";

            // Adjust for user skill level
            if (context.User.SkillLevel == "beginner")
            {
                recommendation.Reasoning += ". Recommend more forgiving clubs for your skill level.";
                recommendation.Alternatives.Add("Consider using a higher lofted club for better control");
            }

            // Adjust for conditions
            if (!string.IsNullOrEmpty(conditions))
            {
                if (conditions.Contains("wind"))
                {
                    recommendation.Reasoning += " Consider wind conditions - may need one club up or down.";
                    recommendation.Confidence -= 0.1;
                }
            }

            // Add hole-specific strategy
            if (context.CurrentHole != null)
            {
                recommendation.Strategy = $"Hole {context.CurrentHole.HoleNumber} - Par {context.CurrentHole.Par}";
                if (!string.IsNullOrEmpty(context.CurrentHole.Description))
                {
                    recommendation.Strategy += $". {context.CurrentHole.Description}";
                }
            }

            recommendation.Factors.Add("distance", distanceToPin);
            recommendation.Factors.Add("conditions", conditions ?? "normal");
            recommendation.Factors.Add("skillLevel", context.User.SkillLevel ?? "intermediate");

            return Task.FromResult(recommendation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating club recommendation");
            throw;
        }
    }

    private async Task<UserGolfProfile> GetUserGolfProfileAsync(int userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        return new UserGolfProfile
        {
            UserId = userId,
            Name = $"{user?.FirstName} {user?.LastName}".Trim(),
            Handicap = user?.Handicap,
            SkillLevel = user?.SkillLevel?.Name,
            PlayingStyle = user?.PlayingStyle,
            Preferences = user?.Preferences != null 
                ? JsonSerializer.Deserialize<Dictionary<string, object>>(user.Preferences) 
                : null
        };
    }

    private async Task<CourseContext?> GetCourseContextAsync(int courseId)
    {
        var course = await _courseRepository.GetByIdAsync(courseId);
        if (course == null) return null;

        return new CourseContext
        {
            CourseId = courseId,
            Name = course.Name,
            Description = course.Description,
            Location = $"{course.City}, {course.State}, {course.Country}",
            TotalHoles = course.TotalHoles,
            ParTotal = course.ParTotal,
            CourseRating = course.CourseRating,
            SlopeRating = course.SlopeRating,
            Difficulty = DetermineDifficulty(course.CourseRating, course.SlopeRating),
            Features = !string.IsNullOrEmpty(course.Amenities) 
                ? JsonSerializer.Deserialize<Dictionary<string, object>>(course.Amenities) 
                : null
        };
    }

    private async Task<RoundContext?> GetRoundContextAsync(int roundId)
    {
        var round = await _roundRepository.GetByIdAsync(roundId);
        if (round == null) return null;

        return new RoundContext
        {
            RoundId = roundId,
            StartTime = round.StartTime ?? DateTime.UtcNow,
            CurrentHole = round.CurrentHole,
            Status = round.Status?.Name,
            ElapsedTime = round.StartTime.HasValue ? DateTime.UtcNow - round.StartTime.Value : null
        };
    }

    private Task<HoleContext?> GetHoleContextAsync(int courseId, int holeNumber)
    {
        // This would need to be implemented based on your hole data structure
        // For now, returning a basic context
        return Task.FromResult<HoleContext?>(new HoleContext
        {
            HoleId = holeNumber,
            HoleNumber = holeNumber,
            Par = 4, // Default - would come from database
            Yardage = 400, // Default - would come from database
            Description = $"Hole {holeNumber}"
        });
    }

    private Task<LocationContext?> GetLocationContextAsync(int userId, int roundId)
    {
        // Get the most recent location for this round
        // This would integrate with your location tracking system
        return Task.FromResult<LocationContext?>(null); // Placeholder
    }

    private Task<PerformanceContext> GetPerformanceContextAsync(int userId, int? roundId)
    {
        // This would analyze user's recent performance
        // For now, returning basic context
        return Task.FromResult(new PerformanceContext());
    }

    private static WeatherContext GetDefaultWeatherContext()
    {
        // Placeholder - would integrate with weather service
        return new WeatherContext
        {
            Conditions = "Partly Cloudy",
            Temperature = 72,
            WindSpeed = 5,
            WindDirection = "SW"
        };
    }

    private static string DetermineDifficulty(decimal? rating, int? slope)
    {
        if (!rating.HasValue || !slope.HasValue) return "Unknown";
        
        return slope.Value switch
        {
            < 113 => "Easy",
            < 125 => "Moderate",
            < 140 => "Challenging",
            _ => "Very Challenging"
        };
    }

    private static double? CalculateDistanceToPin(Location location, HoleContext hole)
    {
        // Placeholder - would implement actual distance calculation
        return null;
    }


    private Task<string> BuildContextualInfoAsync(GolfContext context)
    {
        var info = new List<string>();

        // User context
        if (context.User != null)
        {
            info.Add($"Player: {context.User.Name}");
            if (context.User.Handicap.HasValue)
                info.Add($"Handicap: {context.User.Handicap.Value}");
            if (!string.IsNullOrEmpty(context.User.SkillLevel))
                info.Add($"Skill Level: {context.User.SkillLevel}");
        }

        // Course context
        if (context.Course != null)
        {
            info.Add($"Course: {context.Course.Name}");
            info.Add($"Par {context.Course.ParTotal}, {context.Course.TotalHoles} holes");
            if (!string.IsNullOrEmpty(context.Course.Difficulty))
                info.Add($"Difficulty: {context.Course.Difficulty}");
        }

        // Round context
        if (context.Round != null)
        {
            info.Add($"Round Status: {context.Round.Status}");
            if (context.Round.CurrentHole.HasValue)
                info.Add($"Current Hole: {context.Round.CurrentHole.Value}");
            if (context.Round.ElapsedTime.HasValue)
                info.Add($"Playing Time: {context.Round.ElapsedTime.Value:h\\:mm}");
        }

        // Current hole context
        if (context.CurrentHole != null)
        {
            info.Add($"Hole {context.CurrentHole.HoleNumber} - Par {context.CurrentHole.Par}");
            if (context.CurrentHole.Yardage.HasValue)
                info.Add($"Distance: {context.CurrentHole.Yardage.Value} yards");
            if (!string.IsNullOrEmpty(context.CurrentHole.Description))
                info.Add($"Hole Description: {context.CurrentHole.Description}");
        }

        // Weather context
        if (context.Weather != null)
        {
            var weatherInfo = $"Weather: {context.Weather.Conditions}";
            if (context.Weather.Temperature.HasValue)
                weatherInfo += $", {context.Weather.Temperature.Value}°F";
            if (context.Weather.WindSpeed.HasValue && context.Weather.WindSpeed.Value > 0)
                weatherInfo += $", Wind: {context.Weather.WindSpeed.Value} mph {context.Weather.WindDirection}";
            info.Add(weatherInfo);
        }

        if (info.Any())
        {
            return Task.FromResult("Current Context:\n" + string.Join("\n", info));
        }

        return Task.FromResult("");
    }
}