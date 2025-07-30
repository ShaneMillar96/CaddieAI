using Microsoft.Extensions.Logging;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using caddie.portal.dal.Repositories.Interfaces;
using caddie.portal.dal.Models;
using Microsoft.EntityFrameworkCore;

namespace caddie.portal.services.Services;

/// <summary>
/// Service for real-time GPS location tracking and course position analysis
/// </summary>
public class LocationTrackingService : ILocationTrackingService
{
    private readonly ILocationRepository _locationRepository;
    private readonly ICourseRepository _courseRepository;
    private readonly IHoleRepository _holeRepository;
    private readonly IRoundRepository _roundRepository;
    private readonly IOpenAIService _openAIService;
    private readonly ILogger<LocationTrackingService> _logger;

    // Golf course constants
    private const decimal COURSE_BOUNDARY_BUFFER_METERS = 50; // Buffer around course boundaries
    private const decimal TEE_AREA_RADIUS_METERS = 20; // Radius of tee area
    private const decimal GREEN_AREA_RADIUS_METERS = 25; // Radius of green area
    private const decimal FAIRWAY_WIDTH_METERS = 35; // Typical fairway width
    private const decimal SHOT_DETECTION_MIN_DISTANCE = 20; // Minimum distance to consider a shot
    private const decimal SHOT_DETECTION_MAX_WALKING_SPEED = 2.0m; // Max walking speed in m/s
    private const int LOCATION_HISTORY_LIMIT_MINUTES = 120; // Keep 2 hours of history

    public LocationTrackingService(
        ILocationRepository locationRepository,
        ICourseRepository courseRepository,
        IHoleRepository holeRepository,
        IRoundRepository roundRepository,
        IOpenAIService openAIService,
        ILogger<LocationTrackingService> logger)
    {
        _locationRepository = locationRepository;
        _courseRepository = courseRepository;
        _holeRepository = holeRepository;
        _roundRepository = roundRepository;
        _openAIService = openAIService;
        _logger = logger;
    }

    public async Task<LocationProcessingResult> ProcessLocationUpdateAsync(int userId, int roundId, Models.LocationContext locationData)
    {
        try
        {
            var result = new LocationProcessingResult();

            // Get round information
            var round = await _roundRepository.GetByIdAsync(roundId);
            if (round == null)
            {
                result.Success = false;
                result.Messages.Add("Round not found");
                return result;
            }

            // Store location in database
            var location = new Location
            {
                UserId = userId,
                RoundId = roundId,
                CourseId = round.CourseId,
                Latitude = locationData.Latitude,
                Longitude = locationData.Longitude,
                AccuracyMeters = locationData.AccuracyMeters,
                MovementSpeedMps = locationData.MovementSpeedMps,
                Timestamp = locationData.Timestamp
            };

            // Detect current hole
            result.DetectedHole = await DetectCurrentHoleAsync(round.CourseId, locationData.Latitude, locationData.Longitude);
            location.CurrentHoleDetected = result.DetectedHole;

            // Calculate distances
            if (result.DetectedHole.HasValue)
            {
                result.DistanceToPin = await CalculateDistanceToPinAsync(
                    round.CourseId, 
                    result.DetectedHole.Value, 
                    locationData.Latitude, 
                    locationData.Longitude
                );
                
                result.DistanceToTee = await CalculateDistanceToTeeAsync(
                    round.CourseId, 
                    result.DetectedHole.Value, 
                    locationData.Latitude, 
                    locationData.Longitude
                );

                location.DistanceToPinMeters = result.DistanceToPin;
                location.DistanceToTeeMeters = result.DistanceToTee;

                // Determine position on hole
                result.PositionOnHole = await DeterminePositionOnHoleAsync(
                    round.CourseId, 
                    result.DetectedHole.Value, 
                    locationData.Latitude, 
                    locationData.Longitude
                );
                location.PositionOnHole = result.PositionOnHole;
            }

            // Check course boundaries
            result.IsWithinBoundaries = await IsWithinCourseBoundariesAsync(
                round.CourseId, 
                locationData.Latitude, 
                locationData.Longitude
            );
            location.CourseBoundaryStatus = result.IsWithinBoundaries;

            // Analyze movement for shot detection
            var movementAnalysis = await AnalyzeMovementPatternAsync(userId, roundId, locationData);
            result.ShotDetected = movementAnalysis.ShotDetected;

            if (result.ShotDetected)
            {
                result.Messages.Add($"Shot detected: ~{movementAnalysis.EstimatedShotDistance:F0}m");
                if (!string.IsNullOrEmpty(movementAnalysis.EstimatedClub))
                {
                    result.Messages.Add($"Estimated club: {movementAnalysis.EstimatedClub}");
                }
            }

            // Save location to database
            await _locationRepository.CreateAsync(location);

            // Update AI context with new location
            await UpdateAILocationContextAsync(userId, roundId, locationData);

            result.Success = true;
            result.ProcessedAt = DateTime.UtcNow;

            _logger.LogDebug("Processed location update for user {UserId}, round {RoundId}, hole {Hole}", 
                userId, roundId, result.DetectedHole);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing location update for user {UserId}, round {RoundId}", userId, roundId);
            return new LocationProcessingResult 
            { 
                Success = false, 
                Messages = { "Error processing location update" } 
            };
        }
    }

