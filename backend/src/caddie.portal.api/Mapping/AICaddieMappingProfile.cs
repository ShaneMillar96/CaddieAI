using AutoMapper;
using caddie.portal.api.DTOs.AICaddie;
using caddie.portal.services.Models;
using caddie.portal.services.Interfaces;

namespace caddie.portal.api.Mapping;

/// <summary>
/// AutoMapper profile for AI Caddie feature mappings
/// </summary>
public class AICaddieMappingProfile : Profile
{
    public AICaddieMappingProfile()
    {
        ConfigureLocationMappings();
        ConfigureUserContextMappings();
        ConfigureGolfContextMappings();
        ConfigureShotTypeMappings();
        ConfigureClubRecommendationMappings();
        ConfigureStrategicAdviceMappings();
        ConfigureDistanceAnalysisMappings();
        ConfigureSkillBasedMappings();
    }

    /// <summary>
    /// Configure location context mappings
    /// </summary>
    private void ConfigureLocationMappings()
    {
        CreateMap<LocationContextDto, LocationContext>()
            .ForMember(dest => dest.Timestamp, opt => opt.MapFrom(src => src.Timestamp));

        CreateMap<LocationContext, LocationContextDto>()
            .ForMember(dest => dest.Timestamp, opt => opt.MapFrom(src => src.Timestamp));
    }

    /// <summary>
    /// Configure user context mappings
    /// </summary>
    private void ConfigureUserContextMappings()
    {
        CreateMap<UserGolfProfile, UserContextResponse>()
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.Handicap, opt => opt.MapFrom(src => src.Handicap))
            .ForMember(dest => dest.SkillLevel, opt => opt.MapFrom(src => MapSkillLevel(src)))
            .ForMember(dest => dest.PlayingStyle, opt => opt.MapFrom(src => src.PlayingStyle))
            .ForMember(dest => dest.Preferences, opt => opt.MapFrom(src => src.Preferences))
            .ForMember(dest => dest.CommunicationStyle, opt => opt.MapFrom(src => GetCommunicationStyle(src.Preferences)));

