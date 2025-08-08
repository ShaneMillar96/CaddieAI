using caddie.portal.services.Models;

namespace caddie.portal.services.Interfaces;

/// <summary>
/// Service interface for managing shot placements and tracking
/// </summary>
public interface IShotService
{
    /// <summary>
    /// Create a new shot placement record
    /// </summary>
    /// <param name="model">Shot placement creation model</param>
    /// <returns>Created shot placement</returns>
    Task<ShotPlacementModel> CreateShotPlacementAsync(CreateShotPlacementModel model);

    /// <summary>
    /// Get shot placement by ID
    /// </summary>
    /// <param name="id">Shot placement ID</param>
    /// <returns>Shot placement or null if not found</returns>
    Task<ShotPlacementModel?> GetShotPlacementByIdAsync(int id);

    /// <summary>
    /// Get all shot placements for a specific round
    /// </summary>
    /// <param name="roundId">Round ID</param>
    /// <returns>List of shot placements</returns>
    Task<IEnumerable<ShotPlacementModel>> GetShotPlacementsByRoundAsync(int roundId);

    /// <summary>
    /// Get shot placements for a specific hole in a round
    /// </summary>
    /// <param name="roundId">Round ID</param>
    /// <param name="holeId">Hole ID</param>
    /// <returns>List of shot placements for the hole</returns>
    Task<IEnumerable<ShotPlacementModel>> GetShotPlacementsByHoleAsync(int roundId, int holeId);

    /// <summary>
    /// Update shot placement progress (e.g., mark as completed)
    /// </summary>
    /// <param name="id">Shot placement ID</param>
    /// <param name="model">Update model</param>
    /// <returns>Updated shot placement</returns>
    Task<ShotPlacementModel> UpdateShotPlacementProgressAsync(int id, UpdateShotProgressModel model);

    /// <summary>
    /// Delete a shot placement
    /// </summary>
    /// <param name="id">Shot placement ID</param>
    /// <returns>True if deleted successfully</returns>
    Task<bool> DeleteShotPlacementAsync(int id);

    /// <summary>
    /// Get shot placement statistics for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="fromDate">Optional start date for filtering</param>
    /// <returns>Shot placement statistics</returns>
    Task<ShotPlacementStatsModel> GetShotPlacementStatsAsync(int userId, DateTime? fromDate = null);

    /// <summary>
    /// Get recent shot placements for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="limit">Maximum number of recent shots to return</param>
    /// <returns>Recent shot placements</returns>
    Task<IEnumerable<ShotPlacementModel>> GetRecentShotPlacementsAsync(int userId, int limit = 10);

    /// <summary>
    /// Calculate distance between two geographic points
    /// </summary>
    /// <param name="lat1">Latitude of first point</param>
    /// <param name="lng1">Longitude of first point</param>
    /// <param name="lat2">Latitude of second point</param>
    /// <param name="lng2">Longitude of second point</param>
    /// <returns>Distance in meters</returns>
    double CalculateDistanceMeters(double lat1, double lng1, double lat2, double lng2);

    /// <summary>
    /// Convert meters to yards
    /// </summary>
    /// <param name="meters">Distance in meters</param>
    /// <returns>Distance in yards</returns>
    int MetersToYards(double meters);

    /// <summary>
    /// Validate shot placement coordinates
    /// </summary>
    /// <param name="latitude">Latitude to validate</param>
    /// <param name="longitude">Longitude to validate</param>
    /// <returns>True if coordinates are valid</returns>
    bool ValidateCoordinates(double latitude, double longitude);
}

/// <summary>
/// Service interface for hole management operations
/// </summary>
public interface IHoleService
{
    /// <summary>
    /// Get hole by ID
    /// </summary>
    /// <param name="id">Hole ID</param>
    /// <returns>Hole or null if not found</returns>
    Task<HoleModel?> GetHoleByIdAsync(int id);

    /// <summary>
    /// Get hole by course ID and hole number
    /// </summary>
    /// <param name="courseId">Course ID</param>
    /// <param name="holeNumber">Hole number (1-18)</param>
    /// <returns>Hole or null if not found</returns>
    Task<HoleModel?> GetHoleByCourseAndNumberAsync(int courseId, int holeNumber);

    /// <summary>
    /// Get all holes for a course
    /// </summary>
    /// <param name="courseId">Course ID</param>
    /// <returns>List of holes for the course</returns>
    Task<IEnumerable<HoleModel>> GetHolesByCourseAsync(int courseId);

    /// <summary>
    /// Calculate distance from a point to hole pin
    /// </summary>
    /// <param name="holeId">Hole ID</param>
    /// <param name="fromLatitude">Source latitude</param>
    /// <param name="fromLongitude">Source longitude</param>
    /// <returns>Distance in yards, or null if hole not found</returns>
    Task<int?> CalculateDistanceToPinAsync(int holeId, double fromLatitude, double fromLongitude);

    /// <summary>
    /// Calculate distance from a point to hole tee
    /// </summary>
    /// <param name="holeId">Hole ID</param>
    /// <param name="fromLatitude">Source latitude</param>
    /// <param name="fromLongitude">Source longitude</param>
    /// <returns>Distance in yards, or null if hole not found</returns>
    Task<int?> CalculateDistanceToTeeAsync(int holeId, double fromLatitude, double fromLongitude);

    /// <summary>
    /// Get hole yardage information for different tees
    /// </summary>
    /// <param name="holeId">Hole ID</param>
    /// <returns>Hole yardage data or null if not found</returns>
    Task<HoleYardageModel?> GetHoleYardageAsync(int holeId);
}