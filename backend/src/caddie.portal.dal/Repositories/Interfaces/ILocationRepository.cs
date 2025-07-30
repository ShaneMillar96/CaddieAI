using caddie.portal.dal.Models;
using Location = caddie.portal.dal.Models.Location;

namespace caddie.portal.dal.Repositories.Interfaces;

public interface ILocationRepository
{
    // Basic CRUD operations
    Task<Location?> GetByIdAsync(int id);
    Task<Location?> GetByIdWithDetailsAsync(int id);
    Task<IEnumerable<Location>> GetByUserIdAsync(int userId);
    Task<IEnumerable<Location>> GetByRoundIdAsync(int roundId);
    Task<IEnumerable<Location>> GetByRoundIdSinceAsync(int roundId, DateTime since);
    Task<IEnumerable<Location>> GetByCourseIdAsync(int courseId);
    Task<Location> CreateAsync(Location location);
    Task<Location> UpdateAsync(Location location);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int id);

    // Location tracking queries
    Task<Location?> GetLatestLocationByUserIdAsync(int userId);
    Task<Location?> GetLatestLocationByRoundIdAsync(int roundId);
    Task<IEnumerable<Location>> GetLocationHistoryAsync(int userId, DateTime startTime, DateTime endTime);
    Task<IEnumerable<Location>> GetRoundLocationHistoryAsync(int roundId);
    Task<IEnumerable<Location>> GetLocationsByTimeRangeAsync(int userId, DateTime startTime, DateTime endTime);

    // Geospatial distance calculations
    Task<decimal?> CalculateDistanceToTeeAsync(int userId, int courseId, int holeNumber);
    Task<decimal?> CalculateDistanceToPinAsync(int userId, int courseId, int holeNumber);
    Task<decimal?> CalculateDistanceBetweenLocationsAsync(int locationId1, int locationId2);
    Task<decimal?> CalculateDistanceFromPointAsync(decimal latitude, decimal longitude, int courseId, int holeNumber, string targetType);

    // Course boundary detection
    Task<bool> IsWithinCourseBoundaryAsync(decimal latitude, decimal longitude, int courseId);
    Task<int?> DetectCurrentHoleAsync(decimal latitude, decimal longitude, int courseId);
    Task<string?> DetectPositionOnHoleAsync(decimal latitude, decimal longitude, int courseId, int holeNumber);

    // Proximity and spatial queries
    Task<IEnumerable<Location>> GetLocationsWithinRadiusAsync(decimal latitude, decimal longitude, decimal radiusMeters);
    Task<IEnumerable<Location>> GetNearbyLocationsAsync(int locationId, decimal radiusMeters);
    Task<bool> IsNearLocationAsync(decimal latitude, decimal longitude, decimal targetLatitude, decimal targetLongitude, decimal thresholdMeters);

    // Shot tracking and analysis
    Task<Location?> GetLastShotLocationAsync(int userId, int roundId);
    Task<decimal?> CalculateLastShotDistanceAsync(int userId, int roundId);
    Task<IEnumerable<Location>> GetShotSequenceAsync(int roundId, int holeNumber);

    // Real-time updates
    Task<Location> UpdateLocationWithCalculationsAsync(Location location);
    Task<bool> UpdateCourseBoundaryStatusAsync(int locationId, bool isWithinBoundary);
    Task<bool> UpdateDistanceCalculationsAsync(int locationId, decimal? distanceToTee, decimal? distanceToPin);

    // Statistics and analytics
    Task<object?> GetLocationStatisticsAsync(int userId, DateTime? startDate = null, DateTime? endDate = null);
    Task<IEnumerable<object>> GetHolePositionAnalysisAsync(int userId, int courseId, int holeNumber);
    Task<decimal?> GetAverageDistanceToTargetAsync(int userId, int courseId, int holeNumber, string targetType);

    // Pagination and filtering
    Task<IEnumerable<Location>> GetPaginatedAsync(int page, int pageSize, int? userId = null, int? roundId = null, int? courseId = null);
    Task<int> GetTotalCountAsync(int? userId = null, int? roundId = null, int? courseId = null);
}