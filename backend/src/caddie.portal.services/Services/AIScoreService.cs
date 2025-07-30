using caddie.portal.dal.Repositories.Interfaces;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using Microsoft.Extensions.Logging;
using NetTopologySuite.Geometries;

namespace caddie.portal.services.Services;

/// <summary>
/// AI-powered automatic score recording and validation service
/// </summary>
public class AIScoreService : IAIScoreService
{
    private readonly IRoundRepository _roundRepository;
    private readonly IHoleRepository _holeRepository; 
    private readonly IOpenAIService _openAIService;
    private readonly ILogger<AIScoreService> _logger;

    // Constants for score detection thresholds
    private const decimal HOLE_COMPLETION_DISTANCE_THRESHOLD = 5.0m; // 5 meters from hole
    private const decimal GREEN_DETECTION_DISTANCE_THRESHOLD = 20.0m; // 20 meters from pin
    private const decimal HIGH_CONFIDENCE_THRESHOLD = 0.8m;
    private const decimal MEDIUM_CONFIDENCE_THRESHOLD = 0.6m;
    private const int MAX_REASONABLE_SCORE = 12; // Maximum reasonable score for a hole

    public AIScoreService(
        IRoundRepository roundRepository,
        IHoleRepository holeRepository,
        IOpenAIService openAIService,
        ILogger<AIScoreService> logger)
    {
        _roundRepository = roundRepository;
        _holeRepository = holeRepository;
        _openAIService = openAIService;
        _logger = logger;
    }

