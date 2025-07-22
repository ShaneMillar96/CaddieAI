using AutoMapper;
using caddie.portal.api.DTOs.Statistics;
using caddie.portal.services.Models;

namespace caddie.portal.api.Mapping;

public class StatisticsMappingProfile : Profile
{
    public StatisticsMappingProfile()
    {
        // Performance Analysis Mappings
        CreateMap<PerformanceAnalysisModel, PerformanceAnalysisResponseDto>();
        
        // Handicap Trend Mappings
        CreateMap<HandicapTrendModel, HandicapTrendResponseDto>();
        CreateMap<HandicapDataPoint, HandicapDataPointDto>();
        
        // Course Performance Mappings
        CreateMap<CoursePerformanceModel, CoursePerformanceResponseDto>();
        
        // Scoring Trends Mappings
        CreateMap<ScoringTrendsModel, ScoringTrendsResponseDto>();
        CreateMap<MonthlyTrendData, MonthlyTrendDataDto>();
        CreateMap<ScoreTrendDataPoint, ScoreTrendDataPointDto>();
        
        // Advanced Metrics Mappings
        CreateMap<AdvancedMetricsModel, AdvancedMetricsResponseDto>();
        
        // Course Comparison Mappings
        CreateMap<CourseComparisonModel, CourseComparisonResponseDto>();
        
        // Weather Performance Mappings
        CreateMap<WeatherPerformanceModel, WeatherPerformanceResponseDto>();
        CreateMap<WeatherDataPoint, WeatherDataPointDto>();
        
        // Round Performance Mappings
        CreateMap<RoundPerformanceModel, RoundPerformanceResponseDto>();
        
        // Enhanced Round Statistics Mappings
        CreateMap<EnhancedRoundStatisticsModel, EnhancedRoundStatisticsResponseDto>();
        
        // Consistency Metrics Mappings
        CreateMap<ConsistencyMetricsModel, ConsistencyMetricsResponseDto>();
        CreateMap<ConsistencyBreakdown, ConsistencyBreakdownDto>();
        
        // Request DTOs (if needed for reverse mapping)
        CreateMap<StatisticsRequestDto, DateRangeFilter>()
            .ForMember(dest => dest.StartDate, opt => opt.MapFrom(src => src.StartDate))
            .ForMember(dest => dest.EndDate, opt => opt.MapFrom(src => src.EndDate));
        
        CreateMap<CourseComparisonRequestDto, CourseComparisonFilter>()
            .ForMember(dest => dest.CourseIds, opt => opt.MapFrom(src => src.CourseIds))
            .ForMember(dest => dest.StartDate, opt => opt.MapFrom(src => src.StartDate))
            .ForMember(dest => dest.EndDate, opt => opt.MapFrom(src => src.EndDate))
            .ForMember(dest => dest.MinimumRounds, opt => opt.MapFrom(src => src.MinimumRounds));
        
        CreateMap<WeatherPerformanceRequestDto, WeatherFilter>()
            .ForMember(dest => dest.StartDate, opt => opt.MapFrom(src => src.StartDate))
            .ForMember(dest => dest.EndDate, opt => opt.MapFrom(src => src.EndDate));
    }
}

// Helper classes for mapping complex request parameters
public class DateRangeFilter
{
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}

public class CourseComparisonFilter : DateRangeFilter
{
    public IEnumerable<int>? CourseIds { get; set; }
    public int? MinimumRounds { get; set; }
}

public class WeatherFilter : DateRangeFilter
{
    public (decimal? min, decimal? max)? TemperatureRange { get; set; }
    public (decimal? min, decimal? max)? WindSpeedRange { get; set; }
}