using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using AutoMapper;
using System.Text.Json;
using caddie.portal.services.Configuration;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories.Interfaces;
using OpenAI;
using OpenAI.Chat;

namespace caddie.portal.services.Services;

public class ClubRecommendationService : IClubRecommendationService
{
    private readonly IClubRecommendationRepository _clubRecommendationRepository;
    private readonly IGolfContextService _golfContextService;
    private readonly IUserRepository _userRepository;
    private readonly IRoundRepository _roundRepository;
    private readonly ILocationRepository _locationRepository;
    private readonly OpenAISettings _openAISettings;
    private readonly IMapper _mapper;
    private readonly ILogger<ClubRecommendationService> _logger;
    private readonly OpenAIClient _openAIClient;

    public ClubRecommendationService(
        IClubRecommendationRepository clubRecommendationRepository,
        IGolfContextService golfContextService,
        IUserRepository userRepository,
        IRoundRepository roundRepository,
        ILocationRepository locationRepository,
        IOptions<OpenAISettings> openAISettings,
        IMapper mapper,
        ILogger<ClubRecommendationService> logger)
    {
        _clubRecommendationRepository = clubRecommendationRepository;
        _golfContextService = golfContextService;
        _userRepository = userRepository;
        _roundRepository = roundRepository;
        _locationRepository = locationRepository;
        _openAISettings = openAISettings.Value;
        _mapper = mapper;
        _logger = logger;
        _openAIClient = new OpenAIClient(_openAISettings.ApiKey);
    }

