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
    /// Get current user ID from JWT claims
    /// </summary>
    /// <returns>User ID or null if not authenticated</returns>
    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}