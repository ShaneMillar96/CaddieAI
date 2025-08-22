using Microsoft.Extensions.Logging;
using AutoMapper;
using caddie.portal.dal.Repositories.Interfaces;
using caddie.portal.dal.Models;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using caddie.portal.dal.Enums;

namespace caddie.portal.services.Services;

/// <summary>
/// Service implementation for swing analysis business logic operations
/// </summary>
public class SwingAnalysisService : ISwingAnalysisService
{
    private readonly ISwingAnalysisRepository _swingAnalysisRepository;
    private readonly IRoundRepository _roundRepository;
    private readonly IHoleRepository _holeRepository;
    private readonly IGarminDeviceRepository _garminDeviceRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<SwingAnalysisService> _logger;

    public SwingAnalysisService(
        ISwingAnalysisRepository swingAnalysisRepository,
        IRoundRepository roundRepository,
        IHoleRepository holeRepository,
        IGarminDeviceRepository garminDeviceRepository,
        IMapper mapper,
        ILogger<SwingAnalysisService> logger)
    {
        _swingAnalysisRepository = swingAnalysisRepository;
        _roundRepository = roundRepository;
        _holeRepository = holeRepository;
        _garminDeviceRepository = garminDeviceRepository;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get swing analysis by ID
    /// </summary>
    public async Task<SwingAnalysisModel?> GetByIdAsync(int id)
    {
        try
        {
            var swingAnalysis = await _swingAnalysisRepository.GetByIdAsync(id);
            return _mapper.Map<SwingAnalysisModel>(swingAnalysis);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting swing analysis {SwingAnalysisId}", id);
            throw;
        }
    }

    /// <summary>
    /// Get swing analyses for a user's round
    /// </summary>
    public async Task<IEnumerable<SwingAnalysisModel>> GetByUserIdAndRoundIdAsync(int userId, int roundId)
    {
        try
        {
            var swingAnalyses = await _swingAnalysisRepository.GetByUserIdAndRoundIdAsync(userId, roundId);
            return _mapper.Map<IEnumerable<SwingAnalysisModel>>(swingAnalyses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting swing analyses for user {UserId} and round {RoundId}", userId, roundId);
            throw;
        }
    }

    /// <summary>
    /// Get all swing analyses for a user
    /// </summary>
    public async Task<IEnumerable<SwingAnalysisModel>> GetByUserIdAsync(int userId)
    {
        try
        {
            var swingAnalyses = await _swingAnalysisRepository.GetByUserIdAsync(userId);
            return _mapper.Map<IEnumerable<SwingAnalysisModel>>(swingAnalyses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting swing analyses for user {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Get swing analyses by detection source
    /// </summary>
    public async Task<IEnumerable<SwingAnalysisModel>> GetByDetectionSourceAsync(int userId, string detectionSource)
    {
        try
        {
            var swingAnalyses = await _swingAnalysisRepository.GetByDetectionSourceAsync(userId, detectionSource);
            return _mapper.Map<IEnumerable<SwingAnalysisModel>>(swingAnalyses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting swing analyses for user {UserId} by detection source {DetectionSource}", userId, detectionSource);
            throw;
        }
    }

    /// <summary>
    /// Create a new swing analysis
    /// </summary>
    public async Task<SwingAnalysisModel> CreateAsync(CreateSwingAnalysisModel model)
    {
        try
        {
            // Log the incoming model for debugging
            _logger.LogInformation("Creating swing analysis with data: {@SwingAnalysisModel}", new {
                model.UserId,
                model.RoundId,
                model.HoleId,
                model.DetectionSource,
                model.DetectionConfidence,
                model.SwingSpeedMph,
                model.DeviceModel,
                model.GarminDeviceId
            });

            // Validate the model
            var validation = await ValidateSwingAnalysisAsync(model);
            if (!validation.IsValid)
            {
                _logger.LogError("Swing analysis validation failed for user {UserId}, round {RoundId}: {ValidationErrors}", 
                    model.UserId, model.RoundId, string.Join(", ", validation.ValidationErrors));
                throw new ArgumentException($"Invalid swing analysis data: {string.Join(", ", validation.ValidationErrors)}");
            }

            // Handle GarminDeviceId based on detection source
            await HandleGarminDeviceIdAsync(model);

            var swingAnalysis = _mapper.Map<SwingAnalysis>(model);
            var createdSwingAnalysis = await _swingAnalysisRepository.CreateAsync(swingAnalysis);

            _logger.LogInformation("Created swing analysis {SwingAnalysisId} for user {UserId} in round {RoundId} with GarminDeviceId {GarminDeviceId}", 
                createdSwingAnalysis.Id, model.UserId, model.RoundId, createdSwingAnalysis.GarminDeviceId);

            return _mapper.Map<SwingAnalysisModel>(createdSwingAnalysis);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating swing analysis for user {UserId} in round {RoundId}", model.UserId, model.RoundId);
            throw;
        }
    }

    /// <summary>
    /// Update an existing swing analysis
    /// </summary>
    public async Task<SwingAnalysisModel?> UpdateAsync(int id, UpdateSwingAnalysisModel model)
    {
        try
        {
            var existingSwingAnalysis = await _swingAnalysisRepository.GetByIdAsync(id);
            if (existingSwingAnalysis == null)
            {
                return null;
            }

            // Apply updates
            _mapper.Map(model, existingSwingAnalysis);
            
            var updatedSwingAnalysis = await _swingAnalysisRepository.UpdateAsync(existingSwingAnalysis);

            _logger.LogInformation("Updated swing analysis {SwingAnalysisId}", id);

            return _mapper.Map<SwingAnalysisModel>(updatedSwingAnalysis);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating swing analysis {SwingAnalysisId}", id);
            throw;
        }
    }

    /// <summary>
    /// Delete a swing analysis
    /// </summary>
    public async Task<bool> DeleteAsync(int id, int userId)
    {
        try
        {
            // Verify user has access
            if (!await HasUserAccessAsync(id, userId))
            {
                _logger.LogWarning("User {UserId} attempted to delete swing analysis {SwingAnalysisId} without access", userId, id);
                return false;
            }

            var deleted = await _swingAnalysisRepository.DeleteAsync(id);
            
            if (deleted)
            {
                _logger.LogInformation("Deleted swing analysis {SwingAnalysisId} by user {UserId}", id, userId);
            }

            return deleted;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting swing analysis {SwingAnalysisId} by user {UserId}", id, userId);
            throw;
        }
    }

    /// <summary>
    /// Get swing analysis statistics for a user
    /// </summary>
    public async Task<SwingAnalysisStatsModel> GetStatsAsync(int userId)
    {
        try
        {
            var stats = await _swingAnalysisRepository.GetStatsAsync(userId);
            return _mapper.Map<SwingAnalysisStatsModel>(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting swing analysis stats for user {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Get round-specific swing analysis summary
    /// </summary>
    public async Task<RoundSwingAnalysisSummaryModel> GetRoundSummaryAsync(int userId, int roundId)
    {
        try
        {
            var swingAnalyses = await _swingAnalysisRepository.GetByUserIdAndRoundIdAsync(userId, roundId);
            var swingModels = _mapper.Map<List<SwingAnalysisModel>>(swingAnalyses);

            var summary = new RoundSwingAnalysisSummaryModel
            {
                RoundId = roundId,
                TotalSwings = swingModels.Count,
                Swings = swingModels
            };

            // Calculate statistics
            if (swingModels.Any())
            {
                var swingsWithSpeed = swingModels.Where(s => s.SwingSpeedMph.HasValue).ToList();
                var swingsWithQuality = swingModels.Where(s => s.SwingQualityScore.HasValue).ToList();

                summary.AverageSwingSpeed = swingsWithSpeed.Any() ? 
                    swingsWithSpeed.Average(s => s.SwingSpeedMph!.Value) : null;
                summary.BestSwingSpeed = swingsWithSpeed.Any() ? 
                    swingsWithSpeed.Max(s => s.SwingSpeedMph!.Value) : null;
                summary.AverageQualityScore = swingsWithQuality.Any() ? 
                    swingsWithQuality.Average(s => s.SwingQualityScore!.Value) : null;
                summary.BestQualityScore = swingsWithQuality.Any() ? 
                    swingsWithQuality.Max(s => s.SwingQualityScore!.Value) : null;

                // Group by club and detection source
                summary.SwingsByClub = swingModels
                    .Where(s => !string.IsNullOrEmpty(s.ClubUsed))
                    .GroupBy(s => s.ClubUsed!)
                    .ToDictionary(g => g.Key, g => g.Count());

                summary.SwingsByDetectionSource = swingModels
                    .GroupBy(s => s.DetectionSource)
                    .ToDictionary(g => g.Key, g => g.Count());
            }

            return summary;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting round swing analysis summary for user {UserId} and round {RoundId}", userId, roundId);
            throw;
        }
    }

    /// <summary>
    /// Validate swing analysis data before creation
    /// </summary>
    public async Task<(bool IsValid, List<string> ValidationErrors)> ValidateSwingAnalysisAsync(CreateSwingAnalysisModel model)
    {
        var errors = new List<string>();

        try
        {
            // Check if round exists and belongs to user
            var round = await _roundRepository.GetByIdAsync(model.RoundId);
            _logger.LogInformation("Validating round {RoundId}: Found={Found}, UserId={RoundUserId}, StatusId={StatusId}", 
                model.RoundId, round != null, round?.UserId, round?.StatusId);
            
            if (round == null)
            {
                errors.Add("Round not found");
            }
            else if (round.UserId != model.UserId)
            {
                errors.Add("Round does not belong to the specified user");
            }
            else
            {
                // Allow swing analysis creation regardless of round status for now
                // This provides flexibility for the mobile app to create historical swing data
                if (round.StatusId != (int)caddie.portal.dal.Enums.RoundStatus.InProgress)
                {
                    _logger.LogInformation("Creating swing analysis for round {RoundId} with status {StatusId} (not InProgress)", 
                        model.RoundId, round.StatusId);
                }
            }

            // Check if hole exists (if specified)
            if (model.HoleId.HasValue)
            {
                var hole = await _holeRepository.GetByIdAsync(model.HoleId.Value);
                if (hole == null)
                {
                    errors.Add("Hole not found");
                }
                else if (round?.CourseId != hole.CourseId)
                {
                    errors.Add("Hole does not belong to the round's course");
                }
            }

            // Validate swing metrics ranges
            if (model.SwingSpeedMph.HasValue && (model.SwingSpeedMph < 40 || model.SwingSpeedMph > 150))
            {
                errors.Add("Swing speed must be between 40 and 150 mph");
            }

            if (model.DetectionConfidence.HasValue && (model.DetectionConfidence < 0 || model.DetectionConfidence > 1))
            {
                errors.Add("Detection confidence must be between 0.0 and 1.0");
            }

            if (model.SwingQualityScore.HasValue && (model.SwingQualityScore < 0 || model.SwingQualityScore > 10))
            {
                errors.Add("Swing quality score must be between 0 and 10");
            }

            // Validate detection source
            var validSources = new[] { "garmin", "mobile" };
            if (!validSources.Contains(model.DetectionSource?.ToLower()))
            {
                errors.Add("Detection source must be 'garmin' or 'mobile'");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating swing analysis for user {UserId} and round {RoundId}", model.UserId, model.RoundId);
            errors.Add("Validation error occurred");
        }

        return (errors.Count == 0, errors);
    }

    /// <summary>
    /// Check if user has permission to access swing analysis
    /// </summary>
    public async Task<bool> HasUserAccessAsync(int swingAnalysisId, int userId)
    {
        try
        {
            var swingAnalysis = await _swingAnalysisRepository.GetByIdAsync(swingAnalysisId);
            return swingAnalysis?.UserId == userId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking user access for swing analysis {SwingAnalysisId} and user {UserId}", swingAnalysisId, userId);
            return false;
        }
    }

    /// <summary>
    /// Generate AI feedback for a swing analysis (placeholder implementation)
    /// </summary>
    public async Task<SwingAnalysisModel?> GenerateAiFeedbackAsync(int swingAnalysisId)
    {
        try
        {
            var swingAnalysis = await _swingAnalysisRepository.GetByIdAsync(swingAnalysisId);
            if (swingAnalysis == null)
            {
                return null;
            }

            // TODO: Integrate with OpenAI service to generate actual feedback
            // For now, provide basic feedback based on swing metrics
            var feedback = GenerateBasicFeedback(swingAnalysis);
            
            swingAnalysis.AiFeedback = feedback;
            var updatedSwingAnalysis = await _swingAnalysisRepository.UpdateAsync(swingAnalysis);

            return _mapper.Map<SwingAnalysisModel>(updatedSwingAnalysis);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating AI feedback for swing analysis {SwingAnalysisId}", swingAnalysisId);
            throw;
        }
    }

    /// <summary>
    /// Compare swing to a template or pro swing (placeholder implementation)
    /// </summary>
    public async Task<SwingAnalysisModel?> CompareToTemplateAsync(int swingAnalysisId, string templateName)
    {
        try
        {
            var swingAnalysis = await _swingAnalysisRepository.GetByIdAsync(swingAnalysisId);
            if (swingAnalysis == null)
            {
                return null;
            }

            // TODO: Implement actual template comparison logic
            swingAnalysis.ComparedToTemplate = templateName;
            var updatedSwingAnalysis = await _swingAnalysisRepository.UpdateAsync(swingAnalysis);

            return _mapper.Map<SwingAnalysisModel>(updatedSwingAnalysis);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error comparing swing analysis {SwingAnalysisId} to template {TemplateName}", swingAnalysisId, templateName);
            throw;
        }
    }

    /// <summary>
    /// Get recent swing trends for a user
    /// </summary>
    public async Task<Dictionary<DateTime, SwingAnalysisStatsModel>> GetSwingTrendsAsync(int userId, int days = 30)
    {
        try
        {
            var swingAnalyses = await _swingAnalysisRepository.GetByUserIdAsync(userId);
            var cutoffDate = DateTime.UtcNow.AddDays(-days);
            
            var trendsData = swingAnalyses
                .Where(s => (s.DetectedAt ?? s.CreatedAt) >= cutoffDate)
                .GroupBy(s => (s.DetectedAt ?? s.CreatedAt)!.Value.Date)
                .ToDictionary(
                    g => g.Key,
                    g => new SwingAnalysisStatsModel
                    {
                        TotalSwings = g.Count(),
                        AverageSwingSpeed = g.Where(s => s.SwingSpeedMph.HasValue)
                            .Select(s => s.SwingSpeedMph!.Value).DefaultIfEmpty(0).Average(),
                        AverageQualityScore = g.Where(s => s.SwingQualityScore.HasValue)
                            .Select(s => s.SwingQualityScore!.Value).DefaultIfEmpty(0).Average(),
                        GarminSwings = g.Count(s => s.DetectionSource == "garmin"),
                        MobileSwings = g.Count(s => s.DetectionSource == "mobile"),
                        LastSwingDate = g.Max(s => s.DetectedAt ?? s.CreatedAt)
                    });

            return trendsData;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting swing trends for user {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Generate basic feedback based on swing metrics
    /// </summary>
    private string GenerateBasicFeedback(SwingAnalysis swingAnalysis)
    {
        var feedback = new List<string>();

        if (swingAnalysis.SwingSpeedMph.HasValue)
        {
            var speed = swingAnalysis.SwingSpeedMph.Value;
            if (speed < 70)
            {
                feedback.Add("Consider working on generating more clubhead speed through proper weight transfer and rotation.");
            }
            else if (speed > 120)
            {
                feedback.Add("Great clubhead speed! Focus on maintaining accuracy and consistency.");
            }
            else
            {
                feedback.Add("Good clubhead speed. Continue to work on timing and tempo for consistency.");
            }
        }

        if (swingAnalysis.SwingQualityScore.HasValue)
        {
            var quality = swingAnalysis.SwingQualityScore.Value;
            if (quality < 5)
            {
                feedback.Add("There's room for improvement in swing technique. Consider working with a golf professional.");
            }
            else if (quality >= 8)
            {
                feedback.Add("Excellent swing quality! Keep up the great work.");
            }
        }

        return feedback.Any() ? string.Join(" ", feedback) : "Swing recorded successfully.";
    }

    /// <summary>
    /// Handle GarminDeviceId assignment based on detection source
    /// </summary>
    /// <param name="model">Create swing analysis model</param>
    private async Task HandleGarminDeviceIdAsync(CreateSwingAnalysisModel model)
    {
        try
        {
            // If detection source is mobile, ensure GarminDeviceId is null
            if (model.DetectionSource?.ToLower() == "mobile")
            {
                model.GarminDeviceId = null;
                _logger.LogDebug("Mobile detection source - GarminDeviceId set to null for user {UserId}", model.UserId);
                return;
            }

            // If detection source is garmin, try to set GarminDeviceId
            if (model.DetectionSource?.ToLower() == "garmin")
            {
                // If GarminDeviceId is already provided, validate it exists and belongs to user
                if (model.GarminDeviceId.HasValue)
                {
                    var existingDevice = await _garminDeviceRepository.GetByIdAsync(model.GarminDeviceId.Value);
                    if (existingDevice == null || existingDevice.UserId != model.UserId)
                    {
                        _logger.LogWarning("Invalid GarminDeviceId {GarminDeviceId} provided for user {UserId} - resetting to null", 
                            model.GarminDeviceId.Value, model.UserId);
                        model.GarminDeviceId = null;
                    }
                    else
                    {
                        _logger.LogDebug("Using provided GarminDeviceId {GarminDeviceId} for user {UserId}", 
                            model.GarminDeviceId.Value, model.UserId);
                    }
                }
                else
                {
                    // Try to find user's preferred Garmin device
                    var preferredDevice = await _garminDeviceRepository.GetPreferredDeviceAsync(model.UserId);
                    if (preferredDevice != null)
                    {
                        model.GarminDeviceId = preferredDevice.Id;
                        _logger.LogDebug("Using preferred GarminDeviceId {GarminDeviceId} for user {UserId}", 
                            preferredDevice.Id, model.UserId);
                    }
                    else
                    {
                        // Try to find any connected Garmin device for the user
                        var connectedDevices = await _garminDeviceRepository.GetConnectedDevicesAsync(model.UserId);
                        var firstConnectedDevice = connectedDevices.FirstOrDefault();
                        if (firstConnectedDevice != null)
                        {
                            model.GarminDeviceId = firstConnectedDevice.Id;
                            _logger.LogDebug("Using first connected GarminDeviceId {GarminDeviceId} for user {UserId}", 
                                firstConnectedDevice.Id, model.UserId);
                        }
                        else
                        {
                            // No Garmin devices found, but we don't fail the swing creation
                            model.GarminDeviceId = null;
                            _logger.LogDebug("No connected Garmin devices found for user {UserId} - GarminDeviceId set to null", model.UserId);
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            // If there's any error with Garmin device lookup, don't fail the swing analysis creation
            // Just log the error and continue with null GarminDeviceId
            _logger.LogWarning(ex, "Error handling GarminDeviceId for user {UserId} - continuing with null GarminDeviceId", model.UserId);
            model.GarminDeviceId = null;
        }
    }
}