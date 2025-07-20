using AutoMapper;
using caddie.portal.api.DTOs.Chat;
using caddie.portal.dal.Models;

namespace caddie.portal.api.Mapping;

public class ChatMappingProfile : Profile
{
    public ChatMappingProfile()
    {
        // ChatSession mappings
        CreateMap<ChatSession, ChatSessionDto>();
        
        CreateMap<ChatSession, ChatSessionDetailDto>()
            .ForMember(dest => dest.Messages, opt => opt.MapFrom(src => src.ChatMessages))
            .ForMember(dest => dest.CourseName, opt => opt.MapFrom(src => src.Course != null ? src.Course.Name : null))
            .ForMember(dest => dest.RoundStatus, opt => opt.MapFrom(src => src.Round != null ? src.Round.Status : null));

        CreateMap<ChatSession, ChatSessionSummaryDto>()
            .ForMember(dest => dest.CourseName, opt => opt.MapFrom(src => src.Course != null ? src.Course.Name : null))
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => IsSessionActive(src)));

        // ChatMessage mappings
        CreateMap<ChatMessage, ChatMessageDto>();
        
        CreateMap<ChatMessage, ChatMessageSummaryDto>();
    }

    private static bool IsSessionActive(ChatSession session)
    {
        // Consider a session active if it has messages in the last 24 hours
        if (session.LastMessageAt == null) return false;
        return session.LastMessageAt.Value > DateTime.UtcNow.AddHours(-24);
    }
}