    public async Task<int?> DetectCurrentHoleAsync(int courseId, decimal latitude, decimal longitude)
    {
        try
        {
            // Get all holes for the course
            var holes = await _holeRepository.GetByCourseIdAsync(courseId);
            
            int? closestHole = null;
            decimal minDistance = decimal.MaxValue;

            foreach (var hole in holes)
            {
                // Calculate distance to tee (primary detection point)
                if (hole.TeeLocation != null)
                {
                    var distanceToTee = CalculateHaversineDistance(
                        latitude, longitude,
                        (decimal)hole.TeeLocation.Y, (decimal)hole.TeeLocation.X
                    );

                    if (distanceToTee < minDistance)
                    {
                        minDistance = distanceToTee;
                        closestHole = hole.HoleNumber;
                    }
                }

                // Also check distance to green for more accurate detection
                if (hole.PinLocation != null)
                {
                    var distanceToGreen = CalculateHaversineDistance(
                        latitude, longitude,
                        (decimal)hole.PinLocation.Y, (decimal)hole.PinLocation.X
                    );

                    if (distanceToGreen < minDistance && distanceToGreen < 100) // Within 100m of green
                    {
                        minDistance = distanceToGreen;
                        closestHole = hole.HoleNumber;
                    }
                }
            }

            // Only return hole if within reasonable distance (500m)
            return minDistance <= 500 ? closestHole : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error detecting current hole for course {CourseId}", courseId);
            return null;
        }
    }

