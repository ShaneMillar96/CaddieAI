using caddie.portal.services.Models;

namespace caddie.portal.services.Interfaces;

public interface IRoundService
{
    Task<RoundModel?> GetRoundByIdAsync(int id);
    Task<RoundModel?> GetRoundWithDetailsAsync(int id);
    Task<IEnumerable<RoundModel>> GetRoundsByUserIdAsync(int userId);
    Task<IEnumerable<RoundModel>> GetRoundsByUserIdWithDateRangeAsync(int userId, DateOnly startDate, DateOnly endDate);
    Task<IEnumerable<RoundModel>> GetRoundsByCourseIdAsync(int courseId);
    Task<IEnumerable<RoundModel>> GetActiveRoundsAsync();
    Task<IEnumerable<RoundModel>> GetRoundsByStatusAsync(RoundStatus status);
    Task<RoundModel?> GetActiveRoundByUserIdAsync(int userId);
    Task<RoundModel> CreateRoundAsync(int userId, CreateRoundModel model);
    Task<RoundModel> UpdateRoundAsync(int id, UpdateRoundModel model);
    Task<bool> DeleteRoundAsync(int id);
    Task<RoundModel> StartRoundAsync(int userId, StartRoundModel model);
    Task<RoundModel> PauseRoundAsync(int roundId);
    Task<RoundModel> ResumeRoundAsync(int roundId);
    Task<RoundModel> CompleteRoundAsync(int roundId, CompleteRoundModel model);
    Task<RoundModel> AbandonRoundAsync(int roundId, string? reason = null);
    Task<bool> UpdateRoundStatusAsync(int roundId, RoundStatus status);
    Task<bool> UpdateCurrentHoleAsync(int roundId, int holeNumber);
    Task<bool> UserHasActiveRoundAsync(int userId);
    Task<bool> ValidateRoundScoreAsync(int roundId, int score);
    Task<IEnumerable<RoundModel>> GetRecentRoundsAsync(int userId, int count = 10);
    Task<PaginatedResult<RoundModel>> GetPaginatedRoundsAsync(int page, int pageSize, int? userId = null, RoundStatus? status = null);
    Task<RoundStatisticsModel?> GetRoundStatisticsAsync(int userId, DateOnly? startDate = null, DateOnly? endDate = null);

    // Hole Score Management
    Task<HoleScoreModel?> GetHoleScoreByIdAsync(int id);
    Task<HoleScoreModel?> GetHoleScoreByRoundAndHoleAsync(int roundId, int holeNumber);
    Task<IEnumerable<HoleScoreModel>> GetHoleScoresByRoundIdAsync(int roundId);
    Task<HoleScoreSummaryModel> GetHoleScoreSummaryAsync(int roundId);
    Task<HoleScoreModel> CreateHoleScoreAsync(int roundId, CreateHoleScoreModel model);
    Task<HoleScoreModel> UpdateHoleScoreAsync(int id, UpdateHoleScoreModel model);
    Task<bool> DeleteHoleScoreAsync(int id);
    Task<bool> InitializeHoleScoresForRoundAsync(int roundId);
    Task<bool> ValidateHoleScoreAsync(int roundId, int holeNumber, CreateHoleScoreModel model);
    Task<bool> HoleScoreExistsAsync(int roundId, int holeNumber);
    Task<HoleScoreModel> CompleteHoleAsync(int roundId, CompleteHoleModel model);

    // Enhanced Round Management
    Task<CompleteHoleResult> CompleteHoleWithProgressionAsync(int roundId, int holeNumber, int score, int? par = null);
    Task<RoundProgress> GetRoundProgressAsync(int roundId);
    Task<bool> IsRoundCompleteAsync(int roundId);
    Task<int> CalculateRoundTotalAsync(int roundId);

    // Quick Score Editing
    Task<HoleScoreModel> UpdateQuickScoreAsync(int roundId, int holeNumber, int score);
    Task<bool> CanEditHoleAsync(int roundId, int holeNumber);
}