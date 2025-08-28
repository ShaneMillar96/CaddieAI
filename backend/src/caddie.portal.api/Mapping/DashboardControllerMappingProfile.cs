using AutoMapper;
using caddie.portal.api.DTOs.Dashboard;
using caddie.portal.services.Models;

namespace caddie.portal.api.Mapping;

/// <summary>
/// AutoMapper profile for Dashboard controller mappings between service models and DTOs
/// </summary>
public class DashboardControllerMappingProfile : Profile
{
    public DashboardControllerMappingProfile()
    {
        // Dashboard Overview Mappings
        CreateMap<DashboardOverviewModel, DashboardOverviewResponse>()
            .ForMember(dest => dest.UserStats, opt => opt.MapFrom(src => src.UserStats))
            .ForMember(dest => dest.RecentRounds, opt => opt.MapFrom(src => src.RecentRounds))
            .ForMember(dest => dest.Insights, opt => opt.MapFrom(src => src.Insights))
            .ForMember(dest => dest.ShotAnalytics, opt => opt.MapFrom(src => src.ShotAnalytics))
            .ForMember(dest => dest.LastUpdated, opt => opt.MapFrom(src => src.LastUpdated));

        // User Statistics Mappings
        CreateMap<UserStatsModel, UserStatsDto>()
            .ForMember(dest => dest.CurrentHandicap, opt => opt.MapFrom(src => src.CurrentHandicap))
            .ForMember(dest => dest.HandicapChange, opt => opt.MapFrom(src => src.HandicapChange))
            .ForMember(dest => dest.ScoringAverage, opt => opt.MapFrom(src => src.ScoringAverage))
            .ForMember(dest => dest.TotalRoundsThisSeason, opt => opt.MapFrom(src => src.TotalRoundsThisSeason))
            .ForMember(dest => dest.FavoriteCourse, opt => opt.MapFrom(src => src.FavoriteCourse))
            .ForMember(dest => dest.BestScore, opt => opt.MapFrom(src => src.BestScore))
            .ForMember(dest => dest.RoundsAnalyzed, opt => opt.MapFrom(src => src.RoundsAnalyzed));

        // Recent Round Mappings
        CreateMap<RecentRoundModel, RecentRoundDto>()
            .ForMember(dest => dest.RoundId, opt => opt.MapFrom(src => src.RoundId))
            .ForMember(dest => dest.CourseName, opt => opt.MapFrom(src => src.CourseName))
            .ForMember(dest => dest.DatePlayed, opt => opt.MapFrom(src => src.DatePlayed))
            .ForMember(dest => dest.TotalScore, opt => opt.MapFrom(src => src.TotalScore))
            .ForMember(dest => dest.ParTotal, opt => opt.MapFrom(src => src.ParTotal))
            .ForMember(dest => dest.Duration, opt => opt.MapFrom(src => src.Duration))
            .ForMember(dest => dest.BestHole, opt => opt.MapFrom(src => src.BestHole))
            .ForMember(dest => dest.WorstHole, opt => opt.MapFrom(src => src.WorstHole))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

        // Performance Insights Mappings
        CreateMap<PerformanceInsightsModel, PerformanceInsightsDto>()
            .ForMember(dest => dest.TrendAnalysis, opt => opt.MapFrom(src => src.TrendAnalysis))
            .ForMember(dest => dest.Strengths, opt => opt.MapFrom(src => src.Strengths))
            .ForMember(dest => dest.ImprovementAreas, opt => opt.MapFrom(src => src.ImprovementAreas))
            .ForMember(dest => dest.Recommendations, opt => opt.MapFrom(src => src.Recommendations))
            .ForMember(dest => dest.MotivationalMessage, opt => opt.MapFrom(src => src.MotivationalMessage))
            .ForMember(dest => dest.GeneratedAt, opt => opt.MapFrom(src => src.GeneratedAt))
            .ForMember(dest => dest.ConfidenceLevel, opt => opt.MapFrom(src => src.ConfidenceLevel))
            .ForMember(dest => dest.RoundsAnalyzed, opt => opt.MapFrom(src => src.RoundsAnalyzed));

        // Shot Analytics Mappings
        CreateMap<ShotAnalyticsModel, ShotAnalyticsDto>()
            .ForMember(dest => dest.ClubUsage, opt => opt.MapFrom(src => src.ClubUsage))
            .ForMember(dest => dest.AverageDistances, opt => opt.MapFrom(src => src.AverageDistances))
            .ForMember(dest => dest.AccuracyPercentage, opt => opt.MapFrom(src => src.AccuracyPercentage))
            .ForMember(dest => dest.TotalShotsAnalyzed, opt => opt.MapFrom(src => src.TotalShotsAnalyzed))
            .ForMember(dest => dest.FavoriteClub, opt => opt.MapFrom(src => src.FavoriteClub))
            .ForMember(dest => dest.MostAccurateClub, opt => opt.MapFrom(src => src.MostAccurateClub))
            .ForMember(dest => dest.GreensInRegulation, opt => opt.MapFrom(src => src.GreensInRegulation))
            .ForMember(dest => dest.AveragePutts, opt => opt.MapFrom(src => src.AveragePutts));

        // Refresh Insights Mappings
        CreateMap<RefreshInsightsModel, RefreshInsightsResponseDto>()
            .ForMember(dest => dest.Success, opt => opt.MapFrom(src => src.Success))
            .ForMember(dest => dest.UpdatedInsights, opt => opt.MapFrom(src => src.UpdatedInsights))
            .ForMember(dest => dest.Message, opt => opt.MapFrom(src => src.Message))
            .ForMember(dest => dest.RefreshedAt, opt => opt.MapFrom(src => src.RefreshedAt));

        // Request DTOs (minimal mappings needed)
        CreateMap<RefreshInsightsRequestDto, RefreshInsightsModel>()
            .ForMember(dest => dest.Success, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedInsights, opt => opt.Ignore())
            .ForMember(dest => dest.Message, opt => opt.Ignore())
            .ForMember(dest => dest.RefreshedAt, opt => opt.Ignore());
    }
}