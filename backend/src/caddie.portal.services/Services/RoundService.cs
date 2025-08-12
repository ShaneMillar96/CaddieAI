using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using caddie.portal.dal.Repositories.Interfaces;
using caddie.portal.dal.Models;
using caddie.portal.dal.Context;
using ServiceRoundStatus = caddie.portal.services.Models.RoundStatus;
using DalRoundStatus = caddie.portal.dal.Models.RoundStatus;
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

            // Validate course exists
            var course = await _courseRepository.GetByIdAsync(model.CourseId);
            if (course == null)
            {
                throw new InvalidOperationException($"Course with ID {model.CourseId} not found");
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
                RoundDate = model.RoundDate,
                TemperatureCelsius = model.TemperatureCelsius,
                WindSpeedKmh = model.WindSpeedKmh,
                Notes = model.Notes?.Trim(),
                RoundMetadata = model.RoundMetadata?.Trim()
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
            if (model.CurrentHole.HasValue)
            {
                var course = await _courseRepository.GetByIdAsync(existingRound.CourseId);
                if (course != null && model.CurrentHole.Value > course.TotalHoles)
                {
                    throw new ArgumentException($"Current hole {model.CurrentHole.Value} exceeds course total holes {course.TotalHoles}");
                }
            }

            // Update properties
            if (model.CurrentHole.HasValue) existingRound.CurrentHole = model.CurrentHole.Value;
            if (model.TotalScore.HasValue) existingRound.TotalScore = model.TotalScore.Value;
            if (model.TotalPutts.HasValue) existingRound.TotalPutts = model.TotalPutts.Value;
            if (model.FairwaysHit.HasValue) existingRound.FairwaysHit = model.FairwaysHit.Value;
            if (model.GreensInRegulation.HasValue) existingRound.GreensInRegulation = model.GreensInRegulation.Value;
            if (model.TemperatureCelsius.HasValue) existingRound.TemperatureCelsius = model.TemperatureCelsius.Value;
            if (model.WindSpeedKmh.HasValue) existingRound.WindSpeedKmh = model.WindSpeedKmh.Value;
            if (model.Notes != null) existingRound.Notes = model.Notes.Trim();
            if (model.RoundMetadata != null) existingRound.RoundMetadata = model.RoundMetadata.Trim();

            // Handle status changes
            if (model.Status.HasValue)
            {
                await ValidateStatusTransitionAsync(existingRound, model.Status.Value);
                var statusId = GetStatusIdByEnum(MapServiceStatusToEnum(model.Status.Value));
                existingRound.StatusId = statusId;
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
                RoundDate = model.RoundDate ?? DateOnly.FromDateTime(DateTime.Now),
                TemperatureCelsius = model.TemperatureCelsius,
                WindSpeedKmh = model.WindSpeedKmh,
                Notes = model.Notes,
                RoundMetadata = model.RoundMetadata
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
                round.TotalPutts = model.TotalPutts;
                round.FairwaysHit = model.FairwaysHit;
                round.GreensInRegulation = model.GreensInRegulation;
                round.Notes = model.Notes?.Trim();
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
            round.Notes = string.IsNullOrEmpty(reason) ? round.Notes : $"{round.Notes ?? ""} Abandoned: {reason}".Trim();
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
            if (round == null) return false;

            var course = await _courseRepository.GetByIdAsync(round.CourseId);
            if (course != null && holeNumber > course.TotalHoles)
            {
                throw new ArgumentException($"Hole number {holeNumber} exceeds course total holes {course.TotalHoles}");
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
            if (round == null) return false;

            var course = await _courseRepository.GetByIdAsync(round.CourseId);
            if (course == null) return false;

            // Allow reasonable maximum (e.g., 10 strokes per hole maximum)
            var maxReasonableScore = course.TotalHoles * 10;
            
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
                AveragePutts = statsDict.ContainsKey("AveragePutts") ? Convert.ToDouble(statsDict["AveragePutts"]) : null,
                AverageFairwaysHit = statsDict.ContainsKey("AverageFairwaysHit") ? Convert.ToDouble(statsDict["AverageFairwaysHit"]) : null,
                AverageGreensInRegulation = statsDict.ContainsKey("AverageGreensInRegulation") ? Convert.ToDouble(statsDict["AverageGreensInRegulation"]) : null,
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
            TotalPutts = round.TotalPutts,
            FairwaysHit = round.FairwaysHit,
            GreensInRegulation = round.GreensInRegulation,
            TemperatureCelsius = round.TemperatureCelsius,
            WindSpeedKmh = round.WindSpeedKmh,
            Notes = round.Notes,
            RoundMetadata = round.RoundMetadata,
            CreatedAt = round.CreatedAt,
            UpdatedAt = round.UpdatedAt
        };
    }

    private string GetRoundStatusFromDatabase(Round round)
    {
        return round.Status?.Name ?? "not_started";
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

    private ServiceRoundStatus MapStringToRoundStatus(string status)
    {
        return status.ToLower() switch
        {
            "not_started" => ServiceRoundStatus.NotStarted,
            "in_progress" => ServiceRoundStatus.InProgress,
            "paused" => ServiceRoundStatus.Paused,
            "completed" => ServiceRoundStatus.Completed,
            "abandoned" => ServiceRoundStatus.Abandoned,
            _ => ServiceRoundStatus.NotStarted
        };
    }

    private string MapRoundStatusToString(ServiceRoundStatus status)
    {
        return status switch
        {
            ServiceRoundStatus.NotStarted => "not_started",
            ServiceRoundStatus.InProgress => "in_progress",
            ServiceRoundStatus.Paused => "paused",
            ServiceRoundStatus.Completed => "completed",
            ServiceRoundStatus.Abandoned => "abandoned",
            _ => "not_started"
        };
    }

    private async Task<int> GetStatusIdByNameAsync(string statusName)
    {
        var status = await _context.RoundStatuses
            .FirstOrDefaultAsync(s => s.Name == statusName);
        return status?.Id ?? 1; // Default to "not_started" if not found
    }

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
                Putts = model.Putts,
                FairwayHit = model.FairwayHit,
                GreenInRegulation = model.GreenInRegulation,
                UpAndDown = model.UpAndDown,
                SandSave = model.SandSave,
                PenaltyStrokes = model.PenaltyStrokes,
                DistanceToPinYards = model.DistanceToPinYards,
                ClubUsed = model.ClubUsed,
                LiePosition = model.LiePosition,
                ShotNotes = model.ShotNotes,
                PerformanceNotes = model.PerformanceNotes,
                HoleMetadata = model.HoleMetadata != null ? System.Text.Json.JsonSerializer.Serialize(model.HoleMetadata) : null,
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

            // Update fields
            if (model.Score.HasValue) holeScore.Score = model.Score;
            if (model.Putts.HasValue) holeScore.Putts = model.Putts;
            if (model.FairwayHit.HasValue) holeScore.FairwayHit = model.FairwayHit;
            if (model.GreenInRegulation.HasValue) holeScore.GreenInRegulation = model.GreenInRegulation;
            if (model.UpAndDown.HasValue) holeScore.UpAndDown = model.UpAndDown;
            if (model.SandSave.HasValue) holeScore.SandSave = model.SandSave;
            if (model.PenaltyStrokes.HasValue) holeScore.PenaltyStrokes = model.PenaltyStrokes;
            if (model.DistanceToPinYards.HasValue) holeScore.DistanceToPinYards = model.DistanceToPinYards;
            if (model.ClubUsed != null) holeScore.ClubUsed = model.ClubUsed;
            if (model.LiePosition != null) holeScore.LiePosition = model.LiePosition;
            if (model.ShotNotes != null) holeScore.ShotNotes = model.ShotNotes;
            if (model.PerformanceNotes != null) holeScore.PerformanceNotes = model.PerformanceNotes;
            if (model.HoleMetadata != null) holeScore.HoleMetadata = System.Text.Json.JsonSerializer.Serialize(model.HoleMetadata);
            
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

    private HoleScoreModel MapToHoleScoreModel(caddie.portal.dal.Models.HoleScore holeScore)
    {
        Dictionary<string, object>? metadata = null;
        if (!string.IsNullOrEmpty(holeScore.HoleMetadata))
        {
            try
            {
                metadata = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(holeScore.HoleMetadata);
            }
            catch
            {
                // If deserialization fails, leave metadata as null
            }
        }

        var model = new HoleScoreModel
        {
            Id = holeScore.Id,
            RoundId = holeScore.RoundId,
            HoleId = holeScore.HoleId,
            HoleNumber = holeScore.HoleNumber,
            Score = holeScore.Score,
            Putts = holeScore.Putts,
            FairwayHit = holeScore.FairwayHit,
            GreenInRegulation = holeScore.GreenInRegulation,
            UpAndDown = holeScore.UpAndDown,
            SandSave = holeScore.SandSave,
            PenaltyStrokes = holeScore.PenaltyStrokes,
            DistanceToPinYards = holeScore.DistanceToPinYards,
            ClubUsed = holeScore.ClubUsed,
            LiePosition = holeScore.LiePosition,
            ShotNotes = holeScore.ShotNotes,
            PerformanceNotes = holeScore.PerformanceNotes,
            HoleMetadata = metadata,
            CreatedAt = holeScore.CreatedAt,
            UpdatedAt = holeScore.UpdatedAt
        };

        // Add hole information if available
        if (holeScore.Hole != null)
        {
            model.Hole = new HoleModel
            {
                Id = holeScore.Hole.Id,
                CourseId = holeScore.Hole.CourseId,
                HoleNumber = holeScore.Hole.HoleNumber,
                Par = holeScore.Hole.Par,
                YardageWhite = holeScore.Hole.YardageWhite,
                StrokeIndex = holeScore.Hole.StrokeIndex,
                Description = holeScore.Hole.HoleDescription
            };
        }

        return model;
    }
}