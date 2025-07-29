using AutoMapper;
using caddie.portal.api.DTOs.Round;
using caddie.portal.services.Models;

namespace caddie.portal.api.MappingProfiles;

/// <summary>
/// AutoMapper profile for HoleScore-related mappings
/// </summary>
public class HoleScoreMappingProfile : Profile
{
    public HoleScoreMappingProfile()
    {
        // HoleScore model to response DTO mappings
        CreateMap<HoleScoreModel, HoleScoreResponseDto>()
            .ForMember(dest => dest.ScoreToPar, opt => opt.MapFrom(src => src.ScoreToPar))
            .ForMember(dest => dest.Par, opt => opt.MapFrom(src => src.Hole != null ? src.Hole.Par : (int?)null))
            .ForMember(dest => dest.YardageWhite, opt => opt.MapFrom(src => src.Hole != null ? src.Hole.YardageWhite : (int?)null))
            .ForMember(dest => dest.StrokeIndex, opt => opt.MapFrom(src => src.Hole != null ? src.Hole.StrokeIndex : (int?)null));

        CreateMap<HoleScoreModel, HoleScoreListDto>()
            .ForMember(dest => dest.ScoreToPar, opt => opt.MapFrom(src => src.ScoreToPar))
            .ForMember(dest => dest.Par, opt => opt.MapFrom(src => src.Hole != null ? src.Hole.Par : (int?)null));

        // Request DTO to model mappings
        CreateMap<CreateHoleScoreRequestDto, CreateHoleScoreModel>();
        CreateMap<CreateHoleScoreRequestDto, UpdateHoleScoreModel>();
        CreateMap<UpdateHoleScoreRequestDto, UpdateHoleScoreModel>();

        // Summary mappings
        CreateMap<HoleScoreSummaryModel, HoleScoreSummaryDto>()
            .ForMember(dest => dest.HoleScores, opt => opt.MapFrom(src => src.HoleScores));
    }
}