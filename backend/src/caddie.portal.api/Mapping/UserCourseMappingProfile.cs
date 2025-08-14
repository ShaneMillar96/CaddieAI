using AutoMapper;
using caddie.portal.services.Models;
using caddie.portal.api.DTOs.UserCourse;

namespace caddie.portal.api.Mapping;

public class UserCourseMappingProfile : Profile
{
    public UserCourseMappingProfile()
    {
        // Request DTOs to Service Models
        CreateMap<AddUserCourseRequestDto, AddUserCourseModel>();

        // Service Models to Response DTOs
        CreateMap<UserCourseModel, UserCourseResponseDto>();
        CreateMap<UserHoleModel, UserHoleResponseDto>();
        CreateMap<UserCourseProximityModel, UserCourseProximityResponseDto>();
    }
}