using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using caddie.portal.dal.Repositories.Interfaces;
using caddie.portal.dal.Models;
using caddie.portal.dal.Context;
using ServiceRoundStatus = caddie.portal.services.Models.RoundStatus;
using RoundStatusEnum = caddie.portal.dal.Enums.RoundStatus;

namespace caddie.portal.services.Services;

public class RoundService : IRoundService
{
    private readonly IRoundRepository _roundRepository;
    private readonly ICourseRepository _courseRepository;
    private readonly IUserRepository _userRepository;
    private readonly CaddieAIDbContext _context;
    private readonly ILogger<RoundService> _logger;

    public RoundService(
        IRoundRepository roundRepository,
        ICourseRepository courseRepository,
        IUserRepository userRepository,
        CaddieAIDbContext context,
        ILogger<RoundService> logger)
    {
        _roundRepository = roundRepository;
        _courseRepository = courseRepository;
        _userRepository = userRepository;
        _context = context;
        _logger = logger;
    }

    public async Task<RoundModel?> GetRoundByIdAsync(int id)
    {
        try
        {
            var round = await _roundRepository.GetByIdAsync(id);
            return round == null ? null : MapToRoundModel(round);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting round by ID {RoundId}", id);
            throw;
        }
    }

    public async Task<RoundModel?> GetRoundWithDetailsAsync(int id)
    {
        try
        {
            var round = await _roundRepository.GetByIdWithDetailsAsync(id);
            if (round == null) return null;

            var roundModel = MapToRoundModel(round);
            
            // Load hole scores for detailed round view
            var holeScores = await GetHoleScoresByRoundIdAsync(id);
            roundModel.HoleScores = holeScores.ToList();
            
            return roundModel;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting round with details by ID {RoundId}", id);
            throw;
        }
    }

