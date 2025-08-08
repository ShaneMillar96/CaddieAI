using AutoMapper;
using NetTopologySuite.Geometries;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories;
using caddie.portal.dal.Repositories.Interfaces;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using Microsoft.Extensions.Logging;

namespace caddie.portal.services.Services;

/// <summary>
/// Service implementation for managing shot placements and tracking
/// </summary>
public class ShotService : IShotService
{
    private readonly IShotPlacementRepository _shotPlacementRepository;
    private readonly IHoleRepository _holeRepository;
    private readonly IRoundRepository _roundRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<ShotService> _logger;

    public ShotService(
        IShotPlacementRepository shotPlacementRepository,
        IHoleRepository holeRepository,
        IRoundRepository roundRepository,
        IMapper mapper,
        ILogger<ShotService> logger)
    {
        _shotPlacementRepository = shotPlacementRepository;
        _holeRepository = holeRepository;
        _roundRepository = roundRepository;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Create a new shot placement record
    /// </summary>
    public async Task<ShotPlacementModel> CreateShotPlacementAsync(CreateShotPlacementModel model)
    {
        // Validate coordinates
        if (!ValidateCoordinates(model.Latitude, model.Longitude))
        {
            throw new ArgumentException("Invalid coordinates provided");
        }

        // Verify round exists
        var round = await _roundRepository.GetByIdAsync(model.RoundId);
        if (round == null)
        {
            throw new ArgumentException($"Round with ID {model.RoundId} not found");
        }

        // Verify hole exists if provided
        if (model.HoleId.HasValue)
        {
            var hole = await _holeRepository.GetByIdAsync(model.HoleId.Value);
            if (hole == null)
            {
                throw new ArgumentException($"Hole with ID {model.HoleId} not found");
            }
        }

        // Create PostGIS Point for shot location
        var shotPoint = ShotPlacementRepository.CreatePoint(model.Longitude, model.Latitude);

        var shotPlacement = new ShotPlacement
        {
            UserId = model.UserId,
            RoundId = model.RoundId,
            HoleId = model.HoleId,
            ShotLocation = shotPoint,
            AccuracyMeters = model.Accuracy,
            DistanceToPinYards = model.DistanceToPin,
            DistanceFromCurrentYards = model.DistanceFromCurrent,
            ClubRecommendation = model.ClubRecommendation,
            Metadata = model.Metadata,
        };

        var createdShot = await _shotPlacementRepository.CreateAsync(shotPlacement);
        var result = _mapper.Map<ShotPlacementModel>(createdShot);

        _logger.LogInformation("Created shot placement {ShotId} for user {UserId} in round {RoundId}", 
            createdShot.Id, model.UserId, model.RoundId);

        return result;
    }

    /// <summary>
    /// Get shot placement by ID
    /// </summary>
    public async Task<ShotPlacementModel?> GetShotPlacementByIdAsync(int id)
    {
        var shotPlacement = await _shotPlacementRepository.GetByIdAsync(id);
        return shotPlacement != null ? _mapper.Map<ShotPlacementModel>(shotPlacement) : null;
    }

    /// <summary>
    /// Get all shot placements for a specific round
    /// </summary>
    public async Task<IEnumerable<ShotPlacementModel>> GetShotPlacementsByRoundAsync(int roundId)
    {
        var shotPlacements = await _shotPlacementRepository.GetByRoundIdAsync(roundId);
        return _mapper.Map<IEnumerable<ShotPlacementModel>>(shotPlacements);
    }

    /// <summary>
    /// Get shot placements for a specific hole in a round
    /// </summary>
    public async Task<IEnumerable<ShotPlacementModel>> GetShotPlacementsByHoleAsync(int roundId, int holeId)
    {
        var shotPlacements = await _shotPlacementRepository.GetByRoundAndHoleAsync(roundId, holeId);
        return _mapper.Map<IEnumerable<ShotPlacementModel>>(shotPlacements);
    }

    /// <summary>
    /// Update shot placement progress (e.g., mark as completed)
    /// </summary>
    public async Task<ShotPlacementModel> UpdateShotPlacementProgressAsync(int id, UpdateShotProgressModel model)
    {
        var shotPlacement = await _shotPlacementRepository.GetByIdAsync(id);
        if (shotPlacement == null)
        {
            throw new ArgumentException($"Shot placement with ID {id} not found");
        }

        // Update fields
        shotPlacement.IsCompleted = model.IsCompleted;
        shotPlacement.CompletedAt = model.CompletedAt ?? (model.IsCompleted ? DateTime.UtcNow : null);
        shotPlacement.ClubUsed = model.ClubUsed;
        shotPlacement.Notes = model.Notes;

        // Update actual shot location if provided
        if (model.ActualLatitude.HasValue && model.ActualLongitude.HasValue)
        {
            if (ValidateCoordinates(model.ActualLatitude.Value, model.ActualLongitude.Value))
            {
                shotPlacement.ActualShotLocation = ShotPlacementRepository.CreatePoint(
                    model.ActualLongitude.Value, 
                    model.ActualLatitude.Value
                );
            }
        }

        // Update metadata
        if (!string.IsNullOrEmpty(model.Metadata))
        {
            shotPlacement.Metadata = model.Metadata;
        }

        var updatedShot = await _shotPlacementRepository.UpdateAsync(shotPlacement);
        var result = _mapper.Map<ShotPlacementModel>(updatedShot);

        _logger.LogInformation("Updated shot placement {ShotId} progress: completed={IsCompleted}", 
            id, model.IsCompleted);

        return result;
    }

    /// <summary>
    /// Delete a shot placement
    /// </summary>
    public async Task<bool> DeleteShotPlacementAsync(int id)
    {
        var deleted = await _shotPlacementRepository.DeleteAsync(id);
        
        if (deleted)
        {
            _logger.LogInformation("Deleted shot placement {ShotId}", id);
        }

        return deleted;
    }

    /// <summary>
    /// Get shot placement statistics for a user
    /// </summary>
    public async Task<ShotPlacementStatsModel> GetShotPlacementStatsAsync(int userId, DateTime? fromDate = null)
    {
        var effectiveFromDate = fromDate ?? DateTime.UtcNow.AddMonths(-3); // Default to last 3 months
        var toDate = DateTime.UtcNow;

        var (totalShots, completedShots, avgDistanceToPin, avgAccuracy) = 
            await _shotPlacementRepository.GetStatsAsync(userId, effectiveFromDate);

        var mostCommonClubs = await _shotPlacementRepository.GetMostCommonClubsAsync(userId);
        var mostCommonClub = mostCommonClubs.FirstOrDefault().Item1;

        // Calculate shot accuracy percentage (placeholder logic)
        double? shotAccuracyPercentage = null;
        if (completedShots > 0)
        {
            shotAccuracyPercentage = (double)completedShots / totalShots * 100;
        }

        return new ShotPlacementStatsModel
        {
            UserId = userId,
            TotalShots = totalShots,
            CompletedShots = completedShots,
            AverageDistanceToPin = avgDistanceToPin,
            MostCommonClub = mostCommonClub,
            FromDate = effectiveFromDate,
            ToDate = toDate,
            AverageAccuracy = avgAccuracy,
            ShotAccuracyPercentage = shotAccuracyPercentage
        };
    }

    /// <summary>
    /// Get recent shot placements for a user
    /// </summary>
    public async Task<IEnumerable<ShotPlacementModel>> GetRecentShotPlacementsAsync(int userId, int limit = 10)
    {
        var shotPlacements = await _shotPlacementRepository.GetRecentByUserIdAsync(userId, limit);
        return _mapper.Map<IEnumerable<ShotPlacementModel>>(shotPlacements);
    }

    /// <summary>
    /// Calculate distance between two geographic points using Haversine formula
    /// </summary>
    public double CalculateDistanceMeters(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371000; // Earth's radius in meters

        var φ1 = lat1 * Math.PI / 180; // φ, λ in radians
        var φ2 = lat2 * Math.PI / 180;
        var Δφ = (lat2 - lat1) * Math.PI / 180;
        var Δλ = (lng2 - lng1) * Math.PI / 180;

        var a = Math.Sin(Δφ / 2) * Math.Sin(Δφ / 2) +
                Math.Cos(φ1) * Math.Cos(φ2) *
                Math.Sin(Δλ / 2) * Math.Sin(Δλ / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return R * c; // Distance in meters
    }

    /// <summary>
    /// Convert meters to yards
    /// </summary>
    public int MetersToYards(double meters)
    {
        return (int)Math.Round(meters * 1.094, 0);
    }

    /// <summary>
    /// Validate shot placement coordinates
    /// </summary>
    public bool ValidateCoordinates(double latitude, double longitude)
    {
        return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
    }
}

/// <summary>
/// Service implementation for hole management operations
/// </summary>
public class HoleService : IHoleService
{
    private readonly IHoleRepository _holeRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<HoleService> _logger;

    public HoleService(
        IHoleRepository holeRepository,
        IMapper mapper,
        ILogger<HoleService> logger)
    {
        _holeRepository = holeRepository;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get hole by ID
    /// </summary>
    public async Task<HoleModel?> GetHoleByIdAsync(int id)
    {
        var hole = await _holeRepository.GetByIdAsync(id);
        return hole != null ? _mapper.Map<HoleModel>(hole) : null;
    }

    /// <summary>
    /// Get hole by course ID and hole number
    /// </summary>
    public async Task<HoleModel?> GetHoleByCourseAndNumberAsync(int courseId, int holeNumber)
    {
        var hole = await _holeRepository.GetByCourseIdAndHoleNumberAsync(courseId, holeNumber);
        return hole != null ? _mapper.Map<HoleModel>(hole) : null;
    }

    /// <summary>
    /// Get all holes for a course
    /// </summary>
    public async Task<IEnumerable<HoleModel>> GetHolesByCourseAsync(int courseId)
    {
        var holes = await _holeRepository.GetByCourseIdAsync(courseId);
        return _mapper.Map<IEnumerable<HoleModel>>(holes);
    }

    /// <summary>
    /// Calculate distance from a point to hole pin
    /// </summary>
    public async Task<int?> CalculateDistanceToPinAsync(int holeId, double fromLatitude, double fromLongitude)
    {
        var hole = await _holeRepository.GetByIdAsync(holeId);
        if (hole?.PinLocation == null) return null;

        var pinCoords = ShotPlacementRepository.ExtractCoordinates(hole.PinLocation);
        var distanceMeters = CalculateDistanceMeters(fromLatitude, fromLongitude, pinCoords.latitude, pinCoords.longitude);
        
        return (int)Math.Round(distanceMeters * 1.094, 0); // Convert to yards
    }

    /// <summary>
    /// Calculate distance from a point to hole tee
    /// </summary>
    public async Task<int?> CalculateDistanceToTeeAsync(int holeId, double fromLatitude, double fromLongitude)
    {
        var hole = await _holeRepository.GetByIdAsync(holeId);
        if (hole?.TeeLocation == null) return null;

        var teeCoords = ShotPlacementRepository.ExtractCoordinates(hole.TeeLocation);
        var distanceMeters = CalculateDistanceMeters(fromLatitude, fromLongitude, teeCoords.latitude, teeCoords.longitude);
        
        return (int)Math.Round(distanceMeters * 1.094, 0); // Convert to yards
    }

    /// <summary>
    /// Get hole yardage information for different tees
    /// </summary>
    public async Task<HoleYardageModel?> GetHoleYardageAsync(int holeId)
    {
        var hole = await _holeRepository.GetByIdAsync(holeId);
        if (hole == null) return null;

        var result = new HoleYardageModel
        {
            Id = hole.Id,
            HoleNumber = hole.HoleNumber,
            Par = hole.Par,
            YardageBlack = hole.YardageBlack,
            YardageBlue = hole.YardageBlue,
            YardageWhite = hole.YardageWhite,
            YardageRed = hole.YardageRed,
            LadiesYardage = hole.LadiesYardage
        };

        // Add coordinates if available
        if (hole.PinLocation != null)
        {
            var pinCoords = ShotPlacementRepository.ExtractCoordinates(hole.PinLocation);
            result.PinLocation = new CoordinateModel 
            { 
                Latitude = pinCoords.latitude, 
                Longitude = pinCoords.longitude 
            };
        }

        if (hole.TeeLocation != null)
        {
            var teeCoords = ShotPlacementRepository.ExtractCoordinates(hole.TeeLocation);
            result.TeeLocation = new CoordinateModel 
            { 
                Latitude = teeCoords.latitude, 
                Longitude = teeCoords.longitude 
            };
        }

        return result;
    }

    /// <summary>
    /// Calculate distance between two geographic points using Haversine formula
    /// </summary>
    private double CalculateDistanceMeters(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371000; // Earth's radius in meters

        var φ1 = lat1 * Math.PI / 180;
        var φ2 = lat2 * Math.PI / 180;
        var Δφ = (lat2 - lat1) * Math.PI / 180;
        var Δλ = (lng2 - lng1) * Math.PI / 180;

        var a = Math.Sin(Δφ / 2) * Math.Sin(Δφ / 2) +
                Math.Cos(φ1) * Math.Cos(φ2) *
                Math.Sin(Δλ / 2) * Math.Sin(Δλ / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return R * c;
    }
}