        // Skill level mapping
        CreateMap<string, SkillLevelDto>()
            .ConvertUsing(src => MapSkillLevelString(src));
    }

    /// <summary>
    /// Configure golf context mappings
    /// </summary>
    private void ConfigureGolfContextMappings()
    {
        CreateMap<GolfContext, GolfContextDto>()
            .ForMember(dest => dest.Course, opt => opt.MapFrom(src => src.Course))
            .ForMember(dest => dest.CurrentHole, opt => opt.MapFrom(src => src.CurrentHole))
            .ForMember(dest => dest.Round, opt => opt.MapFrom(src => src.Round))
            .ForMember(dest => dest.Weather, opt => opt.MapFrom(src => src.Weather));

        CreateMap<CourseContext, CourseContextDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.CourseId))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.Location, opt => opt.MapFrom(src => src.Location))
            .ForMember(dest => dest.ParTotal, opt => opt.MapFrom(src => src.ParTotal))
            .ForMember(dest => dest.Difficulty, opt => opt.MapFrom(src => src.Difficulty));

        CreateMap<HoleContext, HoleContextDto>()
            .ForMember(dest => dest.Number, opt => opt.MapFrom(src => src.HoleNumber))
            .ForMember(dest => dest.Par, opt => opt.MapFrom(src => src.Par))
            .ForMember(dest => dest.Yardage, opt => opt.MapFrom(src => src.Yardage))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
            .ForMember(dest => dest.Handicap, opt => opt.MapFrom(src => src.HoleId)); // Map hole ID as handicap for now

        CreateMap<RoundContext, RoundContextDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.RoundId))
            .ForMember(dest => dest.StartTime, opt => opt.MapFrom(src => src.StartTime))
            .ForMember(dest => dest.CurrentHole, opt => opt.MapFrom(src => src.CurrentHole ?? 1))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status ?? "in_progress"))
            .ForMember(dest => dest.CurrentScore, opt => opt.MapFrom(src => (int?)null)); // Not available in RoundContext

        CreateMap<WeatherContext, WeatherContextDto>()
            .ForMember(dest => dest.Conditions, opt => opt.MapFrom(src => src.Conditions))
            .ForMember(dest => dest.Temperature, opt => opt.MapFrom(src => src.Temperature))
            .ForMember(dest => dest.WindSpeed, opt => opt.MapFrom(src => src.WindSpeed))
            .ForMember(dest => dest.WindDirection, opt => opt.MapFrom(src => src.WindDirection))
            .ForMember(dest => dest.Humidity, opt => opt.MapFrom(src => (decimal?)null)); // Not available in WeatherContext
    }

    /// <summary>
    /// Configure shot type mappings
    /// </summary>
    private void ConfigureShotTypeMappings()
    {
        CreateMap<ShotContextDto, ShotContext>()
            .ForMember(dest => dest.Position, opt => opt.MapFrom(src => src.Position))
            .ForMember(dest => dest.LieQuality, opt => opt.MapFrom(src => src.LieQuality))
            .ForMember(dest => dest.Slope, opt => opt.MapFrom(src => src.Slope))
            .ForMember(dest => dest.Hazards, opt => opt.MapFrom(src => src.Hazards))
            .ForMember(dest => dest.Intention, opt => opt.MapFrom(src => src.Intention))
            .ForMember(dest => dest.DistanceToPinYards, opt => opt.MapFrom(src => (decimal?)null))
            .ForMember(dest => dest.Weather, opt => opt.MapFrom(src => (WeatherContext?)null));

        CreateMap<ShotTypeDetectionResult, ShotTypeDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.ShotType))
            .ForMember(dest => dest.Confidence, opt => opt.MapFrom(src => src.Confidence))
            .ForMember(dest => dest.Reasoning, opt => opt.MapFrom(src => src.Reasoning))
            .ForMember(dest => dest.Alternatives, opt => opt.MapFrom(src => src.Alternatives.Select(a => a.ShotType).ToList()));
    }

    /// <summary>
    /// Configure club recommendation mappings
    /// </summary>
    private void ConfigureClubRecommendationMappings()
    {
        CreateMap<SkillBasedClubRecommendation, ClubRecommendationDto>()
            .ForMember(dest => dest.Club, opt => opt.MapFrom(src => src.RecommendedClub))
            .ForMember(dest => dest.Alternatives, opt => opt.MapFrom(src => src.AlternativeClubs))
            .ForMember(dest => dest.Reasoning, opt => opt.MapFrom(src => src.SkillBasedReasoning))
            .ForMember(dest => dest.Confidence, opt => opt.MapFrom(src => src.Confidence))
            .ForMember(dest => dest.SkillAdjustments, opt => opt.MapFrom(src => MapSkillAdjustments(src.SkillAdjustments)));

        CreateMap<ClubRecommendationResult, ClubRecommendationDto>()
            .ForMember(dest => dest.Club, opt => opt.MapFrom(src => src.PrimaryClub))
            .ForMember(dest => dest.Alternatives, opt => opt.MapFrom(src => src.AlternativeClubs.Select(c => c.Club).ToList()))
            .ForMember(dest => dest.Reasoning, opt => opt.MapFrom(src => src.SkillBasedReasoning))
            .ForMember(dest => dest.Confidence, opt => opt.MapFrom(src => src.RecommendationConfidence))
            .ForMember(dest => dest.SkillAdjustments, opt => opt.MapFrom(src => MapSkillAdjustments(src.SkillAdjustments)));
    }

    /// <summary>
    /// Configure strategic advice mappings
    /// </summary>
    private void ConfigureStrategicAdviceMappings()
    {
        CreateMap<SkillBasedStrategicAdvice, SkillBasedAdviceDto>()
            .ForMember(dest => dest.Advice, opt => opt.MapFrom(src => src.PrimaryAdvice))
            .ForMember(dest => dest.TargetArea, opt => opt.MapFrom(src => src.TargetRecommendation.PrimaryTarget))
            .ForMember(dest => dest.RiskAssessment, opt => opt.MapFrom(src => src.RiskAssessment.RiskRewardAnalysis))
            .ForMember(dest => dest.CourseManagement, opt => opt.MapFrom(src => MapCourseManagement(src.Strategy)))
            .ForMember(dest => dest.SkillTips, opt => opt.MapFrom(src => src.LearningOpportunities));

        CreateMap<StrategicAdviceResult, SkillBasedAdviceDto>()
            .ForMember(dest => dest.Advice, opt => opt.MapFrom(src => src.PrimaryStrategy))
            .ForMember(dest => dest.TargetArea, opt => opt.MapFrom(src => src.TargetingStrategy.PrimaryTarget))
            .ForMember(dest => dest.RiskAssessment, opt => opt.MapFrom(src => src.RiskManagement.RiskRewardAnalysis.Analysis))
            .ForMember(dest => dest.CourseManagement, opt => opt.MapFrom(src => MapCourseManagementResult(src.CourseManagement)))
            .ForMember(dest => dest.SkillTips, opt => opt.MapFrom(src => MapDevelopmentOpportunities(src.DevelopmentOpportunities)));
    }

    /// <summary>
    /// Configure distance analysis mappings
    /// </summary>
    private void ConfigureDistanceAnalysisMappings()
    {
        CreateMap<DistanceAnalysisResult, DistanceAnalysisDto>()
            .ForMember(dest => dest.DistanceToPinYards, opt => opt.MapFrom(src => src.StraightDistanceYards))
            .ForMember(dest => dest.CarryDistanceYards, opt => opt.MapFrom(src => src.CarryDistanceYards))
            .ForMember(dest => dest.ElevationChangeYards, opt => opt.MapFrom(src => src.ElevationAdjustmentYards))
            .ForMember(dest => dest.EffectiveDistanceYards, opt => opt.MapFrom(src => src.PlayingDistanceYards))
            .ForMember(dest => dest.HazardDistances, opt => opt.MapFrom(src => src.HazardDistances));
    }

    /// <summary>
    /// Configure skill-based mappings
    /// </summary>
    private void ConfigureSkillBasedMappings()
    {
        // Map enhanced shot analysis result components
        CreateMap<EnhancedShotAnalysisResult, ShotAnalysisResponse>()
            .ForMember(dest => dest.ClubRecommendation, opt => opt.MapFrom(src => src.ClubRecommendation))
            .ForMember(dest => dest.StrategicAdvice, opt => opt.MapFrom(src => src.StrategicAdvice))
            .ForMember(dest => dest.DistanceAnalysis, opt => opt.MapFrom(src => src.DistanceAnalysis))
            .ForMember(dest => dest.ConfidenceScore, opt => opt.MapFrom(src => src.OverallConfidence))
            .ForMember(dest => dest.ShotType, opt => opt.Ignore()) // Set by controller
            .ForMember(dest => dest.AnalyzedAt, opt => opt.MapFrom(src => src.AnalyzedAt));
    }

    #region Private Mapping Helper Methods

    /// <summary>
    /// Map UserGolfProfile to SkillLevelDto
    /// </summary>
    private static SkillLevelDto MapSkillLevel(UserGolfProfile userProfile)
    {
        return new SkillLevelDto
        {
            Id = GetSkillLevelId(userProfile.SkillLevel),
            Name = userProfile.SkillLevel ?? "intermediate",
            Description = GetSkillLevelDescription(userProfile.SkillLevel),
            HandicapRange = GetHandicapRange(userProfile.SkillLevel)
        };
    }

    /// <summary>
    /// Map skill level string to SkillLevelDto
    /// </summary>
    private static SkillLevelDto MapSkillLevelString(string skillLevel)
    {
        return new SkillLevelDto
        {
            Id = GetSkillLevelId(skillLevel),
            Name = skillLevel ?? "intermediate",
            Description = GetSkillLevelDescription(skillLevel),
            HandicapRange = GetHandicapRange(skillLevel)
        };
    }

    /// <summary>
    /// Get skill level ID from name
    /// </summary>
    private static int GetSkillLevelId(string? skillLevel)
    {
        return skillLevel?.ToLower() switch
        {
            "beginner" => 1,
            "intermediate" => 2,
            "advanced" => 3,
            "professional" => 4,
            _ => 2
        };
    }

    /// <summary>
    /// Get skill level description
    /// </summary>
    private static string GetSkillLevelDescription(string? skillLevel)
    {
        return skillLevel?.ToLower() switch
        {
            "beginner" => "Learning fundamentals and basic course management",
            "intermediate" => "Solid fundamentals with developing course strategy",
            "advanced" => "Skilled player with good course management and shot-making ability",
            "professional" => "Expert-level skills with precision and advanced strategy",
            _ => "Solid fundamentals with developing course strategy"
        };
    }

    /// <summary>
    /// Get typical handicap range for skill level
    /// </summary>
    private static string GetHandicapRange(string? skillLevel)
    {
        return skillLevel?.ToLower() switch
        {
            "beginner" => "25-36+",
            "intermediate" => "10-24",
            "advanced" => "0-9",
            "professional" => "Scratch to +6",
            _ => "10-24"
        };
    }

    /// <summary>
    /// Get communication style from user preferences
    /// </summary>
    private static string GetCommunicationStyle(Dictionary<string, object>? preferences)
    {
        if (preferences != null && preferences.ContainsKey("communication_style"))
        {
            return preferences["communication_style"].ToString() ?? "encouraging";
        }
        return "encouraging";
    }

    /// <summary>
    /// Map skill adjustments to string list
    /// </summary>
    private static List<string> MapSkillAdjustments(List<SkillAdjustment> adjustments)
    {
        return adjustments.Select(adj => 
            $"{adj.AdjustmentType}: {adj.Reason}").ToList();
    }

    /// <summary>
    /// Map course management strategy to string list
    /// </summary>
    private static List<string> MapCourseManagement(CourseManagementStrategy strategy)
    {
        var management = new List<string>
        {
            strategy.Description
        };
        management.AddRange(strategy.KeyPrinciples);
        return management;
    }

    /// <summary>
    /// Map course management advice to string list
    /// </summary>
    private static List<string> MapCourseManagementResult(CourseManagementAdvice advice)
    {
        var management = new List<string>
        {
            advice.Strategy
        };
        management.AddRange(advice.HoleSpecificTips);
        return management;
    }

    /// <summary>
    /// Map development opportunities to skill tips
    /// </summary>
    private static List<string> MapDevelopmentOpportunities(List<SkillDevelopmentOpportunity> opportunities)
    {
        return opportunities.Select(opp => 
            $"{opp.SkillArea}: {opp.LearningOpportunity}").ToList();
    }

    #endregion
}