using AutoMapper;
using caddie.portal.services.Models;
using caddie.portal.api.DTOs.ShotAnalysis;

namespace caddie.portal.api.Mapping;

/// <summary>
/// AutoMapper profile for shot analysis controller mappings
/// </summary>
public class ShotAnalysisControllerMappingProfile : Profile
{
    public ShotAnalysisControllerMappingProfile()
    {
        // Map from service model to response DTO
        CreateMap<ShotAnalysisResult, ShotAnalysisResponseDto>()
            .ForMember(dest => dest.RecommendedClub, opt => opt.MapFrom(src => src.RecommendedClub))
            .ForMember(dest => dest.ShotTips, opt => opt.MapFrom(src => src.ShotTips))
            .ForMember(dest => dest.ConfidenceScore, opt => opt.MapFrom(src => src.ConfidenceScore))
            .ForMember(dest => dest.ErrorMessage, opt => opt.MapFrom(src => src.ErrorMessage));

        // Map weather data to weather conditions DTO
        CreateMap<WeatherData, WeatherConditionsDto>()
            .ForMember(dest => dest.Conditions, opt => opt.MapFrom(src => src.Conditions))
            .ForMember(dest => dest.WindSpeed, opt => opt.MapFrom(src => (int)src.WindSpeed))
            .ForMember(dest => dest.WindDirection, opt => opt.MapFrom(src => src.WindDirection))
            .ForMember(dest => dest.Temperature, opt => opt.MapFrom(src => (int)src.Temperature));
    }
}