using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AutoMapper;
using System.Security.Claims;
using caddie.portal.api.DTOs.Round;
using caddie.portal.api.DTOs.Common;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;

namespace caddie.portal.api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class RoundController : ControllerBase
{
    private readonly IRoundService _roundService;
    private readonly IMapper _mapper;
    private readonly ILogger<RoundController> _logger;

    public RoundController(
        IRoundService roundService,
        IMapper mapper,
        ILogger<RoundController> logger)
    {
        _roundService = roundService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get active round for the current user
    /// </summary>
    /// <returns>Active round details or null if no active round</returns>
    [HttpGet("active")]
    [ProducesResponseType(typeof(ApiResponse<RoundResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetActiveRound()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var activeRound = await _roundService.GetActiveRoundByUserIdAsync(userId.Value);
            
            if (activeRound == null)
                return NotFound(ApiResponse.ErrorResponse("No active round found", "NO_ACTIVE_ROUND"));

            var responseDto = _mapper.Map<RoundResponseDto>(activeRound);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Active round retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active round for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve active round", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get round by ID
    /// </summary>
    /// <param name="id">Round ID</param>
    /// <returns>Round details</returns>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<RoundResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRoundById(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var round = await _roundService.GetRoundWithDetailsAsync(id);
            
            if (round == null)
                return NotFound(ApiResponse.ErrorResponse("Round not found", "ROUND_NOT_FOUND"));

            // Verify user owns this round
            if (round.UserId != userId.Value)
                return Forbid();

            var responseDto = _mapper.Map<RoundResponseDto>(round);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Round retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving round {RoundId} for user {UserId}", id, GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve round", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Start a new round
    /// </summary>
    /// <param name="request">Round creation request</param>
    /// <returns>Started round details</returns>
    [HttpPost("start")]
    [ProducesResponseType(typeof(ApiResponse<RoundResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> StartRound([FromBody] StartRoundRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            // Check if user already has an active round
            var existingActiveRound = await _roundService.GetActiveRoundByUserIdAsync(userId.Value);
            if (existingActiveRound != null)
            {
                return Conflict(ApiResponse.ErrorResponse("User already has an active round", "ACTIVE_ROUND_EXISTS"));
            }

            var startRoundModel = _mapper.Map<StartRoundModel>(request);
            var startedRound = await _roundService.StartRoundAsync(userId.Value, startRoundModel);

            var responseDto = _mapper.Map<RoundResponseDto>(startedRound);
            return CreatedAtAction(nameof(GetRoundById), new { id = startedRound.Id }, 
                ApiResponse.SuccessResponse(responseDto, "Round started successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting round for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to start round", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Update current hole in active round
    /// </summary>
    /// <param name="id">Round ID</param>
    /// <param name="request">Update current hole request</param>
    /// <returns>Updated round details</returns>
    [HttpPut("{id:int}/current-hole")]
    [ProducesResponseType(typeof(ApiResponse<RoundResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateCurrentHole(int id, [FromBody] UpdateCurrentHoleRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var round = await _roundService.GetRoundByIdAsync(id);
            if (round == null)
                return NotFound(ApiResponse.ErrorResponse("Round not found", "ROUND_NOT_FOUND"));

            if (round.UserId != userId.Value)
                return Forbid();

            await _roundService.UpdateCurrentHoleAsync(id, request.HoleNumber);
            var updatedRound = await _roundService.GetRoundWithDetailsAsync(id);

            var responseDto = _mapper.Map<RoundResponseDto>(updatedRound);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Current hole updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating current hole for round {RoundId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to update current hole", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Pause an active round
    /// </summary>
    /// <param name="id">Round ID</param>
    /// <returns>Paused round details</returns>
    [HttpPost("{id:int}/pause")]
    [ProducesResponseType(typeof(ApiResponse<RoundResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> PauseRound(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var round = await _roundService.GetRoundByIdAsync(id);
            if (round == null)
                return NotFound(ApiResponse.ErrorResponse("Round not found", "ROUND_NOT_FOUND"));

            if (round.UserId != userId.Value)
                return Forbid();

            var pausedRound = await _roundService.PauseRoundAsync(id);
            var responseDto = _mapper.Map<RoundResponseDto>(pausedRound);
            
            return Ok(ApiResponse.SuccessResponse(responseDto, "Round paused successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error pausing round {RoundId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to pause round", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Resume a paused round
    /// </summary>
    /// <param name="id">Round ID</param>
    /// <returns>Resumed round details</returns>
    [HttpPost("{id:int}/resume")]
    [ProducesResponseType(typeof(ApiResponse<RoundResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ResumeRound(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var round = await _roundService.GetRoundByIdAsync(id);
            if (round == null)
                return NotFound(ApiResponse.ErrorResponse("Round not found", "ROUND_NOT_FOUND"));

            if (round.UserId != userId.Value)
                return Forbid();

            var resumedRound = await _roundService.ResumeRoundAsync(id);
            var responseDto = _mapper.Map<RoundResponseDto>(resumedRound);
            
            return Ok(ApiResponse.SuccessResponse(responseDto, "Round resumed successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resuming round {RoundId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to resume round", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Complete a round
    /// </summary>
    /// <param name="id">Round ID</param>
    /// <param name="request">Complete round request</param>
    /// <returns>Completed round details</returns>
    [HttpPost("{id:int}/complete")]
    [ProducesResponseType(typeof(ApiResponse<RoundResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CompleteRound(int id, [FromBody] CompleteRoundRequestDto? request = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var round = await _roundService.GetRoundByIdAsync(id);
            if (round == null)
                return NotFound(ApiResponse.ErrorResponse("Round not found", "ROUND_NOT_FOUND"));

            if (round.UserId != userId.Value)
                return Forbid();

            var completeModel = request != null ? _mapper.Map<CompleteRoundModel>(request) : new CompleteRoundModel();
            var completedRound = await _roundService.CompleteRoundAsync(id, completeModel);
            var responseDto = _mapper.Map<RoundResponseDto>(completedRound);
            
            return Ok(ApiResponse.SuccessResponse(responseDto, "Round completed successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing round {RoundId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to complete round", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Abandon a round
    /// </summary>
    /// <param name="id">Round ID</param>
    /// <param name="request">Abandon round request</param>
    /// <returns>Abandoned round details</returns>
    [HttpPost("{id:int}/abandon")]
    [ProducesResponseType(typeof(ApiResponse<RoundResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AbandonRound(int id, [FromBody] AbandonRoundRequestDto? request = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var round = await _roundService.GetRoundByIdAsync(id);
            if (round == null)
                return NotFound(ApiResponse.ErrorResponse("Round not found", "ROUND_NOT_FOUND"));

            if (round.UserId != userId.Value)
                return Forbid();

            var abandonedRound = await _roundService.AbandonRoundAsync(id, request?.Reason);
            var responseDto = _mapper.Map<RoundResponseDto>(abandonedRound);
            
            return Ok(ApiResponse.SuccessResponse(responseDto, "Round abandoned successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error abandoning round {RoundId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to abandon round", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get round history for the current user
    /// </summary>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 20, max: 100)</param>
    /// <returns>Paginated list of user's rounds</returns>
    [HttpGet("history")]
    [ProducesResponseType(typeof(ApiResponse<PaginatedRoundResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetRoundHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            if (page < 1 || pageSize < 1 || pageSize > 100)
            {
                return BadRequest(ApiResponse.ErrorResponse("Invalid pagination parameters", "INVALID_PAGINATION"));
            }

            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var rounds = await _roundService.GetRoundsByUserIdAsync(userId.Value);
            
            // Apply pagination
            var totalCount = rounds.Count();
            var paginatedRounds = rounds
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var responseItems = _mapper.Map<List<RoundListResponseDto>>(paginatedRounds);
            var paginatedResponse = new PaginatedRoundResponseDto
            {
                Items = responseItems,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };

            return Ok(ApiResponse.SuccessResponse(paginatedResponse, "Round history retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving round history for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve round history", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get hole scores for a round
    /// </summary>
    /// <param name="id">Round ID</param>
    /// <returns>List of hole scores for the round</returns>
    [HttpGet("{id:int}/hole-scores")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<HoleScoreResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetHoleScores(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var round = await _roundService.GetRoundByIdAsync(id);
            if (round == null)
                return NotFound(ApiResponse.ErrorResponse("Round not found", "ROUND_NOT_FOUND"));

            // Verify user owns this round
            if (round.UserId != userId.Value)
                return Forbid();

            var holeScores = await _roundService.GetHoleScoresByRoundIdAsync(id);
            var responseDto = holeScores.Select(hs => _mapper.Map<HoleScoreResponseDto>(hs));
            
            return Ok(ApiResponse.SuccessResponse(responseDto, "Hole scores retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving hole scores for round {RoundId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve hole scores", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get a specific hole score
    /// </summary>
    /// <param name="id">Round ID</param>
    /// <param name="holeNumber">Hole number (1-18)</param>
    /// <returns>Hole score details</returns>
    [HttpGet("{id:int}/hole-scores/{holeNumber:int}")]
    [ProducesResponseType(typeof(ApiResponse<HoleScoreResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetHoleScore(int id, int holeNumber)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var round = await _roundService.GetRoundByIdAsync(id);
            if (round == null)
                return NotFound(ApiResponse.ErrorResponse("Round not found", "ROUND_NOT_FOUND"));

            // Verify user owns this round
            if (round.UserId != userId.Value)
                return Forbid();

            var holeScore = await _roundService.GetHoleScoreByRoundAndHoleAsync(id, holeNumber);
            if (holeScore == null)
                return NotFound(ApiResponse.ErrorResponse($"Hole score for hole {holeNumber} not found", "HOLE_SCORE_NOT_FOUND"));

            var responseDto = _mapper.Map<HoleScoreResponseDto>(holeScore);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Hole score retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving hole score for round {RoundId} hole {HoleNumber}", id, holeNumber);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve hole score", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Create or update a hole score
    /// </summary>
    /// <param name="id">Round ID</param>
    /// <param name="request">Hole score creation request</param>
    /// <returns>Created or updated hole score</returns>
    [HttpPost("{id:int}/hole-scores")]
    [ProducesResponseType(typeof(ApiResponse<HoleScoreResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<HoleScoreResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateHoleScore(int id, [FromBody] CreateHoleScoreRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var round = await _roundService.GetRoundByIdAsync(id);
            if (round == null)
                return NotFound(ApiResponse.ErrorResponse("Round not found", "ROUND_NOT_FOUND"));

            // Verify user owns this round
            if (round.UserId != userId.Value)
                return Forbid();

            // Check if hole score already exists
            var existingScore = await _roundService.GetHoleScoreByRoundAndHoleAsync(id, request.HoleNumber);
            if (existingScore != null)
            {
                // Update existing score
                var updateModel = _mapper.Map<UpdateHoleScoreModel>(request);
                var updatedScore = await _roundService.UpdateHoleScoreAsync(existingScore.Id, updateModel);
                var updatedResponseDto = _mapper.Map<HoleScoreResponseDto>(updatedScore);
                
                return Ok(ApiResponse.SuccessResponse(updatedResponseDto, "Hole score updated successfully"));
            }

            // Create new score
            var createModel = _mapper.Map<CreateHoleScoreModel>(request);
            var createdScore = await _roundService.CreateHoleScoreAsync(id, createModel);
            var responseDto = _mapper.Map<HoleScoreResponseDto>(createdScore);
            
            return CreatedAtAction(nameof(GetHoleScore), new { id, holeNumber = request.HoleNumber }, 
                ApiResponse.SuccessResponse(responseDto, "Hole score created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse.ErrorResponse(ex.Message, "CONFLICT"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating hole score for round {RoundId} hole {HoleNumber}", id, request.HoleNumber);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to create hole score", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Update a specific hole score
    /// </summary>
    /// <param name="id">Round ID</param>
    /// <param name="holeScoreId">Hole score ID</param>
    /// <param name="request">Hole score update request</param>
    /// <returns>Updated hole score</returns>
    [HttpPut("{id:int}/hole-scores/{holeScoreId:int}")]
    [ProducesResponseType(typeof(ApiResponse<HoleScoreResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateHoleScore(int id, int holeScoreId, [FromBody] UpdateHoleScoreRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var round = await _roundService.GetRoundByIdAsync(id);
            if (round == null)
                return NotFound(ApiResponse.ErrorResponse("Round not found", "ROUND_NOT_FOUND"));

            // Verify user owns this round
            if (round.UserId != userId.Value)
                return Forbid();

            var holeScore = await _roundService.GetHoleScoreByIdAsync(holeScoreId);
            if (holeScore == null)
                return NotFound(ApiResponse.ErrorResponse("Hole score not found", "HOLE_SCORE_NOT_FOUND"));

            // Verify hole score belongs to the round
            if (holeScore.RoundId != id)
                return BadRequest(ApiResponse.ErrorResponse("Hole score does not belong to this round", "INVALID_HOLE_SCORE"));

            var updateModel = _mapper.Map<UpdateHoleScoreModel>(request);
            var updatedScore = await _roundService.UpdateHoleScoreAsync(holeScoreId, updateModel);
            var responseDto = _mapper.Map<HoleScoreResponseDto>(updatedScore);
            
            return Ok(ApiResponse.SuccessResponse(responseDto, "Hole score updated successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse.ErrorResponse(ex.Message, "NOT_FOUND"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating hole score {HoleScoreId} for round {RoundId}", holeScoreId, id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to update hole score", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Delete a hole score
    /// </summary>
    /// <param name="id">Round ID</param>
    /// <param name="holeScoreId">Hole score ID</param>
    /// <returns>Success message</returns>
    [HttpDelete("{id:int}/hole-scores/{holeScoreId:int}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteHoleScore(int id, int holeScoreId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var round = await _roundService.GetRoundByIdAsync(id);
            if (round == null)
                return NotFound(ApiResponse.ErrorResponse("Round not found", "ROUND_NOT_FOUND"));

            // Verify user owns this round
            if (round.UserId != userId.Value)
                return Forbid();

            var holeScore = await _roundService.GetHoleScoreByIdAsync(holeScoreId);
            if (holeScore == null)
                return NotFound(ApiResponse.ErrorResponse("Hole score not found", "HOLE_SCORE_NOT_FOUND"));

            // Verify hole score belongs to the round
            if (holeScore.RoundId != id)
                return BadRequest(ApiResponse.ErrorResponse("Hole score does not belong to this round", "INVALID_HOLE_SCORE"));

            var deleted = await _roundService.DeleteHoleScoreAsync(holeScoreId);
            if (!deleted)
                return NotFound(ApiResponse.ErrorResponse("Hole score not found", "HOLE_SCORE_NOT_FOUND"));
            
            return Ok(ApiResponse.SuccessResponse("Hole score deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting hole score {HoleScoreId} for round {RoundId}", holeScoreId, id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to delete hole score", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get hole score summary for a round
    /// </summary>
    /// <param name="id">Round ID</param>
    /// <returns>Hole score summary with statistics</returns>
    [HttpGet("{id:int}/hole-scores/summary")]
    [ProducesResponseType(typeof(ApiResponse<HoleScoreSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetHoleScoreSummary(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var round = await _roundService.GetRoundByIdAsync(id);
            if (round == null)
                return NotFound(ApiResponse.ErrorResponse("Round not found", "ROUND_NOT_FOUND"));

            // Verify user owns this round
            if (round.UserId != userId.Value)
                return Forbid();

            var summary = await _roundService.GetHoleScoreSummaryAsync(id);
            var responseDto = _mapper.Map<HoleScoreSummaryDto>(summary);
            
            return Ok(ApiResponse.SuccessResponse(responseDto, "Hole score summary retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving hole score summary for round {RoundId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve hole score summary", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Initialize hole scores for a round (creates empty hole score records)
    /// </summary>
    /// <param name="id">Round ID</param>
    /// <returns>Success message</returns>
    [HttpPost("{id:int}/hole-scores/initialize")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> InitializeHoleScores(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var round = await _roundService.GetRoundByIdAsync(id);
            if (round == null)
                return NotFound(ApiResponse.ErrorResponse("Round not found", "ROUND_NOT_FOUND"));

            // Verify user owns this round
            if (round.UserId != userId.Value)
                return Forbid();

            var initialized = await _roundService.InitializeHoleScoresForRoundAsync(id);
            if (!initialized)
                return BadRequest(ApiResponse.ErrorResponse("Failed to initialize hole scores", "INITIALIZATION_FAILED"));
            
            return Ok(ApiResponse.SuccessResponse("Hole scores initialized successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing hole scores for round {RoundId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to initialize hole scores", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Complete a hole with progressive round management
    /// </summary>
    [HttpPost("{roundId:int}/holes/{holeNumber:int}/complete")]
    [ProducesResponseType(typeof(ApiResponse<CompleteHoleResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CompleteHoleWithProgression(int roundId, int holeNumber, [FromBody] CompleteHoleRequestDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                return BadRequest(ApiResponse.ErrorResponse("Validation failed", "VALIDATION_ERROR", errors));
            }

            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            // Verify round exists and user has access
            var round = await _roundService.GetRoundByIdAsync(roundId);
            if (round == null)
                return NotFound(ApiResponse.ErrorResponse("Round not found", "ROUND_NOT_FOUND"));

            if (round.UserId != userId.Value)
                return Forbid();

            // Validate hole number matches URL parameter
            if (request.HoleNumber != holeNumber)
            {
                return BadRequest(ApiResponse.ErrorResponse("Hole number in request body must match URL parameter", "HOLE_NUMBER_MISMATCH"));
            }

            var result = await _roundService.CompleteHoleWithProgressionAsync(roundId, holeNumber, request.Score, request.Par);
            var response = _mapper.Map<CompleteHoleResponseDto>(result);

            _logger.LogInformation("User {UserId} completed hole {HoleNumber} for round {RoundId} with score {Score}", 
                userId.Value, holeNumber, roundId, request.Score);

            return Ok(ApiResponse<CompleteHoleResponseDto>.SuccessResponse(response, "Hole completed successfully"));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation while completing hole {HoleNumber} for round {RoundId}: {Error}", holeNumber, roundId, ex.Message);
            return BadRequest(ApiResponse.ErrorResponse(ex.Message, "INVALID_OPERATION"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing hole {HoleNumber} for round {RoundId}", holeNumber, roundId);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to complete hole", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get round progress with completed holes information
    /// </summary>
    [HttpGet("{roundId:int}/progress")]
    [ProducesResponseType(typeof(ApiResponse<RoundProgressResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRoundProgress(int roundId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            // Verify round exists and user has access
            var round = await _roundService.GetRoundByIdAsync(roundId);
            if (round == null)
                return NotFound(ApiResponse.ErrorResponse("Round not found", "ROUND_NOT_FOUND"));

            if (round.UserId != userId.Value)
                return Forbid();

            var progress = await _roundService.GetRoundProgressAsync(roundId);
            var response = _mapper.Map<RoundProgressResponseDto>(progress);

            return Ok(ApiResponse<RoundProgressResponseDto>.SuccessResponse(response, "Round progress retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting round progress for round {RoundId}", roundId);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to get round progress", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Complete a hole with score and optionally create hole if first time
    /// </summary>
    [HttpPost("{id:int}/complete-hole")]
    [ProducesResponseType(typeof(ApiResponse<HoleScoreResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CompleteHole(int id, [FromBody] CompleteHoleRequestDto request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            // Verify round exists and user has access
            var round = await _roundService.GetRoundByIdAsync(id);
            if (round == null)
                return NotFound(ApiResponse.ErrorResponse("Round not found", "ROUND_NOT_FOUND"));

            if (round.UserId != userId.Value)
                return Forbid();

            var model = _mapper.Map<CompleteHoleModel>(request);
            var holeScore = await _roundService.CompleteHoleAsync(id, model);
            var response = _mapper.Map<HoleScoreResponseDto>(holeScore);

            _logger.LogInformation("User {UserId} completed hole {HoleNumber} for round {RoundId} with score {Score}", 
                userId.Value, request.HoleNumber, id, request.Score);

            return Ok(ApiResponse<HoleScoreResponseDto>.SuccessResponse(response, "Hole completed successfully"));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation while completing hole for round {RoundId}: {Error}", id, ex.Message);
            return BadRequest(ApiResponse.ErrorResponse(ex.Message, "INVALID_OPERATION"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing hole for round {RoundId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to complete hole", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get current user ID from JWT claims
    /// </summary>
    /// <returns>User ID or null if not authenticated</returns>
    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}