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
        CreateMap<CompleteHoleRequestDto, CompleteHoleModel>();
        
        // Quick Score Editing - No direct mapping needed as parameters are passed individually

        // Service Models to Response DTOs
        CreateMap<RoundModel, RoundResponseDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
        CreateMap<RoundModel, RoundListResponseDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
        CreateMap<RoundStatisticsModel, RoundStatisticsResponseDto>();
        
        CreateMap<PaginatedResult<RoundModel>, PaginatedRoundResponseDto>()
            .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.Data.Select(r => MapToRoundListResponse(r))));

        // Enhanced Round Management Mappings
        CreateMap<CompleteHoleResult, CompleteHoleResponseDto>();
        CreateMap<RoundProgress, RoundProgressResponseDto>()
            .ForMember(dest => dest.CompletedHoles, opt => opt.MapFrom(src => src.CompletedHoles.Select(h => MapToHoleScoreListDto(h))));
        CreateMap<HoleInfo, HoleInfoDto>();
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
            Notes = null, // Not available in simplified model
            CreatedAt = round.CreatedAt
        };
    }

    private static HoleScoreListDto MapToHoleScoreListDto(HoleScoreModel holeScore)
    {
        return new HoleScoreListDto
        {
            Id = holeScore.Id,
            HoleNumber = holeScore.HoleNumber,
            Score = holeScore.Score,
            Putts = holeScore.Putts,
            FairwayHit = holeScore.FairwayHit,
            GreenInRegulation = holeScore.GreenInRegulation,
            ScoreToPar = holeScore.ScoreToPar,
            Par = holeScore.Hole?.Par,
            ClubUsed = null // Not available in simplified model
        };
    }
}