    public async Task<decimal?> CalculateDistanceToPinAsync(int courseId, int holeNumber, decimal latitude, decimal longitude)
    {
        try
        {
            var hole = await _holeRepository.GetByCourseIdAndHoleNumberAsync(courseId, holeNumber);
            if (hole?.PinLocation == null)
            {
                return null;
            }

            return CalculateHaversineDistance(
                latitude, longitude,
                (decimal)hole.PinLocation.Y, (decimal)hole.PinLocation.X
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating distance to pin for course {CourseId}, hole {HoleNumber}", courseId, holeNumber);
            return null;
        }
    }

    public async Task<decimal?> CalculateDistanceToTeeAsync(int courseId, int holeNumber, decimal latitude, decimal longitude)
    {
        try
        {
            var hole = await _holeRepository.GetByCourseIdAndHoleNumberAsync(courseId, holeNumber);
            if (hole?.TeeLocation == null)
            {
                return null;
            }

            return CalculateHaversineDistance(
                latitude, longitude,
                (decimal)hole.TeeLocation.Y, (decimal)hole.TeeLocation.X
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating distance to tee for course {CourseId}, hole {HoleNumber}", courseId, holeNumber);
            return null;
        }
    }

    public async Task<string> DeterminePositionOnHoleAsync(int courseId, int holeNumber, decimal latitude, decimal longitude)
    {
        try
        {
            var hole = await _holeRepository.GetByCourseIdAndHoleNumberAsync(courseId, holeNumber);
            if (hole == null)
            {
                return "unknown";
            }

            // Check if near tee
            if (hole.TeeLocation != null)
            {
                var teeDistance = CalculateHaversineDistance(
                    latitude, longitude,
                    (decimal)hole.TeeLocation.Y, (decimal)hole.TeeLocation.X
                );

                if (teeDistance <= TEE_AREA_RADIUS_METERS)
                {
                    return "tee";
                }
            }

            // Check if near green
            if (hole.PinLocation != null)
            {
                var distanceToGreen = CalculateHaversineDistance(
                    latitude, longitude,
                    (decimal)hole.PinLocation.Y, (decimal)hole.PinLocation.X
                );

                if (distanceToGreen <= GREEN_AREA_RADIUS_METERS)
                {
                    return "green";
                }
            }

            // For now, assume fairway if between tee and green
            // In a more advanced implementation, we would use course layout data
            var distanceToPin = await CalculateDistanceToPinAsync(courseId, holeNumber, latitude, longitude);
            var distanceToTee = await CalculateDistanceToTeeAsync(courseId, holeNumber, latitude, longitude);

            if (distanceToPin.HasValue && distanceToTee.HasValue)
            {
                // If closer to tee than pin, likely fairway; if very close to pin, likely green approach
                if (distanceToPin.Value < 50)
                {
                    return "green";
                }
                else if (distanceToTee.Value > TEE_AREA_RADIUS_METERS && distanceToPin.Value > GREEN_AREA_RADIUS_METERS)
                {
                    return "fairway";
                }
            }

            return "unknown";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error determining position on hole for course {CourseId}, hole {HoleNumber}", courseId, holeNumber);
            return "unknown";
        }
    }

    public async Task<bool> IsWithinCourseBoundariesAsync(int courseId, decimal latitude, decimal longitude)
    {
        try
        {
            // Simple implementation: check if within reasonable distance of any hole
            var holes = await _holeRepository.GetByCourseIdAsync(courseId);
            
            foreach (var hole in holes)
            {
                if (hole.TeeLocation != null)
                {
                    var distanceToTee = CalculateHaversineDistance(
                        latitude, longitude,
                        (decimal)hole.TeeLocation.Y, (decimal)hole.TeeLocation.X
                    );

                    if (distanceToTee <= 600) // Within 600m of any tee
                    {
                        return true;
                    }
                }

                if (hole.PinLocation != null)
                {
                    var distanceToGreen = CalculateHaversineDistance(
                        latitude, longitude,
                        (decimal)hole.PinLocation.Y, (decimal)hole.PinLocation.X
                    );

                    if (distanceToGreen <= 600) // Within 600m of any green
                    {
                        return true;
                    }
                }
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking course boundaries for course {CourseId}", courseId);
            return true; // Default to true on error
        }
    }

    public async Task<IEnumerable<LocationHistoryPoint>> GetRecentLocationHistoryAsync(int userId, int roundId, int limitMinutes = 60)
    {
        try
        {
            var cutoffTime = DateTime.UtcNow.AddMinutes(-limitMinutes);
            var locations = await _locationRepository.GetByRoundIdSinceAsync(roundId, cutoffTime);

            return locations
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.Timestamp)
                .Select(l => new LocationHistoryPoint
                {
                    Latitude = l.Latitude,
                    Longitude = l.Longitude,
                    AccuracyMeters = l.AccuracyMeters,
                    DetectedHole = l.CurrentHoleDetected,
                    DistanceToPin = l.DistanceToPinMeters,
                    PositionOnHole = l.PositionOnHole,
                    MovementSpeed = l.MovementSpeedMps,
                    Timestamp = l.Timestamp ?? DateTime.UtcNow
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recent location history for user {UserId}, round {RoundId}", userId, roundId);
            return Enumerable.Empty<LocationHistoryPoint>();
        }
    }

    public async Task<MovementAnalysisResult> AnalyzeMovementPatternAsync(int userId, int roundId, Models.LocationContext currentLocation)
    {
        try
        {
            var result = new MovementAnalysisResult();

            // Get recent locations (last 5 minutes)
            var recentLocations = await GetRecentLocationHistoryAsync(userId, roundId, 5);
            var locationList = recentLocations.ToList();

            if (locationList.Count < 2)
            {
                result.AnalysisNotes.Add("Insufficient location history for analysis");
                return result;
            }

            // Look for movement patterns indicating a shot
            var previousLocation = locationList.First(); // Most recent
            var distance = CalculateHaversineDistance(
                previousLocation.Latitude, previousLocation.Longitude,
                currentLocation.Latitude, currentLocation.Longitude
            );

            var timeDifference = (currentLocation.Timestamp - previousLocation.Timestamp).TotalSeconds;
            
            // Calculate movement speed
            var movementSpeed = timeDifference > 0 ? (double)(distance / (decimal)timeDifference) : 0;

            result.EstimatedShotDistance = distance;
            result.MovementDuration = (decimal)timeDifference;

            // Shot detection logic
            if (distance >= SHOT_DETECTION_MIN_DISTANCE && // Minimum distance moved
                timeDifference <= 30 && // Within 30 seconds
                movementSpeed > (double)SHOT_DETECTION_MAX_WALKING_SPEED && // Faster than walking
                previousLocation.MovementSpeed.GetValueOrDefault() <= SHOT_DETECTION_MAX_WALKING_SPEED) // Previous location was stationary/slow
            {
                result.ShotDetected = true;
                result.Confidence = CalculateShotConfidence(distance, (decimal)timeDifference, (decimal)movementSpeed);
                result.EstimatedClub = EstimateClubFromDistance(distance);
                
                result.StartLocation = previousLocation;
                result.EndLocation = new LocationHistoryPoint
                {
                    Latitude = currentLocation.Latitude,
                    Longitude = currentLocation.Longitude,
                    Timestamp = currentLocation.Timestamp
                };

                result.AnalysisNotes.Add($"Shot detected: {distance:F0}m in {timeDifference:F1}s");
            }
            else
            {
                result.AnalysisNotes.Add($"Movement detected: {distance:F1}m (likely walking)");
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing movement pattern for user {UserId}, round {RoundId}", userId, roundId);
            return new MovementAnalysisResult
            {
                AnalysisNotes = { "Error analyzing movement pattern" }
            };
        }
    }

    public async Task UpdateAILocationContextAsync(int userId, int roundId, Models.LocationContext locationContext)
    {
        try
        {
            await _openAIService.UpdateLocationContextAsync(
                userId,
                roundId,
                locationContext.Latitude,
                locationContext.Longitude,
                locationContext.CurrentHole,
                locationContext.DistanceToPinMeters
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating AI location context for user {UserId}, round {RoundId}", userId, roundId);
            // Don't throw - this is supplementary functionality
        }
    }

    #region Private Helper Methods

    /// <summary>
    /// Calculate distance between two GPS coordinates using Haversine formula
    /// </summary>
    private static decimal CalculateHaversineDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
    {
        const decimal earthRadiusMeters = 6371000; // Earth's radius in meters

        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);

        var a = (decimal)(Math.Sin((double)dLat / 2) * Math.Sin((double)dLat / 2) +
                Math.Cos((double)ToRadians(lat1)) * Math.Cos((double)ToRadians(lat2)) *
                Math.Sin((double)dLon / 2) * Math.Sin((double)dLon / 2));

        var c = (decimal)(2 * Math.Atan2(Math.Sqrt((double)a), Math.Sqrt((double)(1 - a))));

        return earthRadiusMeters * c;
    }

    private static decimal ToRadians(decimal degrees)
    {
        return degrees * (decimal)Math.PI / 180;
    }

    private static decimal CalculateShotConfidence(decimal distance, decimal timeDuration, decimal speed)
    {
        var confidence = 0.5m; // Base confidence

        // Higher confidence for longer distances
        if (distance > 100) confidence += 0.2m;
        if (distance > 200) confidence += 0.2m;

        // Higher confidence for faster speeds
        if (speed > 10) confidence += 0.1m;
        if (speed > 20) confidence += 0.1m;

        // Lower confidence for very short durations (might be GPS error)
        if (timeDuration < 2) confidence -= 0.2m;

        return Math.Max(0.1m, Math.Min(1.0m, confidence));
    }

    private static string EstimateClubFromDistance(decimal distance)
    {
        return distance switch
        {
            >= 250 => "Driver",
            >= 200 => "3-Wood",
            >= 180 => "5-Wood",
            >= 160 => "4-Iron",
            >= 140 => "6-Iron",
            >= 120 => "8-Iron",
            >= 100 => "Pitching Wedge",
            >= 80 => "Sand Wedge",
            >= 50 => "Lob Wedge",
            _ => "Short Iron"
        };
    }

    #endregion
}