    public async Task<IEnumerable<RoundModel>> GetRoundsByUserIdAsync(int userId)
    {
        try
        {
            var rounds = await _roundRepository.GetByUserIdAsync(userId);
            return rounds.Select(MapToRoundModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rounds for user {UserId}", userId);
            throw;
        }
    }

    public async Task<IEnumerable<RoundModel>> GetRoundsByUserIdWithDateRangeAsync(int userId, DateOnly startDate, DateOnly endDate)
    {
        try
        {
            if (startDate > endDate)
            {
                throw new ArgumentException("Start date cannot be later than end date");
            }

            var rounds = await _roundRepository.GetByUserIdWithDateRangeAsync(userId, startDate, endDate);
            return rounds.Select(MapToRoundModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rounds for user {UserId} between {StartDate} and {EndDate}", userId, startDate, endDate);
            throw;
        }
    }

    public async Task<IEnumerable<RoundModel>> GetRoundsByCourseIdAsync(int courseId)
    {
        try
        {
            var rounds = await _roundRepository.GetByCourseIdAsync(courseId);
            return rounds.Select(MapToRoundModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rounds for course {CourseId}", courseId);
            throw;
        }
    }

    public async Task<IEnumerable<RoundModel>> GetActiveRoundsAsync()
    {
        try
        {
            var rounds = await _roundRepository.GetActiveRoundsAsync();
            return rounds.Select(MapToRoundModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active rounds");
            throw;
        }
    }

    public async Task<IEnumerable<RoundModel>> GetRoundsByStatusAsync(ServiceRoundStatus status)
    {
        try
        {
            var statusEnum = MapServiceStatusToEnum(status);
            var rounds = await _roundRepository.GetRoundsByStatusAsync(statusEnum);
            return rounds.Select(MapToRoundModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rounds with status {Status}", status);
            throw;
        }
    }

    public async Task<RoundModel?> GetActiveRoundByUserIdAsync(int userId)
    {
        try
        {
            var round = await _roundRepository.GetActiveRoundByUserIdAsync(userId);
            if (round == null) return null;

            var roundModel = MapToRoundModel(round);
            
            // Load hole scores for active round
            var holeScores = await GetHoleScoresByRoundIdAsync(round.Id);
            roundModel.HoleScores = holeScores.ToList();
            
            return roundModel;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active round for user {UserId}", userId);
            throw;
        }
    }

    public async Task<RoundModel> CreateRoundAsync(int userId, CreateRoundModel model)
    {
        try
        {
            // Validate user exists
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException($"User with ID {userId} not found");
            }

            // Validate course exists (if courseId is provided)
            if (model.CourseId.HasValue)
            {
                var course = await _courseRepository.GetByIdAsync(model.CourseId.Value);
                if (course == null)
                {
                    throw new InvalidOperationException($"Course with ID {model.CourseId} not found");
                }
            }

            // Check if user already has an active round
            if (await _roundRepository.UserHasActiveRoundAsync(userId))
            {
                throw new InvalidOperationException("User already has an active round in progress");
            }

            var round = new Round
            {
                UserId = userId,
                CourseId = model.CourseId,
                RoundDate = model.RoundDate
            };

            var createdRound = await _roundRepository.CreateAsync(round);
            _logger.LogInformation("Round created successfully: ID {RoundId} for user {UserId} at course {CourseId}", 
                createdRound.Id, userId, model.CourseId);

            return MapToRoundModel(createdRound);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating round for user {UserId} at course {CourseId}", userId, model.CourseId);
            throw;
        }
    }

    public async Task<RoundModel> UpdateRoundAsync(int id, UpdateRoundModel model)
    {
        try
        {
            var existingRound = await _roundRepository.GetByIdAsync(id);
            if (existingRound == null)
            {
                throw new InvalidOperationException($"Round with ID {id} not found");
            }

            // Validate current hole number if provided
            if (model.CurrentHole.HasValue && existingRound.CourseId.HasValue)
            {
                var course = await _courseRepository.GetByIdAsync(existingRound.CourseId.Value);
                var totalHoles = course?.Holes?.Count ?? 18; // Default to 18 if not specified
                if (model.CurrentHole.Value > totalHoles)
                {
                    throw new ArgumentException($"Current hole {model.CurrentHole.Value} exceeds course total holes {totalHoles}");
                }
            }

            // Update properties (simplified to match DAL model)
            if (model.CurrentHole.HasValue) existingRound.CurrentHole = model.CurrentHole.Value;
            if (model.TotalScore.HasValue) existingRound.TotalScore = model.TotalScore.Value;

            // Handle status changes
            if (model.Status.HasValue)
            {
                await ValidateStatusTransitionAsync(existingRound, model.Status.Value);
                existingRound.StatusId = GetStatusIdByEnum(MapServiceStatusToEnum(model.Status.Value));
            }

            var updatedRound = await _roundRepository.UpdateAsync(existingRound);
            _logger.LogInformation("Round updated successfully: ID {RoundId}", id);

            return MapToRoundModel(updatedRound);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating round {RoundId}", id);
            throw;
        }
    }

    public async Task<bool> DeleteRoundAsync(int id)
    {
        try
        {
            var result = await _roundRepository.DeleteAsync(id);
            if (result)
            {
                _logger.LogInformation("Round deleted successfully: ID {RoundId}", id);
            }
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting round {RoundId}", id);
            throw;
        }
    }

    public async Task<RoundModel> StartRoundAsync(int userId, StartRoundModel model)
    {
        try
        {
            // Check if user already has an active round
            if (await _roundRepository.UserHasActiveRoundAsync(userId))
            {
                throw new InvalidOperationException("User already has an active round in progress");
            }

            var createModel = new CreateRoundModel
            {
                UserId = userId,
                CourseId = model.CourseId,
                RoundDate = model.RoundDate ?? DateOnly.FromDateTime(DateTime.Now)
            };

            var round = await CreateRoundAsync(userId, createModel);

            // Start the round by updating the created round
            var existingRound = await _roundRepository.GetByIdAsync(round.Id);
            if (existingRound != null)
            {
                var inProgressStatusId = GetStatusIdByEnum(RoundStatusEnum.InProgress);
                existingRound.StatusId = inProgressStatusId;
                existingRound.CurrentHole = 1;
                existingRound.StartTime = DateTime.UtcNow;
                await _roundRepository.UpdateAsync(existingRound);
                
                // Note: Hole scores will be created manually by user, not auto-populated
                // This supports the manual score entry workflow and future AI integration
                
                _logger.LogInformation("Round started successfully: ID {RoundId}", round.Id);
                
                // Return the round with course details loaded (but no hole scores yet)
                return await GetRoundWithDetailsAsync(round.Id) ?? MapToRoundModel(existingRound);
            }

            return round;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting round for user {UserId} at course {CourseId}", userId, model.CourseId);
            throw;
        }
    }

    public async Task<RoundModel> PauseRoundAsync(int roundId)
    {
        try
        {
            var round = await _roundRepository.GetByIdAsync(roundId);
            if (round == null)
            {
                throw new InvalidOperationException($"Round with ID {roundId} not found");
            }

            var currentStatus = (RoundStatusEnum)round.StatusId;
            if (currentStatus != RoundStatusEnum.InProgress)
            {
                throw new InvalidOperationException($"Can only pause rounds that are in progress. Current status: {currentStatus}");
            }

            var pausedStatusId = GetStatusIdByEnum(RoundStatusEnum.Paused);
            round.StatusId = pausedStatusId;
            var updatedRound = await _roundRepository.UpdateAsync(round);
            
            _logger.LogInformation("Round paused successfully: ID {RoundId}", roundId);
            return MapToRoundModel(updatedRound);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error pausing round {RoundId}", roundId);
            throw;
        }
    }

    public async Task<RoundModel> ResumeRoundAsync(int roundId)
    {
        try
        {
            var round = await _roundRepository.GetByIdAsync(roundId);
            if (round == null)
            {
                throw new InvalidOperationException($"Round with ID {roundId} not found");
            }

            var currentStatus = (RoundStatusEnum)round.StatusId;
            if (currentStatus != RoundStatusEnum.Paused)
            {
                throw new InvalidOperationException($"Can only resume rounds that are paused. Current status: {currentStatus}");
            }

            var inProgressStatusId = GetStatusIdByEnum(RoundStatusEnum.InProgress);
            round.StatusId = inProgressStatusId;
            var updatedRound = await _roundRepository.UpdateAsync(round);
            
            _logger.LogInformation("Round resumed successfully: ID {RoundId}", roundId);
            return MapToRoundModel(updatedRound);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resuming round {RoundId}", roundId);
            throw;
        }
    }

    public async Task<RoundModel> CompleteRoundAsync(int roundId, CompleteRoundModel model)
    {
        try
        {
            var round = await _roundRepository.GetByIdAsync(roundId);
            if (round == null)
            {
                throw new InvalidOperationException($"Round with ID {roundId} not found");
            }

            var currentStatus = (RoundStatusEnum)round.StatusId;
            if (currentStatus != RoundStatusEnum.InProgress && currentStatus != RoundStatusEnum.Paused)
            {
                throw new InvalidOperationException($"Can only complete rounds that are in progress or paused. Current status: {currentStatus}");
            }

            // Validate score if provided
            if (await ValidateRoundScoreAsync(roundId, model.TotalScore))
            {
                var completedStatusId = GetStatusIdByEnum(RoundStatusEnum.Completed);
                round.StatusId = completedStatusId;
                round.TotalScore = model.TotalScore;
                round.EndTime = DateTime.UtcNow;

                var updatedRound = await _roundRepository.UpdateAsync(round);
                
                _logger.LogInformation("Round completed successfully: ID {RoundId} with score {TotalScore}", roundId, model.TotalScore);
                return MapToRoundModel(updatedRound);
            }
            else
            {
                throw new ArgumentException($"Invalid score {model.TotalScore} for round {roundId}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing round {RoundId}", roundId);
            throw;
        }
    }

    public async Task<RoundModel> AbandonRoundAsync(int roundId, string? reason = null)
    {
        try
        {
            var round = await _roundRepository.GetByIdAsync(roundId);
            if (round == null)
            {
                throw new InvalidOperationException($"Round with ID {roundId} not found");
            }

            var currentStatus = (RoundStatusEnum)round.StatusId;
            if (currentStatus == RoundStatusEnum.Completed || currentStatus == RoundStatusEnum.Abandoned)
            {
                throw new InvalidOperationException($"Cannot abandon a round that is already {currentStatus.ToString().ToLower()}");
            }

            var abandonedStatusId = GetStatusIdByEnum(RoundStatusEnum.Abandoned);
            round.StatusId = abandonedStatusId;
            round.EndTime = DateTime.UtcNow;

            var updatedRound = await _roundRepository.UpdateAsync(round);
            
            _logger.LogInformation("Round abandoned successfully: ID {RoundId}. Reason: {Reason}", roundId, reason ?? "Not specified");
            return MapToRoundModel(updatedRound);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error abandoning round {RoundId}", roundId);
            throw;
        }
    }

    public async Task<bool> UpdateRoundStatusAsync(int roundId, ServiceRoundStatus status)
    {
        try
        {
            var round = await _roundRepository.GetByIdAsync(roundId);
            if (round == null) return false;

            await ValidateStatusTransitionAsync(round, status);
            
            var statusId = GetStatusIdByEnum(MapServiceStatusToEnum(status));
            round.StatusId = statusId;
            await _roundRepository.UpdateAsync(round);
            
            _logger.LogInformation("Round status updated successfully: ID {RoundId} to {Status}", roundId, status);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating round status {RoundId} to {Status}", roundId, status);
            throw;
        }
    }

    public async Task<bool> UpdateCurrentHoleAsync(int roundId, int holeNumber)
    {
        try
        {
            var round = await _roundRepository.GetByIdAsync(roundId);
            if (round == null || round.CourseId == null) return false;

            var course = await _courseRepository.GetByIdAsync(round.CourseId.Value);
            var totalHoles = course?.Holes?.Count ?? 18; // Default to 18 if not specified
            if (holeNumber > totalHoles)
            {
                throw new ArgumentException($"Hole number {holeNumber} exceeds course total holes {totalHoles}");
            }

            if (holeNumber < 1)
            {
                throw new ArgumentException("Hole number must be greater than 0");
            }

            round.CurrentHole = holeNumber;
            await _roundRepository.UpdateAsync(round);
            
            _logger.LogInformation("Current hole updated successfully: Round {RoundId} to hole {HoleNumber}", roundId, holeNumber);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating current hole for round {RoundId} to hole {HoleNumber}", roundId, holeNumber);
            throw;
        }
    }

    public async Task<bool> UserHasActiveRoundAsync(int userId)
    {
        try
        {
            return await _roundRepository.UserHasActiveRoundAsync(userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if user {UserId} has active round", userId);
            throw;
        }
    }

    public async Task<bool> ValidateRoundScoreAsync(int roundId, int score)
    {
        try
        {
            if (score < 18) // Minimum possible score (hole-in-one on every hole for 18-hole course)
            {
                return false;
            }

            var round = await _roundRepository.GetByIdAsync(roundId);
            if (round == null || round.CourseId == null) return false;

            var course = await _courseRepository.GetByIdAsync(round.CourseId.Value);
            if (course == null) return false;

            // Allow reasonable maximum (e.g., 10 strokes per hole maximum)
            var totalHoles = course.Holes?.Count ?? 18; // Default to 18 if not specified
            var maxReasonableScore = totalHoles * 10;
            
            return score <= maxReasonableScore;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating score {Score} for round {RoundId}", score, roundId);
            throw;
        }
    }

    public async Task<IEnumerable<RoundModel>> GetRecentRoundsAsync(int userId, int count = 10)
    {
        try
        {
            var rounds = await _roundRepository.GetRecentRoundsAsync(userId, count);
            return rounds.Select(MapToRoundModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recent rounds for user {UserId}", userId);
            throw;
        }
    }

    public async Task<PaginatedResult<RoundModel>> GetPaginatedRoundsAsync(int page, int pageSize, int? userId = null, ServiceRoundStatus? status = null)
    {
        try
        {
            var statusEnum = status.HasValue ? MapServiceStatusToEnum(status.Value) : (RoundStatusEnum?)null;
            var rounds = await _roundRepository.GetPaginatedAsync(page, pageSize, userId, statusEnum);
            var totalCount = await _roundRepository.GetTotalCountAsync(userId, statusEnum);
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            return new PaginatedResult<RoundModel>
            {
                Data = rounds.Select(MapToRoundModel),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages,
                HasNextPage = page < totalPages,
                HasPreviousPage = page > 1
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paginated rounds (page: {Page}, size: {PageSize}, user: {UserId}, status: {Status})", 
                page, pageSize, userId, status);
            throw;
        }
    }

    public async Task<RoundStatisticsModel?> GetRoundStatisticsAsync(int userId, DateOnly? startDate = null, DateOnly? endDate = null)
    {
        try
        {
            var stats = await _roundRepository.GetRoundStatisticsAsync(userId, startDate, endDate);
            if (stats == null) return null;

            // Use dynamic object properties
            var statsDict = (IDictionary<string, object>)stats;
            
            return new RoundStatisticsModel
            {
                TotalRounds = Convert.ToInt32(statsDict["TotalRounds"]),
                AverageScore = statsDict.ContainsKey("AverageScore") ? Convert.ToDouble(statsDict["AverageScore"]) : null,
                BestScore = statsDict.ContainsKey("BestScore") ? Convert.ToInt32(statsDict["BestScore"]) : null,
                WorstScore = statsDict.ContainsKey("WorstScore") ? Convert.ToInt32(statsDict["WorstScore"]) : null,
                StartDate = startDate,
                EndDate = endDate
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting round statistics for user {UserId}", userId);
            throw;
        }
    }

    private async Task ValidateStatusTransitionAsync(Round round, ServiceRoundStatus newStatus)
    {
        var currentStatus = MapEnumToServiceStatus((RoundStatusEnum)round.StatusId);
        
        // Define valid transitions
        var validTransitions = new Dictionary<ServiceRoundStatus, List<ServiceRoundStatus>>
        {
            { ServiceRoundStatus.NotStarted, new List<ServiceRoundStatus> { ServiceRoundStatus.InProgress, ServiceRoundStatus.Abandoned } },
            { ServiceRoundStatus.InProgress, new List<ServiceRoundStatus> { ServiceRoundStatus.Paused, ServiceRoundStatus.Completed, ServiceRoundStatus.Abandoned } },
            { ServiceRoundStatus.Paused, new List<ServiceRoundStatus> { ServiceRoundStatus.InProgress, ServiceRoundStatus.Completed, ServiceRoundStatus.Abandoned } },
            { ServiceRoundStatus.Completed, new List<ServiceRoundStatus>() }, // Cannot transition from completed
            { ServiceRoundStatus.Abandoned, new List<ServiceRoundStatus>() }  // Cannot transition from abandoned
        };

        if (!validTransitions[currentStatus].Contains(newStatus))
        {
            throw new InvalidOperationException($"Invalid status transition from {currentStatus} to {newStatus}");
        }

        // Additional validation for starting rounds
        if (newStatus == ServiceRoundStatus.InProgress && currentStatus == ServiceRoundStatus.NotStarted)
        {
            if (await _roundRepository.UserHasActiveRoundAsync(round.UserId))
            {
                throw new InvalidOperationException("User already has an active round in progress");
            }
        }
    }

    private RoundModel MapToRoundModel(Round round)
    {
        return new RoundModel
        {
            Id = round.Id,
            UserId = round.UserId,
            CourseId = round.CourseId,
            RoundDate = round.RoundDate,
            StartTime = round.StartTime,
            EndTime = round.EndTime,
            CurrentHole = round.CurrentHole,
            Status = MapEnumToServiceStatus((RoundStatusEnum)round.StatusId),
            TotalScore = round.TotalScore,
            CreatedAt = round.CreatedAt,
            UpdatedAt = round.UpdatedAt
        };
    }

    private ServiceRoundStatus MapEnumToServiceStatus(RoundStatusEnum status)
    {
        return status switch
        {
            RoundStatusEnum.NotStarted => ServiceRoundStatus.NotStarted,
            RoundStatusEnum.InProgress => ServiceRoundStatus.InProgress,
            RoundStatusEnum.Paused => ServiceRoundStatus.Paused,
            RoundStatusEnum.Completed => ServiceRoundStatus.Completed,
            RoundStatusEnum.Abandoned => ServiceRoundStatus.Abandoned,
            _ => ServiceRoundStatus.NotStarted
        };
    }

    private RoundStatusEnum MapServiceStatusToEnum(ServiceRoundStatus status)
    {
        return status switch
        {
            ServiceRoundStatus.NotStarted => RoundStatusEnum.NotStarted,
            ServiceRoundStatus.InProgress => RoundStatusEnum.InProgress,
            ServiceRoundStatus.Paused => RoundStatusEnum.Paused,
            ServiceRoundStatus.Completed => RoundStatusEnum.Completed,
            ServiceRoundStatus.Abandoned => RoundStatusEnum.Abandoned,
            _ => RoundStatusEnum.NotStarted
        };
    }

    // Removed duplicate methods - using enum-based mapping now

    private int GetStatusIdByEnum(RoundStatusEnum status)
    {
        return (int)status;
    }

    // Hole Score Management Implementation
    public async Task<HoleScoreModel?> GetHoleScoreByIdAsync(int id)
    {
        try
        {
            var holeScore = await _context.HoleScores
                .Include(hs => hs.Hole)
                .FirstOrDefaultAsync(hs => hs.Id == id);
            
            return holeScore == null ? null : MapToHoleScoreModel(holeScore);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting hole score by ID {HoleScoreId}", id);
            throw;
        }
    }

    public async Task<HoleScoreModel?> GetHoleScoreByRoundAndHoleAsync(int roundId, int holeNumber)
    {
        try
        {
            var holeScore = await _context.HoleScores
                .Include(hs => hs.Hole)
                .FirstOrDefaultAsync(hs => hs.RoundId == roundId && hs.HoleNumber == holeNumber);
            
            return holeScore == null ? null : MapToHoleScoreModel(holeScore);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting hole score for round {RoundId} hole {HoleNumber}", roundId, holeNumber);
            throw;
        }
    }

    public async Task<IEnumerable<HoleScoreModel>> GetHoleScoresByRoundIdAsync(int roundId)
    {
        try
        {
            var holeScores = await _context.HoleScores
                .Include(hs => hs.Hole)
                .Where(hs => hs.RoundId == roundId)
                .OrderBy(hs => hs.HoleNumber)
                .ToListAsync();
            
            return holeScores.Select(MapToHoleScoreModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting hole scores for round {RoundId}", roundId);
            throw;
        }
    }

    public async Task<HoleScoreSummaryModel> GetHoleScoreSummaryAsync(int roundId)
    {
        try
        {
            var holeScores = await GetHoleScoresByRoundIdAsync(roundId);
            return HoleScoreSummaryModel.FromHoleScores(roundId, holeScores);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting hole score summary for round {RoundId}", roundId);
            throw;
        }
    }

    public async Task<HoleScoreModel> CreateHoleScoreAsync(int roundId, CreateHoleScoreModel model)
    {
        try
        {
            // Validate the round exists and user has access
            var round = await _context.Rounds.FirstOrDefaultAsync(r => r.Id == roundId);
            if (round == null)
            {
                throw new InvalidOperationException($"Round with ID {roundId} not found");
            }

            // Get the hole information
            var hole = await _context.Holes
                .FirstOrDefaultAsync(h => h.CourseId == round.CourseId && h.HoleNumber == model.HoleNumber);
            if (hole == null)
            {
                throw new InvalidOperationException($"Hole {model.HoleNumber} not found for course");
            }

            // Check if hole score already exists
            var existingScore = await _context.HoleScores
                .FirstOrDefaultAsync(hs => hs.RoundId == roundId && hs.HoleNumber == model.HoleNumber);
            if (existingScore != null)
            {
                throw new InvalidOperationException($"Hole score already exists for hole {model.HoleNumber}");
            }

            var holeScore = new caddie.portal.dal.Models.HoleScore
            {
                RoundId = roundId,
                HoleId = hole.Id,
                HoleNumber = model.HoleNumber,
                Score = model.Score,
                UserId = round.UserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.HoleScores.Add(holeScore);
            await _context.SaveChangesAsync();

            // Reload with hole information
            await _context.Entry(holeScore).Reference(hs => hs.Hole).LoadAsync();
            
            return MapToHoleScoreModel(holeScore);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating hole score for round {RoundId} hole {HoleNumber}", roundId, model.HoleNumber);
            throw;
        }
    }

    public async Task<HoleScoreModel> UpdateHoleScoreAsync(int id, UpdateHoleScoreModel model)
    {
        try
        {
            var holeScore = await _context.HoleScores
                .Include(hs => hs.Hole)
                .FirstOrDefaultAsync(hs => hs.Id == id);
            
            if (holeScore == null)
            {
                throw new InvalidOperationException($"Hole score with ID {id} not found");
            }

            // Update fields (simplified to match DAL model)
            if (model.Score.HasValue) holeScore.Score = model.Score;
            
            holeScore.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            
            return MapToHoleScoreModel(holeScore);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating hole score {HoleScoreId}", id);
            throw;
        }
    }

    public async Task<bool> DeleteHoleScoreAsync(int id)
    {
        try
        {
            var holeScore = await _context.HoleScores.FirstOrDefaultAsync(hs => hs.Id == id);
            if (holeScore == null)
            {
                return false;
            }

            _context.HoleScores.Remove(holeScore);
            await _context.SaveChangesAsync();
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting hole score {HoleScoreId}", id);
            throw;
        }
    }

    public async Task<bool> InitializeHoleScoresForRoundAsync(int roundId)
    {
        try
        {
            var round = await _context.Rounds.FirstOrDefaultAsync(r => r.Id == roundId);
            if (round == null)
            {
                return false;
            }

            // Call the database function to create default hole scores
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"SELECT create_default_hole_scores({roundId}, {round.CourseId})");
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing hole scores for round {RoundId}", roundId);
            throw;
        }
    }

    public async Task<bool> ValidateHoleScoreAsync(int roundId, int holeNumber, CreateHoleScoreModel model)
    {
        try
        {
            // Basic validation
            if (holeNumber < 1 || holeNumber > 18) return false;
            if (model.Score.HasValue && (model.Score < 1 || model.Score > 15)) return false;
            if (model.Putts.HasValue && (model.Putts < 0 || model.Putts > 10)) return false;
            if (model.PenaltyStrokes.HasValue && (model.PenaltyStrokes < 0 || model.PenaltyStrokes > 5)) return false;

            // Business logic validation
            if (model.Score.HasValue && model.Putts.HasValue && model.Putts > model.Score) return false;

            // Check if round and hole exist
            var round = await _context.Rounds.FirstOrDefaultAsync(r => r.Id == roundId);
            if (round == null) return false;

            var hole = await _context.Holes
                .FirstOrDefaultAsync(h => h.CourseId == round.CourseId && h.HoleNumber == holeNumber);
            if (hole == null) return false;

            // Par 3 holes can't have fairway hits
            if (model.FairwayHit == true && hole.Par == 3) return false;

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating hole score for round {RoundId} hole {HoleNumber}", roundId, holeNumber);
            return false;
        }
    }

    public async Task<bool> HoleScoreExistsAsync(int roundId, int holeNumber)
    {
        try
        {
            return await _context.HoleScores
                .AnyAsync(hs => hs.RoundId == roundId && hs.HoleNumber == holeNumber);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if hole score exists for round {RoundId} hole {HoleNumber}", roundId, holeNumber);
            throw;
        }
    }

    public async Task<HoleScoreModel> CompleteHoleAsync(int roundId, CompleteHoleModel model)
    {
        try
        {
            // Validate the round exists and user has access
            var round = await _context.Rounds
                .Include(r => r.Course)
                .FirstOrDefaultAsync(r => r.Id == roundId);
            if (round == null)
            {
                throw new InvalidOperationException($"Round with ID {roundId} not found");
            }

            if (!round.CourseId.HasValue)
            {
                throw new InvalidOperationException($"Round {roundId} does not have a course assigned");
            }

            // Get or create hole information
            var hole = await _context.Holes
                .FirstOrDefaultAsync(h => h.CourseId == round.CourseId.Value && 
                                        h.HoleNumber == model.HoleNumber &&
                                        h.UserId == round.UserId);

            if (hole == null)
            {
                // Auto-create hole record if it doesn't exist and par is provided
                if (!model.Par.HasValue)
                {
                    throw new InvalidOperationException($"Par value is required for first-time completion of hole {model.HoleNumber}");
                }

                hole = new Hole
                {
                    CourseId = round.CourseId.Value,
                    UserId = round.UserId,
                    HoleNumber = model.HoleNumber,
                    Par = model.Par.Value,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Holes.Add(hole);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Auto-created hole {HoleNumber} for course {CourseId} by user {UserId}", 
                    model.HoleNumber, round.CourseId, round.UserId);
            }
            else if (model.Par.HasValue && hole.Par != model.Par.Value)
            {
                // Update par if different value provided
                hole.Par = model.Par.Value;
                hole.UpdatedAt = DateTime.UtcNow;
                _context.Holes.Update(hole);
            }

            // Check if hole score already exists
            var existingScore = await _context.HoleScores
                .FirstOrDefaultAsync(hs => hs.RoundId == roundId && hs.HoleNumber == model.HoleNumber);
            if (existingScore != null)
            {
                // Update existing score
                existingScore.Score = model.Score;
                existingScore.UpdatedAt = DateTime.UtcNow;
                _context.HoleScores.Update(existingScore);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Updated hole score for round {RoundId} hole {HoleNumber}: {Score}", 
                    roundId, model.HoleNumber, model.Score);
                
                return MapToHoleScoreModel(existingScore);
            }

            // Create new hole score
            var holeScore = new caddie.portal.dal.Models.HoleScore
            {
                RoundId = roundId,
                HoleId = hole.Id,
                HoleNumber = model.HoleNumber,
                Score = model.Score,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.HoleScores.Add(holeScore);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Completed hole {HoleNumber} for round {RoundId} with score {Score}", 
                model.HoleNumber, roundId, model.Score);

            return MapToHoleScoreModel(holeScore);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing hole {HoleNumber} for round {RoundId}", model.HoleNumber, roundId);
            throw;
        }
    }

    private HoleScoreModel MapToHoleScoreModel(caddie.portal.dal.Models.HoleScore holeScore)
    {
        var model = new HoleScoreModel
        {
            Id = holeScore.Id,
            RoundId = holeScore.RoundId,
            HoleId = holeScore.HoleId,
            HoleNumber = holeScore.HoleNumber,
            Score = holeScore.Score,
            // Set default values for properties not in simplified DAL model
            Putts = null,
            FairwayHit = null,
            GreenInRegulation = null,
            UpAndDown = null,
            SandSave = null,
            PenaltyStrokes = null,
            DistanceToPinYards = null,
            HoleMetadata = null,
            CreatedAt = holeScore.CreatedAt ?? DateTime.UtcNow,
            UpdatedAt = holeScore.UpdatedAt ?? DateTime.UtcNow
        };

        // Add hole information if available
        if (holeScore.Hole != null)
        {
            model.Hole = new HoleModel
            {
                Id = holeScore.Hole.Id,
                CourseId = holeScore.Hole.CourseId,
                HoleNumber = holeScore.Hole.HoleNumber,
                UserId = holeScore.Hole.UserId,
                Par = holeScore.Hole.Par,
                // Set default values for properties not in simplified DAL model
                Name = null,
                YardageBlack = null,
                YardageBlue = null,
                YardageWhite = null,
                YardageRed = null,
                StrokeIndex = null,
                LadiesYardage = null,
                LadiesPar = null,
                LadiesStrokeIndex = null,
                TeeLocation = null,
                PinLocation = null,
                HoleDescription = null,
                HoleTips = null,
                PlayingTips = null,
                SimpleHazards = null,
                HoleMetadata = null,
                CreatedAt = holeScore.Hole.CreatedAt,
                UpdatedAt = holeScore.Hole.UpdatedAt,
                // Legacy properties for backward compatibility
                YardageMen = null,
                YardageWomen = null,
                Handicap = null,
                Description = null
            };
        }

        return model;
    }

    #region Enhanced Round Management Methods

    public async Task<CompleteHoleResult> CompleteHoleWithProgressionAsync(int roundId, int holeNumber, int score, int? par = null)
    {
        try
        {
            // Validate the round exists and user has access
            var round = await _context.Rounds
                .Include(r => r.Course)
                .FirstOrDefaultAsync(r => r.Id == roundId);
            if (round == null)
            {
                throw new InvalidOperationException($"Round with ID {roundId} not found");
            }

            if (!round.CourseId.HasValue)
            {
                throw new InvalidOperationException($"Round {roundId} does not have a course assigned");
            }

            // Check round status
            var currentStatus = (RoundStatusEnum)round.StatusId;
            if (currentStatus == RoundStatusEnum.Completed || currentStatus == RoundStatusEnum.Abandoned)
            {
                throw new InvalidOperationException("Cannot complete holes for a finished round");
            }

            // Get or create hole information
            var hole = await _context.Holes
                .FirstOrDefaultAsync(h => h.CourseId == round.CourseId.Value && 
                                        h.HoleNumber == holeNumber &&
                                        h.UserId == round.UserId);

            if (hole == null)
            {
                // Auto-create hole record if it doesn't exist and par is provided
                if (!par.HasValue)
                {
                    throw new InvalidOperationException($"Par value is required for first-time completion of hole {holeNumber}");
                }

                hole = new Hole
                {
                    CourseId = round.CourseId.Value,
                    UserId = round.UserId,
                    HoleNumber = holeNumber,
                    Par = par.Value,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Holes.Add(hole);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Auto-created hole {HoleNumber} for course {CourseId} by user {UserId}", 
                    holeNumber, round.CourseId, round.UserId);
            }
            else if (par.HasValue && hole.Par != par.Value)
            {
                // Update par if different value provided
                hole.Par = par.Value;
                hole.UpdatedAt = DateTime.UtcNow;
                _context.Holes.Update(hole);
            }

            // Check if hole score already exists
            var existingScore = await _context.HoleScores
                .FirstOrDefaultAsync(hs => hs.RoundId == roundId && hs.HoleNumber == holeNumber);
            
            if (existingScore != null)
            {
                // Update existing score
                existingScore.Score = score;
                existingScore.UpdatedAt = DateTime.UtcNow;
                _context.HoleScores.Update(existingScore);
            }
            else
            {
                // Create new hole score
                existingScore = new caddie.portal.dal.Models.HoleScore
                {
                    RoundId = roundId,
                    HoleId = hole.Id,
                    HoleNumber = holeNumber,
                    Score = score,
                    UserId = round.UserId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.HoleScores.Add(existingScore);
            }

            // Update round progression
            var nextHole = holeNumber + 1;
            var isComplete = false;

            // Check if this completes the round (hole 18)
            if (holeNumber >= 18)
            {
                isComplete = true;
                round.StatusId = GetStatusIdByEnum(RoundStatusEnum.Completed);
                round.EndTime = DateTime.UtcNow;
                round.CurrentHole = 18;
            }
            else
            {
                round.CurrentHole = nextHole;
            }

            // Calculate total score
            var totalScore = await CalculateRoundTotalInternalAsync(roundId);
            round.TotalScore = totalScore;
            round.UpdatedAt = DateTime.UtcNow;

            _context.Rounds.Update(round);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} completed hole {HoleNumber} for round {RoundId} with score {Score}. Round complete: {IsComplete}", 
                round.UserId, holeNumber, roundId, score, isComplete);

            // Prepare response
            var completedHoleModel = MapToHoleScoreModel(existingScore);
            var result = new CompleteHoleResult
            {
                CompletedHole = completedHoleModel,
                CurrentHole = round.CurrentHole ?? 1,
                TotalScore = totalScore,
                IsRoundComplete = isComplete
            };

            // Get next hole info if not complete
            if (!isComplete)
            {
                var nextHoleInfo = await _context.Holes
                    .FirstOrDefaultAsync(h => h.CourseId == round.CourseId && 
                                            h.HoleNumber == nextHole &&
                                            h.UserId == round.UserId);

                if (nextHoleInfo != null)
                {
                    result.NextHole = new HoleInfo
                    {
                        HoleNumber = nextHoleInfo.HoleNumber,
                        Par = nextHoleInfo.Par,
                        // HoleName = nextHoleInfo.Name, // Field removed in simplified model
                        // HoleDescription = nextHoleInfo.HoleDescription // Field removed in simplified model
                    };
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing hole {HoleNumber} for round {RoundId} with progression", holeNumber, roundId);
            throw;
        }
    }

    public async Task<RoundProgress> GetRoundProgressAsync(int roundId)
    {
        try
        {
            var round = await _context.Rounds
                .FirstOrDefaultAsync(r => r.Id == roundId);
            if (round == null)
            {
                throw new InvalidOperationException($"Round with ID {roundId} not found");
            }

            var holeScores = await _context.HoleScores
                .Include(hs => hs.Hole)
                .Where(hs => hs.RoundId == roundId && hs.Score.HasValue)
                .OrderBy(hs => hs.HoleNumber)
                .ToListAsync();

            var holeScoreModels = holeScores.Select(MapToHoleScoreModel).ToList();
            var totalScore = holeScores.Sum(hs => hs.Score ?? 0);
            var totalPar = holeScores.Where(hs => hs.Hole?.Par.HasValue == true).Sum(hs => hs.Hole!.Par!.Value);

            return new RoundProgress
            {
                HolesCompleted = holeScores.Count,
                CurrentHole = round.CurrentHole ?? 1,
                TotalScore = totalScore,
                CompletedHoles = holeScoreModels,
                IsRoundComplete = (RoundStatusEnum)round.StatusId == RoundStatusEnum.Completed,
                TotalPar = totalPar > 0 ? totalPar : null,
                ScoreToPar = totalPar > 0 ? totalScore - totalPar : null
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting round progress for round {RoundId}", roundId);
            throw;
        }
    }

    public async Task<bool> IsRoundCompleteAsync(int roundId)
    {
        try
        {
            var round = await _context.Rounds
                .FirstOrDefaultAsync(r => r.Id == roundId);
            
            if (round == null)
            {
                return false;
            }

            return (RoundStatusEnum)round.StatusId == RoundStatusEnum.Completed;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if round is complete for round {RoundId}", roundId);
            throw;
        }
    }

    public async Task<int> CalculateRoundTotalAsync(int roundId)
    {
        try
        {
            return await CalculateRoundTotalInternalAsync(roundId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating round total for round {RoundId}", roundId);
            throw;
        }
    }

    private async Task<int> CalculateRoundTotalInternalAsync(int roundId)
    {
        var holeScores = await _context.HoleScores
            .Where(hs => hs.RoundId == roundId && hs.Score.HasValue)
            .ToListAsync();

        return holeScores.Sum(hs => hs.Score ?? 0);
    }

    #endregion
}