    /// <summary>
    /// Automatically detect and record hole score based on shot events and location data
    /// </summary>
    public async Task<AutoScoreResult> ProcessHoleCompletionAsync(int userId, int roundId, int holeNumber, 
        IEnumerable<object> shotEvents, object finalLocation)
    {
        try
        {
            _logger.LogInformation($"Processing hole completion for user {userId}, round {roundId}, hole {holeNumber}");

            var result = new AutoScoreResult
            {
                ProcessedAt = DateTime.UtcNow
            };

            // Get hole information
            var round = await _roundRepository.GetByIdAsync(roundId);
            if (round == null)
            {
                result.DetectionReasons.Add("Round not found");
                return result;
            }

            var hole = await _holeRepository.GetHoleByNumberAsync(round.CourseId, holeNumber);
            if (hole == null)
            {
                result.DetectionReasons.Add("Hole information not found");
                return result;
            }

            // Analyze location data for hole completion
            var locationAnalysis = await AnalyzeHoleCompletionAsync(round.CourseId, holeNumber, 
                ParseLocationContext(finalLocation));

            result.HoleCompleted = locationAnalysis.IsNearHole;
            result.DistanceToHole = locationAnalysis.DistanceToHole;

            if (!result.HoleCompleted)
            {
                result.DetectionReasons.Add($"Player not near hole (distance: {locationAnalysis.DistanceToHole:F1}m)");
                result.RequiresConfirmation = true;
                return result;
            }

            // Process shot events to determine score
            var shotSummaries = ProcessShotEvents(shotEvents);
            result.ShotEvents = shotSummaries;

            // Calculate detected score based on shot count
            var detectedScore = CalculateScoreFromShots(shotSummaries, hole.Par);
            result.DetectedScore = detectedScore;

            // Calculate confidence based on various factors
            result.Confidence = CalculateDetectionConfidence(shotSummaries, locationAnalysis, hole);

            // Determine if confirmation is required
            result.RequiresConfirmation = ShouldRequireConfirmation(result.Confidence, detectedScore, hole.Par);

            // Add detection reasoning
            AddDetectionReasons(result, shotSummaries, locationAnalysis, hole);

            // Generate AI commentary
            if (result.HoleCompleted && result.Confidence >= MEDIUM_CONFIDENCE_THRESHOLD)
            {
                result.Commentary = await GenerateScoreCommentaryAsync(userId, roundId, holeNumber, 
                    result.DetectedScore, hole.Par);
            }

            _logger.LogInformation($"Hole completion processed: Score {result.DetectedScore}, Confidence {result.Confidence:F2}");

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error processing hole completion for user {userId}, round {roundId}, hole {holeNumber}");
            return new AutoScoreResult
            {
                HoleCompleted = false,
                DetectionReasons = { "Error processing hole completion" },
                RequiresConfirmation = true,
                ProcessedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Validate and confirm an AI-detected score
    /// </summary>
    public async Task<ScoreValidationResult> ValidateAndRecordScoreAsync(int userId, int roundId, int holeNumber, 
        int detectedScore, int? userConfirmedScore = null)
    {
        try
        {
            var result = new ScoreValidationResult
            {
                OriginalDetectedScore = detectedScore
            };

            // Use user-confirmed score if provided, otherwise use detected score
            var finalScore = userConfirmedScore ?? detectedScore;
            result.FinalScore = finalScore;
            result.UserCorrected = userConfirmedScore.HasValue && userConfirmedScore != detectedScore;

            // Validate score reasonableness
            var validationNotes = ValidateScoreReasonableness(finalScore, holeNumber);
            result.ValidationNotes.AddRange(validationNotes);

            // Calculate validation confidence
            result.ValidationConfidence = CalculateValidationConfidence(detectedScore, finalScore, result.UserCorrected);

            // Record the score in the database
            try
            {
                await _roundRepository.UpdateHoleScoreAsync(roundId, holeNumber, finalScore);
                result.RecordingSuccessful = true;
                result.ValidationNotes.Add("Score successfully recorded");

                // Generate commentary for the final score
                result.Commentary = await GenerateScoreCommentaryAsync(userId, roundId, holeNumber, finalScore, 
                    await GetHoleParAsync(roundId, holeNumber));

                _logger.LogInformation($"Score validated and recorded: User {userId}, Round {roundId}, Hole {holeNumber}, Score {finalScore}");
            }
            catch (Exception ex)
            {
                result.RecordingSuccessful = false;
                result.ValidationNotes.Add($"Failed to record score: {ex.Message}");
                _logger.LogError(ex, $"Failed to record score for user {userId}, round {roundId}, hole {holeNumber}");
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error validating score for user {userId}, round {roundId}, hole {holeNumber}");
            return new ScoreValidationResult
            {
                OriginalDetectedScore = detectedScore,
                FinalScore = detectedScore,
                RecordingSuccessful = false,
                ValidationNotes = { "Error during score validation" }
            };
        }
    }

    /// <summary>
    /// Get score suggestions for a hole based on shot analysis
    /// </summary>
    public async Task<ScoreSuggestion> GetScoreSuggestionAsync(int userId, int roundId, int holeNumber)
    {
        try
        {
            // This would analyze recent shot events and location data to suggest a score
            // For now, return a basic implementation
            var round = await _roundRepository.GetByIdAsync(roundId);
            var hole = await _holeRepository.GetHoleByNumberAsync(round?.CourseId ?? 0, holeNumber);

            return new ScoreSuggestion
            {
                SuggestedScore = hole?.Par ?? 4, // Default suggestion
                Confidence = 0.5m,
                AlternativeScores = { (hole?.Par ?? 4) + 1, (hole?.Par ?? 4) + 2 },
                Reasoning = { "Based on typical scoring patterns" },
                DetectedShotCount = 0,
                NotableEvents = { "Insufficient data for detailed analysis" }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting score suggestion for user {userId}, round {roundId}, hole {holeNumber}");
            return new ScoreSuggestion
            {
                SuggestedScore = 4,
                Confidence = 0.1m,
                Reasoning = { "Error occurred during analysis" }
            };
        }
    }

    /// <summary>
    /// Analyze hole completion based on GPS location and course layout
    /// </summary>
    public async Task<HoleCompletionAnalysis> AnalyzeHoleCompletionAsync(int courseId, int holeNumber, 
        Models.LocationContext currentLocation)
    {
        try
        {
            var hole = await _holeRepository.GetHoleByNumberAsync(courseId, holeNumber);
            if (hole == null)
            {
                return new HoleCompletionAnalysis
                {
                    IsNearHole = false,
                    DistanceToHole = 999,
                    CompletionConfidence = 0,
                    RecommendedAction = "Hole information not available",
                    AnalysisNotes = { "Unable to find hole information" }
                };
            }

            // Calculate distance to pin
            var playerLocation = new Point((double)currentLocation.Longitude, (double)currentLocation.Latitude);
            var distanceToPin = (decimal)playerLocation.Distance(hole.PinLocation);

            var analysis = new HoleCompletionAnalysis
            {
                DistanceToHole = distanceToPin,
                IsNearHole = distanceToPin <= HOLE_COMPLETION_DISTANCE_THRESHOLD,
                IsOnGreen = distanceToPin <= GREEN_DETECTION_DISTANCE_THRESHOLD
            };

            // Calculate completion confidence
            if (analysis.IsNearHole)
            {
                analysis.CompletionConfidence = 0.9m;
                analysis.RecommendedAction = "Hole appears completed - confirm your score";
                analysis.AnalysisNotes.Add($"Within {HOLE_COMPLETION_DISTANCE_THRESHOLD}m of pin");
            }
            else if (analysis.IsOnGreen)
            {
                analysis.CompletionConfidence = 0.6m;
                analysis.RecommendedAction = "On the green - continue putting";
                analysis.AnalysisNotes.Add($"On green, {distanceToPin:F1}m from pin");
            }
            else
            {
                analysis.CompletionConfidence = 0.2m;
                analysis.RecommendedAction = "Continue playing towards the hole";
                analysis.AnalysisNotes.Add($"{distanceToPin:F1}m from pin");
            }

            return analysis;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error analyzing hole completion for course {courseId}, hole {holeNumber}");
            return new HoleCompletionAnalysis
            {
                IsNearHole = false,
                DistanceToHole = 999,
                CompletionConfidence = 0,
                RecommendedAction = "Unable to analyze hole completion",
                AnalysisNotes = { "Error during analysis" }
            };
        }
    }

    /// <summary>
    /// Generate AI commentary for a score
    /// </summary>
    public async Task<string> GenerateScoreCommentaryAsync(int userId, int roundId, int holeNumber, int score, int par)
    {
        try
        {
            return await _openAIService.GenerateHoleCompletionCommentaryAsync(userId, roundId, holeNumber, score, par);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error generating score commentary for user {userId}, round {roundId}, hole {holeNumber}");
            
            // Provide fallback commentary
            var scoreDifference = score - par;
            return scoreDifference switch
            {
                -2 => "Eagle! Outstanding play on that hole!",
                -1 => "Birdie! Nice work out there!",
                0 => "Par - solid, consistent golf!",
                1 => "Bogey, but keep your head up - plenty of holes left!",
                2 => "Double bogey, but everyone has tough holes. Stay focused!",
                _ => scoreDifference > 2 ? "Tough hole, but that's golf! On to the next one!" : "Great hole!"
            };
        }
    }

    /// <summary>
    /// Get AI scoring statistics for a user
    /// </summary>
    public async Task<AIScoreStatistics> GetScoringStatisticsAsync(int userId, DateTime? fromDate = null)
    {
        await Task.CompletedTask; // Remove async warning
        
        try
        {
            var startDate = fromDate ?? DateTime.UtcNow.AddMonths(-3);
            
            // This would query actual statistics from the database
            // For now, return placeholder statistics
            return new AIScoreStatistics
            {
                TotalHolesWithAIScoring = 0,
                AccuracyPercentage = 0,
                AverageConfidence = 0,
                UserCorrections = 0,
                CorrectionRate = 0,
                CommonCorrectionReasons = { "Insufficient historical data" },
                FromDate = startDate,
                ToDate = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting scoring statistics for user {userId}");
            return new AIScoreStatistics
            {
                FromDate = fromDate ?? DateTime.UtcNow.AddMonths(-3),
                ToDate = DateTime.UtcNow,
                CommonCorrectionReasons = { "Error retrieving statistics" }
            };
        }
    }

    // Private helper methods

    private Models.LocationContext ParseLocationContext(object locationData)
    {
        // This would parse the location data from the API request
        // For now, return a default context
        return new Models.LocationContext
        {
            Latitude = 0,
            Longitude = 0
        };
    }

    private List<ShotEventSummary> ProcessShotEvents(IEnumerable<object> shotEvents)
    {
        // This would process the shot events from GPS tracking
        // For now, return empty list
        return new List<ShotEventSummary>();
    }

    private int CalculateScoreFromShots(List<ShotEventSummary> shots, int par)
    {
        if (shots.Count == 0) return par; // Default to par if no shots detected
        
        // Use shot count as the score
        var shotCount = shots.Count;
        
        // Cap at reasonable maximum
        return Math.Min(shotCount, MAX_REASONABLE_SCORE);
    }

    private decimal CalculateDetectionConfidence(List<ShotEventSummary> shots, 
        HoleCompletionAnalysis locationAnalysis, object hole)
    {
        var confidence = 0.5m; // Base confidence
        
        // Increase confidence if near hole
        if (locationAnalysis.IsNearHole)
            confidence += 0.3m;
        
        // Increase confidence if we have shot data
        if (shots.Count > 0)
            confidence += 0.2m;
        
        return Math.Min(confidence, 1.0m);
    }

    private bool ShouldRequireConfirmation(decimal confidence, int score, int par)
    {
        // Require confirmation for low confidence or unusual scores
        return confidence < HIGH_CONFIDENCE_THRESHOLD || 
               Math.Abs(score - par) > 3;
    }

    private void AddDetectionReasons(AutoScoreResult result, List<ShotEventSummary> shots, 
        HoleCompletionAnalysis locationAnalysis, object hole)
    {
        if (locationAnalysis.IsNearHole)
            result.DetectionReasons.Add("Player is near the hole");
        
        if (shots.Count > 0)
            result.DetectionReasons.Add($"Detected {shots.Count} shots");
        else
            result.DetectionReasons.Add("No shot events detected - using location analysis");
    }

    private List<string> ValidateScoreReasonableness(int score, int holeNumber)
    {
        var notes = new List<string>();
        
        if (score < 1)
            notes.Add("Score cannot be less than 1");
        else if (score > MAX_REASONABLE_SCORE)
            notes.Add($"Score unusually high (>{MAX_REASONABLE_SCORE})");
        else
            notes.Add("Score within reasonable range");
        
        return notes;
    }

    private decimal CalculateValidationConfidence(int detectedScore, int finalScore, bool userCorrected)
    {
        if (!userCorrected) return 0.9m; // High confidence if user didn't correct
        
        var difference = Math.Abs(detectedScore - finalScore);
        return difference switch
        {
            0 => 0.9m,
            1 => 0.7m,
            2 => 0.5m,
            _ => 0.3m
        };
    }

    private async Task<int> GetHoleParAsync(int roundId, int holeNumber)
    {
        try
        {
            var round = await _roundRepository.GetByIdAsync(roundId);
            var hole = await _holeRepository.GetHoleByNumberAsync(round?.CourseId ?? 0, holeNumber);
            return hole?.Par ?? 4;
        }
        catch
        {
            return 4; // Default par
        }
    }
}