    public async Task<ClubRecommendationModel> GenerateRecommendationAsync(ClubRecommendationRequestModel request)
    {
        try
        {
            _logger.LogInformation("Generating club recommendation for user {UserId}, distance {Distance}m", 
                request.UserId, request.DistanceToTarget);

            // Generate golf context for AI recommendation
            var golfContext = await _golfContextService.GenerateContextAsync(
                request.UserId, 
                request.RoundId, 
                null, // courseId will be determined from round
                request.HoleId);

            // Get historical recommendations for learning
            var similarSituations = await _clubRecommendationRepository.GetSimilarSituationsAsync(
                request.UserId, 
                request.DistanceToTarget, 
                request.HoleId);

            // Generate AI-powered recommendation
            var aiRecommendation = await GenerateAIRecommendationAsync(request, golfContext, similarSituations);

            // Create and save recommendation
            var clubRecommendation = new ClubRecommendation
            {
                UserId = request.UserId,
                RoundId = request.RoundId,
                HoleId = request.HoleId,
                LocationId = request.LocationId,
                RecommendedClub = aiRecommendation.Club,
                ConfidenceScore = (decimal)aiRecommendation.Confidence,
                DistanceToTarget = request.DistanceToTarget,
                OpenaiReasoning = aiRecommendation.Reasoning,
                ContextUsed = JsonSerializer.Serialize(new
                {
                    request.WeatherConditions,
                    request.LieConditions,
                    request.ShotType,
                    request.PlayerNotes,
                    GolfContext = golfContext,
                    SimilarSituationsCount = similarSituations.Count()
                }),
                RecommendationMetadata = JsonSerializer.Serialize(new
                {
                    AlternativeClubs = aiRecommendation.Alternatives,
                    Strategy = aiRecommendation.Strategy,
                    Factors = aiRecommendation.Factors,
                    ModelUsed = _openAISettings.Model,
                    GeneratedAt = DateTime.UtcNow
                })
            };

            var savedRecommendation = await _clubRecommendationRepository.CreateAsync(clubRecommendation);
            
            _logger.LogInformation("Created club recommendation {RecommendationId} for user {UserId}: {Club}", 
                savedRecommendation.Id, request.UserId, savedRecommendation.RecommendedClub);

            return _mapper.Map<ClubRecommendationModel>(savedRecommendation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating club recommendation for user {UserId}", request.UserId);
            throw;
        }
    }

    public async Task<bool> SaveRecommendationFeedbackAsync(int recommendationId, ClubRecommendationFeedbackModel feedback)
    {
        try
        {
            var recommendation = await _clubRecommendationRepository.GetByIdAsync(recommendationId);
            if (recommendation == null)
            {
                _logger.LogWarning("Recommendation {RecommendationId} not found for feedback", recommendationId);
                return false;
            }

            recommendation.WasAccepted = feedback.WasAccepted;
            recommendation.ActualClubUsed = feedback.ActualClubUsed;

            // Update metadata with feedback details
            var existingMetadata = !string.IsNullOrEmpty(recommendation.RecommendationMetadata)
                ? JsonSerializer.Deserialize<Dictionary<string, object>>(recommendation.RecommendationMetadata) ?? new Dictionary<string, object>()
                : new Dictionary<string, object>();

            existingMetadata["FeedbackData"] = new
            {
                feedback.PlayerNotes,
                feedback.ShotResult,
                feedback.ShotOutcome,
                FeedbackReceivedAt = DateTime.UtcNow
            };

            recommendation.RecommendationMetadata = JsonSerializer.Serialize(existingMetadata);

            await _clubRecommendationRepository.UpdateAsync(recommendation);

            _logger.LogInformation("Updated recommendation {RecommendationId} with feedback: accepted={Accepted}, actualClub={ActualClub}", 
                recommendationId, feedback.WasAccepted, feedback.ActualClubUsed);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving feedback for recommendation {RecommendationId}", recommendationId);
            throw;
        }
    }

    public async Task<IEnumerable<ClubRecommendationModel>> GetUserRecommendationHistoryAsync(int userId, int? limit = null)
    {
        try
        {
            var recommendations = await _clubRecommendationRepository.GetUserRecommendationHistoryAsync(userId, limit);
            return _mapper.Map<IEnumerable<ClubRecommendationModel>>(recommendations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recommendation history for user {UserId}", userId);
            throw;
        }
    }

    public async Task<ClubRecommendationModel?> GetRecommendationByIdAsync(int id)
    {
        try
        {
            var recommendation = await _clubRecommendationRepository.GetByIdAsync(id);
            return recommendation != null ? _mapper.Map<ClubRecommendationModel>(recommendation) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recommendation {RecommendationId}", id);
            throw;
        }
    }

    public async Task<IEnumerable<ClubRecommendationModel>> GetRoundRecommendationsAsync(int roundId)
    {
        try
        {
            var recommendations = await _clubRecommendationRepository.GetByRoundIdAsync(roundId);
            return _mapper.Map<IEnumerable<ClubRecommendationModel>>(recommendations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recommendations for round {RoundId}", roundId);
            throw;
        }
    }

    public async Task<ClubRecommendationAnalyticsModel> GetUserAnalyticsAsync(int userId)
    {
        try
        {
            var acceptanceRate = await _clubRecommendationRepository.GetUserAcceptanceRateAsync(userId);
            var totalRecommendations = (await _clubRecommendationRepository.GetByUserIdAsync(userId)).Count();
            var acceptedRecommendations = (int)(acceptanceRate * totalRecommendations);
            var mostRecommended = await _clubRecommendationRepository.GetMostRecommendedClubsAsync(userId);
            var clubAccuracy = await _clubRecommendationRepository.GetClubAcceptanceRatesAsync();

            return new ClubRecommendationAnalyticsModel
            {
                OverallAcceptanceRate = acceptanceRate,
                TotalRecommendations = totalRecommendations,
                AcceptedRecommendations = acceptedRecommendations,
                MostRecommendedClubs = mostRecommended.Select(x => new ClubPopularityModel
                {
                    Club = x.Club,
                    RecommendationCount = x.Count,
                    Percentage = totalRecommendations > 0 ? (decimal)x.Count / totalRecommendations * 100 : 0
                }).ToList(),
                ClubAccuracyRates = clubAccuracy.Select(x => new ClubAccuracyModel
                {
                    Club = x.Club,
                    AcceptanceRate = x.AcceptanceRate,
                    TotalRecommendations = (int)(x.AcceptanceRate > 0 ? x.AcceptanceRate * 100 : 0), // Approximate
                    AcceptedRecommendations = (int)(x.AcceptanceRate * 100)
                }).ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting analytics for user {UserId}", userId);
            throw;
        }
    }

    public async Task<ClubRecommendationAnalyticsModel> GetSystemAnalyticsAsync()
    {
        try
        {
            var acceptanceRate = await _clubRecommendationRepository.GetOverallAcceptanceRateAsync();
            var mostRecommended = await _clubRecommendationRepository.GetMostRecommendedClubsAsync();
            var clubAccuracy = await _clubRecommendationRepository.GetClubAcceptanceRatesAsync();

            var totalRecommendations = mostRecommended.Sum(x => x.Count);
            var acceptedRecommendations = (int)(acceptanceRate * totalRecommendations);

            return new ClubRecommendationAnalyticsModel
            {
                OverallAcceptanceRate = acceptanceRate,
                TotalRecommendations = totalRecommendations,
                AcceptedRecommendations = acceptedRecommendations,
                MostRecommendedClubs = mostRecommended.Select(x => new ClubPopularityModel
                {
                    Club = x.Club,
                    RecommendationCount = x.Count,
                    Percentage = totalRecommendations > 0 ? (decimal)x.Count / totalRecommendations * 100 : 0
                }).ToList(),
                ClubAccuracyRates = clubAccuracy.Select(x => new ClubAccuracyModel
                {
                    Club = x.Club,
                    AcceptanceRate = x.AcceptanceRate,
                    TotalRecommendations = (int)(x.AcceptanceRate > 0 ? x.AcceptanceRate * 100 : 0),
                    AcceptedRecommendations = (int)(x.AcceptanceRate * 100)
                }).ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting system analytics");
            throw;
        }
    }

    public async Task<IEnumerable<ClubRecommendationModel>> GetSimilarSituationRecommendationsAsync(int userId, decimal distanceToTarget, int? holeId = null)
    {
        try
        {
            var recommendations = await _clubRecommendationRepository.GetSimilarSituationsAsync(userId, distanceToTarget, holeId);
            return _mapper.Map<IEnumerable<ClubRecommendationModel>>(recommendations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting similar situation recommendations for user {UserId}", userId);
            throw;
        }
    }

    public async Task<ClubRecommendationModel?> GetMostRecentRecommendationAsync(int userId)
    {
        try
        {
            var recommendation = await _clubRecommendationRepository.GetMostRecentRecommendationAsync(userId);
            return recommendation != null ? _mapper.Map<ClubRecommendationModel>(recommendation) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting most recent recommendation for user {UserId}", userId);
            throw;
        }
    }

    private async Task<ClubRecommendationResult> GenerateAIRecommendationAsync(
        ClubRecommendationRequestModel request, 
        GolfContext golfContext, 
        IEnumerable<ClubRecommendation> similarSituations)
    {
        try
        {
            // Build comprehensive prompt for AI
            var prompt = BuildClubRecommendationPrompt(request, golfContext, similarSituations);

            // Prepare OpenAI messages
            var openAiMessages = new List<OpenAI.Chat.ChatMessage>
            {
                OpenAI.Chat.ChatMessage.CreateSystemMessage(GetClubRecommendationSystemPrompt()),
                OpenAI.Chat.ChatMessage.CreateUserMessage(prompt)
            };

            // Call OpenAI API
            var chatClient = _openAIClient.GetChatClient(_openAISettings.Model);
            var response = await chatClient.CompleteChatAsync(
                openAiMessages,
                new ChatCompletionOptions
                {
                    Temperature = (float)_openAISettings.Temperature,
                    MaxOutputTokenCount = 500 // Smaller limit for focused recommendations
                });

            if (response?.Value?.Content == null || response.Value.Content.Count == 0)
            {
                throw new InvalidOperationException("No response received from OpenAI");
            }

            var responseContent = string.Join("", response.Value.Content.Select(c => c.Text));
            
            // Parse AI response
            var aiResponse = JsonSerializer.Deserialize<AIClubRecommendationResponse>(responseContent);
            
            return new ClubRecommendationResult
            {
                Club = aiResponse?.RecommendedClub ?? "7 Iron",
                Reasoning = aiResponse?.Reasoning ?? "AI recommendation based on distance and conditions",
                Confidence = Math.Max(0.1, Math.Min(1.0, aiResponse?.Confidence ?? 0.8)),
                Alternatives = aiResponse?.Alternatives ?? new List<string>(),
                Strategy = aiResponse?.Strategy,
                Factors = new Dictionary<string, object>
                {
                    ["distance"] = request.DistanceToTarget,
                    ["conditions"] = request.WeatherConditions ?? "normal",
                    ["shotType"] = request.ShotType ?? "approach",
                    ["skillLevel"] = golfContext.User?.SkillLevel ?? "intermediate"
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI recommendation failed, falling back to basic algorithm");
            
            // Fallback to basic algorithm if AI fails
            return await _golfContextService.GetClubRecommendationAsync(golfContext, (double)request.DistanceToTarget, request.WeatherConditions);
        }
    }

    private static string GetClubRecommendationSystemPrompt()
    {
        return @"You are an expert golf caddie AI that provides intelligent club recommendations. 
Analyze the provided golf context, player information, distance, conditions, and historical data to recommend the optimal golf club.

Consider these factors:
- Distance to target (primary factor)
- Player skill level and tendencies
- Weather conditions (wind, temperature, humidity)
- Course conditions and lie
- Historical performance with similar shots
- Hole characteristics and strategy
- Player confidence with different clubs

Respond in JSON format with:
{
  ""recommendedClub"": ""Primary club recommendation"",
  ""confidence"": 0.85,
  ""reasoning"": ""Clear explanation of why this club was chosen"",
  ""alternatives"": [""Alternative club 1"", ""Alternative club 2""],
  ""strategy"": ""Shot strategy and course management advice""
}

Be specific, confident, and helpful. Focus on practical advice that will help the player succeed.";
    }

    private string BuildClubRecommendationPrompt(
        ClubRecommendationRequestModel request, 
        GolfContext golfContext, 
        IEnumerable<ClubRecommendation> similarSituations)
    {
        var prompt = $@"Club Recommendation Request:

Distance to Target: {request.DistanceToTarget} meters ({Math.Round(request.DistanceToTarget * 1.094m, 0)} yards)
Shot Type: {request.ShotType ?? "approach shot"}
Weather: {request.WeatherConditions ?? "normal conditions"}
Lie: {request.LieConditions ?? "fairway"}

Player Profile:
- Name: {golfContext.User?.Name ?? "Unknown"}
- Skill Level: {golfContext.User?.SkillLevel ?? "intermediate"}
- Handicap: {golfContext.User?.Handicap?.ToString() ?? "unknown"}
- Playing Style: {golfContext.User?.PlayingStyle ?? "unknown"}";

        if (golfContext.Course != null)
        {
            prompt += $@"

Course Context:
- Course: {golfContext.Course.Name}
- Difficulty: {golfContext.Course.Difficulty ?? "moderate"}
- Par: {golfContext.Course.ParTotal}";
        }

        if (golfContext.CurrentHole != null)
        {
            prompt += $@"

Current Hole:
- Hole {golfContext.CurrentHole.HoleNumber} - Par {golfContext.CurrentHole.Par}
- Distance: {golfContext.CurrentHole.Yardage ?? 0} yards
- Description: {golfContext.CurrentHole.Description ?? "Standard hole"}";
        }

        if (golfContext.Weather != null)
        {
            prompt += $@"

Weather Details:
- Conditions: {golfContext.Weather.Conditions ?? "clear"}
- Temperature: {golfContext.Weather.Temperature?.ToString() ?? "unknown"}°F
- Wind: {golfContext.Weather.WindSpeed?.ToString() ?? "0"} mph {golfContext.Weather.WindDirection ?? ""}";
        }

        if (similarSituations.Any())
        {
            prompt += $@"

Historical Performance (Similar Distances):
";
            foreach (var situation in similarSituations.Take(3))
            {
                prompt += $"- {situation.RecommendedClub}: {(situation.WasAccepted == true ? "Accepted" : situation.WasAccepted == false ? "Rejected" : "No feedback")}";
                if (!string.IsNullOrEmpty(situation.ActualClubUsed))
                {
                    prompt += $" (Used: {situation.ActualClubUsed})";
                }
                prompt += "\n";
            }
        }

        if (!string.IsNullOrEmpty(request.PlayerNotes))
        {
            prompt += $@"

Player Notes: {request.PlayerNotes}";
        }

        prompt += @"

Please provide your club recommendation considering all these factors.";

        return prompt;
    }

    private class AIClubRecommendationResponse
    {
        public string? RecommendedClub { get; set; }
        public double Confidence { get; set; }
        public string? Reasoning { get; set; }
        public List<string>? Alternatives { get; set; }
        public string? Strategy { get; set; }
    }
}