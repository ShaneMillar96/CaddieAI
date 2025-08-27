using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using caddie.portal.services.Interfaces;
using caddie.portal.api.DTOs.ShotAnalysis;
using caddie.portal.api.DTOs.Common;

namespace caddie.portal.api.Controllers;

/// <summary>
/// Controller for shot analysis with weather integration and AI-powered club recommendations
/// </summary>
[ApiController]
[Route("api")]
public class ShotAnalysisController : ControllerBase
{
    private readonly IShotAnalysisService _shotAnalysisService;
    private readonly IMapper _mapper;
    private readonly ILogger<ShotAnalysisController> _logger;

    public ShotAnalysisController(
        IShotAnalysisService shotAnalysisService,
        IMapper mapper,
        ILogger<ShotAnalysisController> logger)
    {
        _shotAnalysisService = shotAnalysisService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Generate AI-powered shot analysis with weather-aware club recommendations
    /// </summary>
    /// <param name="request">Shot analysis request with location and context</param>
    /// <returns>Comprehensive shot analysis with club recommendation and strategic tips</returns>
    [HttpPost("shot-analysis")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<ShotAnalysisResponseDto>>> GenerateShotAnalysis([FromBody] ShotAnalysisRequestDto request)
    {
        try
        {
            _logger.LogInformation("Shot analysis requested for user {UserId}, distance {Distance}y at ({Lat}, {Lon})", 
                request.UserId, request.DistanceYards, request.Latitude, request.Longitude);

            // Validate coordinates
            if (request.Latitude < -90 || request.Latitude > 90)
            {
                return BadRequest(ApiResponse<ShotAnalysisResponseDto>.ErrorResponse("Invalid latitude. Must be between -90 and 90", "INVALID_LATITUDE"));
            }

            if (request.Longitude < -180 || request.Longitude > 180)
            {
                return BadRequest(ApiResponse<ShotAnalysisResponseDto>.ErrorResponse("Invalid longitude. Must be between -180 and 180", "INVALID_LONGITUDE"));
            }

            // Generate shot analysis
            var analysisResult = await _shotAnalysisService.GenerateAnalysisAsync(
                request.UserId,
                request.RoundId,
                request.HoleNumber,
                request.DistanceYards,
                request.Latitude,
                request.Longitude,
                request.PlayerSkillLevel);

            // Map to response DTO
            var response = _mapper.Map<ShotAnalysisResponseDto>(analysisResult);

            // Log successful analysis
            _logger.LogInformation("Shot analysis completed for user {UserId}: {Club} recommended with {Confidence}% confidence", 
                request.UserId, response.RecommendedClub, response.ConfidenceScore);

            return Ok(ApiResponse<ShotAnalysisResponseDto>.SuccessResponse(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating shot analysis for user {UserId}", request.UserId);

            // Return fallback response on error
            var fallbackResponse = new ShotAnalysisResponseDto
            {
                RecommendedClub = GetFallbackClubForDistance(request.DistanceYards),
                ShotTips = new List<string> 
                { 
                    "Focus on solid contact", 
                    "Trust your fundamentals", 
                    "Commit to your target" 
                },
                WeatherConditions = new WeatherConditionsDto
                {
                    Conditions = "Unable to fetch weather",
                    Temperature = 70,
                    WindSpeed = 0,
                    WindDirection = "Unknown"
                },
                ConfidenceScore = 60,
                ErrorMessage = "Analysis service temporarily unavailable. Using basic recommendation."
            };

            return Ok(ApiResponse<ShotAnalysisResponseDto>.SuccessResponse(fallbackResponse));
        }
    }

    /// <summary>
    /// Get fallback club recommendation based on distance
    /// </summary>
    private string GetFallbackClubForDistance(int distanceYards)
    {

        return distanceYards switch
        {
            < 50 => "Lob Wedge",
            < 80 => "Sand Wedge",
            < 110 => "Pitching Wedge",
            < 130 => "Gap Wedge",
            < 150 => "9 Iron",
            < 170 => "8 Iron",
            < 190 => "7 Iron",
            < 210 => "6 Iron",
            < 230 => "5 Iron",
            < 250 => "4 Iron",
            _ => "Driver"
        };
    }
}