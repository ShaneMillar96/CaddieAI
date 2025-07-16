using AutoMapper;
using caddie.portal.api.DTOs.Auth;
using caddie.portal.api.DTOs.User;
using caddie.portal.services.Models;

namespace caddie.portal.api.Mapping;

public class AuthMappingProfile : Profile
{
    public AuthMappingProfile()
    {
        // Request DTOs to Service Models
        CreateMap<RegisterRequestDto, UserRegistrationModel>();
        CreateMap<LoginRequestDto, UserLoginModel>();

        // Service Models to Response DTOs
        CreateMap<UserModel, UserDto>();
        CreateMap<TokenResponse, LoginResponseDto>();
        CreateMap<AuthenticationResult, LoginResponseDto>()
            .ForMember(dest => dest.AccessToken, opt => opt.MapFrom(src => src.TokenResponse!.AccessToken))
            .ForMember(dest => dest.RefreshToken, opt => opt.MapFrom(src => src.TokenResponse!.RefreshToken))
            .ForMember(dest => dest.ExpiresAt, opt => opt.MapFrom(src => src.TokenResponse!.ExpiresAt))
            .ForMember(dest => dest.TokenType, opt => opt.MapFrom(src => src.TokenResponse!.TokenType))
            .ForMember(dest => dest.ExpiresIn, opt => opt.MapFrom(src => src.TokenResponse!.ExpiresIn))
            .ForMember(dest => dest.User, opt => opt.MapFrom(src => src.User));
    }
}