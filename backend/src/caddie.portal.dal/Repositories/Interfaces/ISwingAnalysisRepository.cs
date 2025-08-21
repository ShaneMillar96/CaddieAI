using caddie.portal.dal.Models;

namespace caddie.portal.dal.Repositories.Interfaces;

/// <summary>
/// Repository interface for swing analysis data operations
/// </summary>
public interface ISwingAnalysisRepository
{
    /// <summary>
    /// Get swing analysis by ID
    /// </summary>
    /// <param name="id">Swing analysis ID</param>
    /// <returns>Swing analysis or null if not found</returns>
    Task<SwingAnalysis?> GetByIdAsync(int id);

    /// <summary>
    /// Get swing analyses by user ID and round ID
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Round ID</param>
    /// <returns>Collection of swing analyses for the round</returns>
    Task<IEnumerable<SwingAnalysis>> GetByUserIdAndRoundIdAsync(int userId, int roundId);

    /// <summary>
    /// Get swing analyses by user ID
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Collection of all swing analyses for the user</returns>
    Task<IEnumerable<SwingAnalysis>> GetByUserIdAsync(int userId);

    /// <summary>
    /// Get swing analyses by round ID
    /// </summary>
    /// <param name="roundId">Round ID</param>
    /// <returns>Collection of swing analyses for the round</returns>
    Task<IEnumerable<SwingAnalysis>> GetByRoundIdAsync(int roundId);

    /// <summary>
    /// Get swing analyses by hole ID
    /// </summary>
    /// <param name="holeId">Hole ID</param>
    /// <returns>Collection of swing analyses for the hole</returns>
    Task<IEnumerable<SwingAnalysis>> GetByHoleIdAsync(int holeId);

    /// <summary>
    /// Get swing analyses by detection source
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="detectionSource">Detection source (garmin or mobile)</param>
    /// <returns>Collection of swing analyses from the specified source</returns>
    Task<IEnumerable<SwingAnalysis>> GetByDetectionSourceAsync(int userId, string detectionSource);

    /// <summary>
    /// Create a new swing analysis
    /// </summary>
    /// <param name="swingAnalysis">Swing analysis to create</param>
    /// <returns>Created swing analysis</returns>
    Task<SwingAnalysis> CreateAsync(SwingAnalysis swingAnalysis);

    /// <summary>
    /// Update an existing swing analysis
    /// </summary>
    /// <param name="swingAnalysis">Swing analysis to update</param>
    /// <returns>Updated swing analysis</returns>
    Task<SwingAnalysis> UpdateAsync(SwingAnalysis swingAnalysis);

    /// <summary>
    /// Delete a swing analysis
    /// </summary>
    /// <param name="id">Swing analysis ID</param>
    /// <returns>True if deleted, false if not found</returns>
    Task<bool> DeleteAsync(int id);

    /// <summary>
    /// Check if a swing analysis exists
    /// </summary>
    /// <param name="id">Swing analysis ID</param>
    /// <returns>True if exists, false otherwise</returns>
    Task<bool> ExistsAsync(int id);

    /// <summary>
    /// Get swing analysis statistics for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Swing analysis statistics</returns>
    Task<SwingAnalysisStats> GetStatsAsync(int userId);
}

/// <summary>
/// Swing analysis statistics data
/// </summary>
public class SwingAnalysisStats
{
    public int TotalSwings { get; set; }
    public decimal? AverageSwingSpeed { get; set; }
    public decimal? AverageQualityScore { get; set; }
    public int GarminSwings { get; set; }
    public int MobileSwings { get; set; }
    public DateTime? LastSwingDate { get; set; }
}