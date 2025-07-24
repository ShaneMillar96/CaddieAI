using AutoMapper;
using caddie.portal.api.DTOs.Round;
using caddie.portal.services.Models;

namespace caddie.portal.api.Mapping;

public class RoundMappingProfile : Profile
{
    public RoundMappingProfile()
    {
        // Request DTOs to Service Models
        CreateMap<CreateRoundRequestDto, CreateRoundModel>();
        CreateMap<UpdateRoundRequestDto, UpdateRoundModel>();
        CreateMap<StartRoundRequestDto, StartRoundModel>();
        CreateMap<CompleteRoundRequestDto, CompleteRoundModel>();

        // Service Models to Response DTOs
        CreateMap<RoundModel, RoundResponseDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
        CreateMap<RoundModel, RoundListResponseDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
        CreateMap<RoundStatisticsModel, RoundStatisticsResponseDto>();
        
        CreateMap<PaginatedResult<RoundModel>, PaginatedRoundResponseDto>()
            .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.Data.Select(r => MapToRoundListResponse(r))));
    }

    private static RoundListResponseDto MapToRoundListResponse(RoundModel round)
    {
        return new RoundListResponseDto
        {
            Id = round.Id,
            CourseId = round.CourseId,
            RoundDate = round.RoundDate,
            StartTime = round.StartTime,
            EndTime = round.EndTime,
            CurrentHole = round.CurrentHole,
            Status = round.Status.ToString(),
            TotalScore = round.TotalScore,
            Notes = round.Notes,
            CreatedAt = round.CreatedAt
        };
    }
}