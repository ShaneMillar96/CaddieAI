using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using caddie.portal.dal.Repositories.Interfaces;
using caddie.portal.dal.Models;
using caddie.portal.dal.Context;
using ServiceRoundStatus = caddie.portal.services.Models.RoundStatus;
using DalRoundStatus = caddie.portal.dal.Models.RoundStatus;

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
            return round == null ? null : MapToRoundModel(round);
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
            var statusString = MapRoundStatusToString(status);
            var rounds = await _roundRepository.GetRoundsByStatusAsync(statusString);
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
            return round == null ? null : MapToRoundModel(round);
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
                var statusId = await GetStatusIdByNameAsync(MapRoundStatusToString(model.Status.Value));
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
                var inProgressStatusId = await GetStatusIdByNameAsync("in_progress");
                existingRound.StatusId = inProgressStatusId;
                existingRound.CurrentHole = 1;
                existingRound.StartTime = DateTime.UtcNow;
                await _roundRepository.UpdateAsync(existingRound);
                
                _logger.LogInformation("Round started successfully: ID {RoundId}", round.Id);
                return MapToRoundModel(existingRound);
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

            var currentStatus = MapStringToRoundStatus(GetRoundStatusFromDatabase(round));
            if (currentStatus != ServiceRoundStatus.InProgress)
            {
                throw new InvalidOperationException($"Can only pause rounds that are in progress. Current status: {currentStatus}");
            }

            var pausedStatusId = await GetStatusIdByNameAsync("paused");
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

            var currentStatus = MapStringToRoundStatus(GetRoundStatusFromDatabase(round));
            if (currentStatus != ServiceRoundStatus.Paused)
            {
                throw new InvalidOperationException($"Can only resume rounds that are paused. Current status: {currentStatus}");
            }

            var inProgressStatusId = await GetStatusIdByNameAsync("in_progress");
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

            var currentStatus = MapStringToRoundStatus(GetRoundStatusFromDatabase(round));
            if (currentStatus != ServiceRoundStatus.InProgress && currentStatus != ServiceRoundStatus.Paused)
            {
                throw new InvalidOperationException($"Can only complete rounds that are in progress or paused. Current status: {currentStatus}");
            }

            // Validate score if provided
            if (await ValidateRoundScoreAsync(roundId, model.TotalScore))
            {
                var completedStatusId = await GetStatusIdByNameAsync("completed");
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

            var currentStatus = MapStringToRoundStatus(GetRoundStatusFromDatabase(round));
            if (currentStatus == ServiceRoundStatus.Completed || currentStatus == ServiceRoundStatus.Abandoned)
            {
                throw new InvalidOperationException($"Cannot abandon a round that is already {currentStatus.ToString().ToLower()}");
            }

            var abandonedStatusId = await GetStatusIdByNameAsync("abandoned");
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
            
            var statusId = await GetStatusIdByNameAsync(MapRoundStatusToString(status));
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
            var statusString = status.HasValue ? MapRoundStatusToString(status.Value) : null;
            var rounds = await _roundRepository.GetPaginatedAsync(page, pageSize, userId, statusString);
            var totalCount = await _roundRepository.GetTotalCountAsync(userId, statusString);
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
        var currentStatus = MapStringToRoundStatus(GetRoundStatusFromDatabase(round));
        
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
            Status = MapStringToRoundStatus(GetRoundStatusFromDatabase(round)),
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
}