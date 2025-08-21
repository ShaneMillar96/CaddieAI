using caddie.portal.services.Models;

namespace caddie.portal.services.Interfaces;

/// <summary>
/// Service interface for swing analysis business logic operations
/// </summary>
public interface ISwingAnalysisService
{
    /// <summary>
    /// Get swing analysis by ID
    /// </summary>
    /// <param name="id">Swing analysis ID</param>
    /// <returns>Swing analysis or null if not found</returns>
    Task<SwingAnalysisModel?> GetByIdAsync(int id);

    /// <summary>
    /// Get swing analyses for a user's round
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Round ID</param>
    /// <returns>Collection of swing analyses for the round</returns>
    Task<IEnumerable<SwingAnalysisModel>> GetByUserIdAndRoundIdAsync(int userId, int roundId);

    /// <summary>
    /// Get all swing analyses for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Collection of all user's swing analyses</returns>
    Task<IEnumerable<SwingAnalysisModel>> GetByUserIdAsync(int userId);

    /// <summary>
    /// Get swing analyses by detection source
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="detectionSource">Detection source (garmin or mobile)</param>
    /// <returns>Collection of swing analyses from the specified source</returns>
    Task<IEnumerable<SwingAnalysisModel>> GetByDetectionSourceAsync(int userId, string detectionSource);

    /// <summary>
    /// Create a new swing analysis
    /// </summary>
    /// <param name="model">Swing analysis creation model</param>
    /// <returns>Created swing analysis</returns>
    Task<SwingAnalysisModel> CreateAsync(CreateSwingAnalysisModel model);

    /// <summary>
    /// Update an existing swing analysis
    /// </summary>
    /// <param name="id">Swing analysis ID</param>
    /// <param name="model">Swing analysis update model</param>
    /// <returns>Updated swing analysis</returns>
    Task<SwingAnalysisModel?> UpdateAsync(int id, UpdateSwingAnalysisModel model);

    /// <summary>
    /// Delete a swing analysis
    /// </summary>
    /// <param name="id">Swing analysis ID</param>
    /// <param name="userId">User ID for authorization</param>
    /// <returns>True if deleted, false if not found or unauthorized</returns>
    Task<bool> DeleteAsync(int id, int userId);

    /// <summary>
    /// Get swing analysis statistics for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Swing analysis statistics</returns>
    Task<SwingAnalysisStatsModel> GetStatsAsync(int userId);

    /// <summary>
    /// Get round-specific swing analysis summary
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="roundId">Round ID</param>
    /// <returns>Round swing analysis summary</returns>
    Task<RoundSwingAnalysisSummaryModel> GetRoundSummaryAsync(int userId, int roundId);

    /// <summary>
    /// Validate swing analysis data before creation
    /// </summary>
    /// <param name="model">Swing analysis creation model</param>
    /// <returns>Validation result</returns>
    Task<(bool IsValid, List<string> ValidationErrors)> ValidateSwingAnalysisAsync(CreateSwingAnalysisModel model);

    /// <summary>
    /// Check if user has permission to access swing analysis
    /// </summary>
    /// <param name="swingAnalysisId">Swing analysis ID</param>
    /// <param name="userId">User ID</param>
    /// <returns>True if user has access, false otherwise</returns>
    Task<bool> HasUserAccessAsync(int swingAnalysisId, int userId);

    /// <summary>
    /// Generate AI feedback for a swing analysis
    /// </summary>
    /// <param name="swingAnalysisId">Swing analysis ID</param>
    /// <returns>Updated swing analysis with AI feedback</returns>
    Task<SwingAnalysisModel?> GenerateAiFeedbackAsync(int swingAnalysisId);

    /// <summary>
    /// Compare swing to a template or pro swing
    /// </summary>
    /// <param name="swingAnalysisId">Swing analysis ID</param>
    /// <param name="templateName">Template or pro swing name</param>
    /// <returns>Updated swing analysis with comparison results</returns>
    Task<SwingAnalysisModel?> CompareToTemplateAsync(int swingAnalysisId, string templateName);

    /// <summary>
    /// Get recent swing trends for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="days">Number of days to look back (default: 30)</param>
    /// <returns>Swing trend data</returns>
    Task<Dictionary<DateTime, SwingAnalysisStatsModel>> GetSwingTrendsAsync(int userId, int days = 30);
}