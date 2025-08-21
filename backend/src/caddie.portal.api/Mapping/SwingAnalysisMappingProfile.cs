using AutoMapper;
using NetTopologySuite.Geometries;
using caddie.portal.api.DTOs.SwingAnalysis;
using caddie.portal.dal.Models;
using caddie.portal.services.Models;

namespace caddie.portal.api.Mapping;

/// <summary>
/// AutoMapper profile for swing analysis mappings between DTOs, service models, and DAL entities
/// </summary>
public class SwingAnalysisMappingProfile : Profile
{
    public SwingAnalysisMappingProfile()
    {
        // Request DTOs to Service Models
        CreateMap<CreateSwingAnalysisRequestDto, CreateSwingAnalysisModel>()
            .ForMember(dest => dest.ShotLocation, opt => opt.MapFrom(src => CreatePointFromCoordinates(src.Latitude, src.Longitude)))
            .ForMember(dest => dest.RawSensorData, opt => opt.MapFrom(src => ConvertToJsonString(src.RawSensorData)));

        CreateMap<UpdateSwingAnalysisRequestDto, UpdateSwingAnalysisModel>();

        // Service Models to DAL Entities
        CreateMap<CreateSwingAnalysisModel, SwingAnalysis>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.Round, opt => opt.Ignore())
            .ForMember(dest => dest.Hole, opt => opt.Ignore());

        CreateMap<UpdateSwingAnalysisModel, SwingAnalysis>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.RoundId, opt => opt.Ignore())
            .ForMember(dest => dest.HoleId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.DetectedAt, opt => opt.Ignore())
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.Round, opt => opt.Ignore())
            .ForMember(dest => dest.Hole, opt => opt.Ignore());

        // DAL Entities to Service Models
        CreateMap<SwingAnalysis, SwingAnalysisModel>();
        CreateMap<caddie.portal.dal.Repositories.Interfaces.SwingAnalysisStats, SwingAnalysisStatsModel>();

        // Service Models to Response DTOs
        CreateMap<SwingAnalysisModel, SwingAnalysisResponseDto>();
        CreateMap<SwingAnalysisStatsModel, SwingAnalysisStatsResponseDto>();
        CreateMap<RoundSwingAnalysisSummaryModel, RoundSwingAnalysisSummaryResponseDto>();

        // DAL Entities to Response DTOs (direct mapping)
        CreateMap<SwingAnalysis, SwingAnalysisResponseDto>();
    }

    /// <summary>
    /// Create a Point geometry from latitude and longitude coordinates
    /// </summary>
    /// <param name="latitude">Latitude coordinate</param>
    /// <param name="longitude">Longitude coordinate</param>
    /// <returns>Point geometry or null if coordinates are not provided</returns>
    private static Point? CreatePointFromCoordinates(decimal? latitude, decimal? longitude)
    {
        if (!latitude.HasValue || !longitude.HasValue)
            return null;

        var geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        return geometryFactory.CreatePoint(new Coordinate((double)longitude.Value, (double)latitude.Value));
    }

    /// <summary>
    /// Convert raw sensor data to JSON string
    /// </summary>
    /// <param name="rawSensorData">Raw sensor data object</param>
    /// <returns>JSON string or null</returns>
    private static string? ConvertToJsonString(object? rawSensorData)
    {
        if (rawSensorData == null)
            return null;

        return System.Text.Json.JsonSerializer.Serialize(rawSensorData);
    }
}

/// <summary>
/// Response DTO for swing analysis statistics
/// </summary>
public class SwingAnalysisStatsResponseDto
{
    public int TotalSwings { get; set; }
    public decimal? AverageSwingSpeed { get; set; }
    public decimal? AverageQualityScore { get; set; }
    public int GarminSwings { get; set; }
    public int MobileSwings { get; set; }
    public DateTime? LastSwingDate { get; set; }
}

/// <summary>
/// Response DTO for round-specific swing analysis summary
/// </summary>
public class RoundSwingAnalysisSummaryResponseDto
{
    public int RoundId { get; set; }
    public int TotalSwings { get; set; }
    public decimal? AverageSwingSpeed { get; set; }
    public decimal? BestSwingSpeed { get; set; }
    public decimal? AverageQualityScore { get; set; }
    public decimal? BestQualityScore { get; set; }
    public List<SwingAnalysisResponseDto> Swings { get; set; } = new();
    public Dictionary<string, int> SwingsByClub { get; set; } = new();
    public Dictionary<string, int> SwingsByDetectionSource { get; set; } = new();
}