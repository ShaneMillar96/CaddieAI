using AutoMapper;
using System.Text.Json;
using caddie.portal.api.DTOs.ClubRecommendation;
using caddie.portal.services.Models;
using caddie.portal.dal.Models;

namespace caddie.portal.api.Mapping;

public class ClubRecommendationMappingProfile : Profile
{
    public ClubRecommendationMappingProfile()
    {
        // Request DTOs to Service Models
        CreateMap<CreateClubRecommendationRequestDto, ClubRecommendationRequestModel>();
        CreateMap<ClubRecommendationFeedbackDto, ClubRecommendationFeedbackModel>();

        // Service Models to Response DTOs
        CreateMap<ClubRecommendationModel, ClubRecommendationResponseDto>()
            .ForMember(dest => dest.Reasoning, opt => opt.MapFrom(src => src.OpenaiReasoning))
            .ForMember(dest => dest.AlternativeClubs, opt => opt.MapFrom(src => ExtractAlternativeClubs(src.RecommendationMetadata)))
            .ForMember(dest => dest.Strategy, opt => opt.MapFrom(src => ExtractStrategy(src.RecommendationMetadata)))
            .ForMember(dest => dest.Factors, opt => opt.MapFrom(src => ExtractFactors(src.RecommendationMetadata)))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt ?? DateTime.UtcNow));

        CreateMap<ClubRecommendationModel, ClubRecommendationDto>();
        CreateMap<ClubRecommendationModel, ClubRecommendationDetailDto>()
            .ForMember(dest => dest.AlternativeClubs, opt => opt.MapFrom(src => ExtractAlternativeClubs(src.RecommendationMetadata)))
            .ForMember(dest => dest.Strategy, opt => opt.MapFrom(src => ExtractStrategy(src.RecommendationMetadata)))
            .ForMember(dest => dest.Factors, opt => opt.MapFrom(src => ExtractFactors(src.RecommendationMetadata)));

        // Analytics mappings
        CreateMap<ClubRecommendationAnalyticsModel, ClubRecommendationAnalyticsResponseDto>();
        CreateMap<ClubPopularityModel, ClubPopularityDto>();
        CreateMap<ClubAccuracyModel, ClubAccuracyDto>();

        // Entity to Service Model mappings
        CreateMap<ClubRecommendation, ClubRecommendationModel>();
        CreateMap<Location, LocationModel>();
        CreateMap<LocationModel, LocationDto>();

        // User and related mappings (if needed)
        CreateMap<User, UserModel>()
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}".Trim()));
    }

    private static List<string> ExtractAlternativeClubs(string? metadata)
    {
        if (string.IsNullOrEmpty(metadata))
            return new List<string>();

        try
        {
            var metadataDict = JsonSerializer.Deserialize<Dictionary<string, object>>(metadata);
            if (metadataDict != null && metadataDict.TryGetValue("AlternativeClubs", out var alternatives))
            {
                if (alternatives is JsonElement element && element.ValueKind == JsonValueKind.Array)
                {
                    return element.EnumerateArray()
                        .Where(x => x.ValueKind == JsonValueKind.String)
                        .Select(x => x.GetString() ?? "")
                        .Where(x => !string.IsNullOrEmpty(x))
                        .ToList();
                }
            }
        }
        catch (JsonException)
        {
            // Ignore JSON parsing errors and return empty list
        }

        return new List<string>();
    }

    private static string? ExtractStrategy(string? metadata)
    {
        if (string.IsNullOrEmpty(metadata))
            return null;

        try
        {
            var metadataDict = JsonSerializer.Deserialize<Dictionary<string, object>>(metadata);
            if (metadataDict != null && metadataDict.TryGetValue("Strategy", out var strategy))
            {
                if (strategy is JsonElement element && element.ValueKind == JsonValueKind.String)
                {
                    return element.GetString();
                }
            }
        }
        catch (JsonException)
        {
            // Ignore JSON parsing errors and return null
        }

        return null;
    }

    private static Dictionary<string, object> ExtractFactors(string? metadata)
    {
        if (string.IsNullOrEmpty(metadata))
            return new Dictionary<string, object>();

        try
        {
            var metadataDict = JsonSerializer.Deserialize<Dictionary<string, object>>(metadata);
            if (metadataDict != null && metadataDict.TryGetValue("Factors", out var factors))
            {
                if (factors is JsonElement element && element.ValueKind == JsonValueKind.Object)
                {
                    var factorsDict = new Dictionary<string, object>();
                    foreach (var property in element.EnumerateObject())
                    {
                        factorsDict[property.Name] = property.Value.ValueKind switch
                        {
                            JsonValueKind.String => property.Value.GetString() ?? "",
                            JsonValueKind.Number => property.Value.TryGetDecimal(out var dec) ? dec : property.Value.GetDouble(),
                            JsonValueKind.True => true,
                            JsonValueKind.False => false,
                            _ => property.Value.ToString()
                        };
                    }
                    return factorsDict;
                }
            }
        }
        catch (JsonException)
        {
            // Ignore JSON parsing errors and return empty dictionary
        }

        return new Dictionary<string, object>();
    }
}