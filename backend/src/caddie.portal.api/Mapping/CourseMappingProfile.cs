using AutoMapper;
using caddie.portal.api.DTOs.Course;
using caddie.portal.services.Models;

namespace caddie.portal.api.Mapping;

public class CourseMappingProfile : Profile
{
    public CourseMappingProfile()
    {
        // Request DTOs to Service Models
        CreateMap<CreateCourseRequestDto, CreateCourseModel>();
        CreateMap<CreateHoleRequestDto, CreateHoleModel>();
        CreateMap<UpdateCourseRequestDto, UpdateCourseModel>();

        // Service Models to Response DTOs
        CreateMap<CourseModel, CourseResponseDto>();
        CreateMap<CourseModel, CourseListResponseDto>();
        CreateMap<HoleModel, HoleResponseDto>();
        
        CreateMap<PaginatedResult<CourseModel>, PaginatedCourseResponseDto>()
            .ForMember(dest => dest.Data, opt => opt.MapFrom(src => src.Data.Select(c => MapToCourseListResponse(c))));
    }

    private static CourseListResponseDto MapToCourseListResponse(CourseModel course)
    {
        return new CourseListResponseDto
        {
            Id = course.Id,
            Name = course.Name,
            Description = course.Description,
            City = course.City,
            State = course.State,
            Country = course.Country,
            TotalHoles = course.TotalHoles,
            ParTotal = course.ParTotal,
            GreenFeeRange = course.GreenFeeRange,
            IsActive = course.IsActive,
            Latitude = course.Latitude,
            Longitude = course.Longitude
        };
    }
}