using caddie.portal.dal.Models;

namespace caddie.portal.dal.Repositories.Interfaces;

/// <summary>
/// Repository interface for shot placement data operations
/// </summary>
public interface IShotPlacementRepository
{
    /// <summary>
    /// Get shot placement by ID
    /// </summary>
    /// <param name="id">Shot placement ID</param>
    /// <returns>Shot placement or null if not found</returns>
    Task<ShotPlacement?> GetByIdAsync(int id);

    /// <summary>
    /// Get all shot placements for a specific round
    /// </summary>
    /// <param name="roundId">Round ID</param>
    /// <returns>List of shot placements</returns>
    Task<IEnumerable<ShotPlacement>> GetByRoundIdAsync(int roundId);

    /// <summary>
    /// Get shot placements for a specific hole in a round
    /// </summary>
    /// <param name="roundId">Round ID</param>
    /// <param name="holeId">Hole ID</param>
    /// <returns>List of shot placements for the hole</returns>
    Task<IEnumerable<ShotPlacement>> GetByRoundAndHoleAsync(int roundId, int holeId);

    /// <summary>
    /// Get shot placements for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="limit">Maximum number of results (optional)</param>
    /// <returns>List of shot placements</returns>
    Task<IEnumerable<ShotPlacement>> GetByUserIdAsync(int userId, int? limit = null);

    /// <summary>
    /// Get shot placements for a user within a date range
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="fromDate">Start date</param>
    /// <param name="toDate">End date</param>
    /// <returns>List of shot placements</returns>
    Task<IEnumerable<ShotPlacement>> GetByUserAndDateRangeAsync(int userId, DateTime fromDate, DateTime toDate);

    /// <summary>
    /// Get recent shot placements for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="limit">Maximum number of results</param>
    /// <returns>Recent shot placements ordered by creation date descending</returns>
    Task<IEnumerable<ShotPlacement>> GetRecentByUserIdAsync(int userId, int limit = 10);

    /// <summary>
    /// Create a new shot placement
    /// </summary>
    /// <param name="shotPlacement">Shot placement to create</param>
    /// <returns>Created shot placement with ID</returns>
    Task<ShotPlacement> CreateAsync(ShotPlacement shotPlacement);

    /// <summary>
    /// Update an existing shot placement
    /// </summary>
    /// <param name="shotPlacement">Shot placement to update</param>
    /// <returns>Updated shot placement</returns>
    Task<ShotPlacement> UpdateAsync(ShotPlacement shotPlacement);

    /// <summary>
    /// Delete a shot placement
    /// </summary>
    /// <param name="id">Shot placement ID</param>
    /// <returns>True if deleted successfully</returns>
    Task<bool> DeleteAsync(int id);

    /// <summary>
    /// Check if a shot placement exists
    /// </summary>
    /// <param name="id">Shot placement ID</param>
    /// <returns>True if exists</returns>
    Task<bool> ExistsAsync(int id);

    /// <summary>
    /// Get shot placement statistics for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="fromDate">Optional start date for filtering</param>
    /// <returns>Shot placement statistics</returns>
    Task<(int totalShots, int completedShots, double? avgDistanceToPin, double? avgAccuracy)> GetStatsAsync(int userId, DateTime? fromDate = null);

    /// <summary>
    /// Get most common club recommendations for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="limit">Maximum number of results</param>
    /// <returns>Club recommendations with usage count</returns>
    Task<IEnumerable<(string club, int count)>> GetMostCommonClubsAsync(int userId, int limit = 10);

    /// <summary>
    /// Get all shot placements (for admin purposes)
    /// </summary>
    /// <returns>All shot placements</returns>
    Task<IEnumerable<ShotPlacement>> GetAllAsync();
}