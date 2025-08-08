using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AutoMapper;
using System.Security.Claims;
using caddie.portal.api.DTOs.Common;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;

namespace caddie.portal.api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class ShotController : ControllerBase
{
    private readonly IShotService _shotService;
    private readonly IHoleService _holeService;
    private readonly IRoundService _roundService;
    private readonly IMapper _mapper;
    private readonly ILogger<ShotController> _logger;

    public ShotController(
        IShotService shotService,
        IHoleService holeService,
        IRoundService roundService,
        IMapper mapper,
        ILogger<ShotController> logger)
    {
        _shotService = shotService;
        _holeService = holeService;
        _roundService = roundService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Log a shot placement with coordinates and metadata
    /// </summary>
    /// <param name="request">Shot placement data</param>
    /// <returns>Created shot placement record</returns>
    [HttpPost("placement")]
    [ProducesResponseType(typeof(ApiResponse<ShotPlacementResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateShotPlacement([FromBody] CreateShotPlacementRequestDto request)
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

            // Verify round exists and belongs to user
            var round = await _roundService.GetRoundByIdAsync(request.RoundId);
            if (round == null)
                return NotFound(ApiResponse.ErrorResponse("Round not found", "ROUND_NOT_FOUND"));

            if (round.UserId != userId.Value)
                return Forbid();

            // Verify hole exists
            if (request.HoleId.HasValue)
            {
                var hole = await _holeService.GetHoleByIdAsync(request.HoleId.Value);
                if (hole == null)
                    return NotFound(ApiResponse.ErrorResponse("Hole not found", "HOLE_NOT_FOUND"));
            }

            var shotPlacementModel = _mapper.Map<CreateShotPlacementModel>(request);
            shotPlacementModel.UserId = userId.Value;

            var createdShot = await _shotService.CreateShotPlacementAsync(shotPlacementModel);
            var responseDto = _mapper.Map<ShotPlacementResponseDto>(createdShot);

            return CreatedAtAction(nameof(GetShotPlacement), new { id = createdShot.Id }, 
                ApiResponse.SuccessResponse(responseDto, "Shot placement created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating shot placement for user {UserId}", GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to create shot placement", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get shot placement by ID
    /// </summary>
    /// <param name="id">Shot placement ID</param>
    /// <returns>Shot placement details</returns>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ShotPlacementResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetShotPlacement(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var shotPlacement = await _shotService.GetShotPlacementByIdAsync(id);
            if (shotPlacement == null)
                return NotFound(ApiResponse.ErrorResponse("Shot placement not found", "SHOT_NOT_FOUND"));

            // Verify user owns this shot placement through the round
            if (shotPlacement.UserId != userId.Value)
                return Forbid();

            var responseDto = _mapper.Map<ShotPlacementResponseDto>(shotPlacement);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Shot placement retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving shot placement {ShotId} for user {UserId}", id, GetCurrentUserId());
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve shot placement", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get shot placements for a specific round
    /// </summary>
    /// <param name="roundId">Round ID</param>
    /// <returns>List of shot placements for the round</returns>
    [HttpGet("round/{roundId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ShotPlacementResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetShotPlacementsByRound(int roundId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            // Verify round exists and belongs to user
            var round = await _roundService.GetRoundByIdAsync(roundId);
            if (round == null)
                return NotFound(ApiResponse.ErrorResponse("Round not found", "ROUND_NOT_FOUND"));

            if (round.UserId != userId.Value)
                return Forbid();

            var shotPlacements = await _shotService.GetShotPlacementsByRoundAsync(roundId);
            var responseDto = shotPlacements.Select(s => _mapper.Map<ShotPlacementResponseDto>(s));

            return Ok(ApiResponse.SuccessResponse(responseDto, "Shot placements retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving shot placements for round {RoundId}", roundId);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve shot placements", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Update shot placement progress (e.g., mark as completed)
    /// </summary>
    /// <param name="id">Shot placement ID</param>
    /// <param name="request">Update request</param>
    /// <returns>Updated shot placement</returns>
    [HttpPut("{id:int}/progress")]
    [ProducesResponseType(typeof(ApiResponse<ShotPlacementResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateShotPlacementProgress(int id, [FromBody] UpdateShotProgressRequestDto request)
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

            var shotPlacement = await _shotService.GetShotPlacementByIdAsync(id);
            if (shotPlacement == null)
                return NotFound(ApiResponse.ErrorResponse("Shot placement not found", "SHOT_NOT_FOUND"));

            if (shotPlacement.UserId != userId.Value)
                return Forbid();

            var updateModel = _mapper.Map<UpdateShotProgressModel>(request);
            var updatedShot = await _shotService.UpdateShotPlacementProgressAsync(id, updateModel);
            var responseDto = _mapper.Map<ShotPlacementResponseDto>(updatedShot);

            return Ok(ApiResponse.SuccessResponse(responseDto, "Shot placement progress updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating shot placement progress {ShotId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to update shot placement progress", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Get hole yardage information for distance calculations
    /// </summary>
    /// <param name="holeId">Hole ID</param>
    /// <returns>Hole distance and layout information</returns>
    [HttpGet("holes/{holeId:int}/yardage")]
    [ProducesResponseType(typeof(ApiResponse<HoleYardageResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetHoleYardage(int holeId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var hole = await _holeService.GetHoleByIdAsync(holeId);
            if (hole == null)
                return NotFound(ApiResponse.ErrorResponse("Hole not found", "HOLE_NOT_FOUND"));

            var responseDto = _mapper.Map<HoleYardageResponseDto>(hole);
            return Ok(ApiResponse.SuccessResponse(responseDto, "Hole yardage retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving hole yardage for hole {HoleId}", holeId);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to retrieve hole yardage", "INTERNAL_ERROR"));
        }
    }

    /// <summary>
    /// Delete a shot placement
    /// </summary>
    /// <param name="id">Shot placement ID</param>
    /// <returns>Success message</returns>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteShotPlacement(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(ApiResponse.ErrorResponse("User not authenticated", "UNAUTHORIZED"));

            var shotPlacement = await _shotService.GetShotPlacementByIdAsync(id);
            if (shotPlacement == null)
                return NotFound(ApiResponse.ErrorResponse("Shot placement not found", "SHOT_NOT_FOUND"));

            if (shotPlacement.UserId != userId.Value)
                return Forbid();

            var deleted = await _shotService.DeleteShotPlacementAsync(id);
            if (!deleted)
                return NotFound(ApiResponse.ErrorResponse("Shot placement not found", "SHOT_NOT_FOUND"));

            return Ok(ApiResponse.SuccessResponse("Shot placement deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting shot placement {ShotId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("Failed to delete shot placement", "INTERNAL_ERROR"));
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

#region DTOs

/// <summary>
/// Request DTO for creating a shot placement
/// </summary>
public class CreateShotPlacementRequestDto
{
    /// <summary>
    /// Round ID this shot placement belongs to
    /// </summary>
    public int RoundId { get; set; }

    /// <summary>
    /// Hole ID (optional for practice shots)
    /// </summary>
    public int? HoleId { get; set; }

    /// <summary>
    /// Shot placement latitude
    /// </summary>
    public double Latitude { get; set; }

    /// <summary>
    /// Shot placement longitude
    /// </summary>
    public double Longitude { get; set; }

    /// <summary>
    /// GPS accuracy in meters
    /// </summary>
    public double? Accuracy { get; set; }

    /// <summary>
    /// Distance to pin in yards
    /// </summary>
    public int? DistanceToPin { get; set; }

    /// <summary>
    /// Distance from current location in yards
    /// </summary>
    public int? DistanceFromCurrent { get; set; }

    /// <summary>
    /// Club recommendation from AI
    /// </summary>
    public string? ClubRecommendation { get; set; }

    /// <summary>
    /// Additional metadata as JSON
    /// </summary>
    public string? Metadata { get; set; }
}

/// <summary>
/// Request DTO for updating shot placement progress
/// </summary>
public class UpdateShotProgressRequestDto
{
    /// <summary>
    /// Whether the shot was completed
    /// </summary>
    public bool IsCompleted { get; set; }

    /// <summary>
    /// Timestamp when shot was completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Actual shot outcome coordinates
    /// </summary>
    public double? ActualLatitude { get; set; }
    
    /// <summary>
    /// Actual shot outcome coordinates
    /// </summary>
    public double? ActualLongitude { get; set; }

    /// <summary>
    /// Club actually used
    /// </summary>
    public string? ClubUsed { get; set; }

    /// <summary>
    /// Additional notes or feedback
    /// </summary>
    public string? Notes { get; set; }
}

/// <summary>
/// Response DTO for shot placement data
/// </summary>
public class ShotPlacementResponseDto
{
    /// <summary>
    /// Shot placement ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Round ID
    /// </summary>
    public int RoundId { get; set; }

    /// <summary>
    /// User ID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Hole ID
    /// </summary>
    public int? HoleId { get; set; }

    /// <summary>
    /// Shot placement coordinates
    /// </summary>
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    /// <summary>
    /// GPS accuracy
    /// </summary>
    public double? Accuracy { get; set; }

    /// <summary>
    /// Distance measurements
    /// </summary>
    public int? DistanceToPin { get; set; }
    public int? DistanceFromCurrent { get; set; }

    /// <summary>
    /// AI recommendations
    /// </summary>
    public string? ClubRecommendation { get; set; }

    /// <summary>
    /// Shot completion status
    /// </summary>
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Actual shot outcome
    /// </summary>
    public double? ActualLatitude { get; set; }
    public double? ActualLongitude { get; set; }
    public string? ClubUsed { get; set; }

    /// <summary>
    /// Timestamps
    /// </summary>
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Additional metadata
    /// </summary>
    public string? Metadata { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Response DTO for hole yardage information
/// </summary>
public class HoleYardageResponseDto
{
    /// <summary>
    /// Hole ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Hole number
    /// </summary>
    public int HoleNumber { get; set; }

    /// <summary>
    /// Par for the hole
    /// </summary>
    public int Par { get; set; }

    /// <summary>
    /// Yardages from different tees
    /// </summary>
    public int? YardageBlack { get; set; }
    public int? YardageBlue { get; set; }
    public int? YardageWhite { get; set; }
    public int? YardageRed { get; set; }

    /// <summary>
    /// Pin and tee locations for distance calculations
    /// </summary>
    public CoordinateDto? PinLocation { get; set; }
    public CoordinateDto? TeeLocation { get; set; }
}

/// <summary>
/// Coordinate DTO for geographic points
/// </summary>
public class CoordinateDto
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

#endregion