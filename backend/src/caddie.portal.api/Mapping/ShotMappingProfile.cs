using AutoMapper;
using caddie.portal.api.DTOs.Shot;
using caddie.portal.services.Models;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories;

namespace caddie.portal.api.Mapping;

/// <summary>
/// AutoMapper profile for shot placement related DTOs and models
/// </summary>
public class ShotMappingProfile : Profile
{
    public ShotMappingProfile()
    {
        // Request DTOs to Service Models
        CreateMap<CreateShotPlacementRequestDto, CreateShotPlacementModel>();
        CreateMap<UpdateShotProgressRequestDto, UpdateShotProgressModel>();

        // Service Models to Response DTOs
        CreateMap<ShotPlacementModel, ShotPlacementResponseDto>()
            .ForMember(dest => dest.Latitude, opt => opt.MapFrom(src => src.Latitude))
            .ForMember(dest => dest.Longitude, opt => opt.MapFrom(src => src.Longitude))
            .ForMember(dest => dest.ActualLatitude, opt => opt.MapFrom(src => src.ActualLatitude))
            .ForMember(dest => dest.ActualLongitude, opt => opt.MapFrom(src => src.ActualLongitude));

        CreateMap<ShotPlacementStatsModel, ShotPlacementStatsResponseDto>();

        CreateMap<HoleYardageModel, HoleYardageResponseDto>()
            .ForMember(dest => dest.PinLocation, opt => opt.MapFrom(src => src.PinLocation != null 
                ? new CoordinateDto { Latitude = src.PinLocation.Latitude, Longitude = src.PinLocation.Longitude } 
                : null))
            .ForMember(dest => dest.TeeLocation, opt => opt.MapFrom(src => src.TeeLocation != null 
                ? new CoordinateDto { Latitude = src.TeeLocation.Latitude, Longitude = src.TeeLocation.Longitude } 
                : null));

        CreateMap<HoleModel, HoleResponseDto>()
            .ForMember(dest => dest.PinLocation, opt => opt.MapFrom(src => src.PinLocation != null 
                ? MapPointToCoordinate(src.PinLocation) 
                : null))
            .ForMember(dest => dest.TeeLocation, opt => opt.MapFrom(src => src.TeeLocation != null 
                ? MapPointToCoordinate(src.TeeLocation) 
                : null));

        // DAL Models to Service Models
        CreateMap<ShotPlacement, ShotPlacementModel>()
            .ForMember(dest => dest.Latitude, opt => opt.MapFrom(src => 
                src.ShotLocation != null ? src.ShotLocation.Y : 0))
            .ForMember(dest => dest.Longitude, opt => opt.MapFrom(src => 
                src.ShotLocation != null ? src.ShotLocation.X : 0))
            .ForMember(dest => dest.ActualLatitude, opt => opt.MapFrom(src => 
                src.ActualShotLocation != null ? (double?)src.ActualShotLocation.Y : null))
            .ForMember(dest => dest.ActualLongitude, opt => opt.MapFrom(src => 
                src.ActualShotLocation != null ? (double?)src.ActualShotLocation.X : null));

        CreateMap<Hole, HoleModel>()
            .ForMember(dest => dest.PinLocation, opt => opt.MapFrom(src => src.PinLocation))
            .ForMember(dest => dest.TeeLocation, opt => opt.MapFrom(src => src.TeeLocation));

        // Service Models to DAL Models (not typically used directly, but included for completeness)
        CreateMap<CreateShotPlacementModel, ShotPlacement>()
            .ForMember(dest => dest.ShotLocation, opt => opt.Ignore()) // Handled in service layer
            .ForMember(dest => dest.ActualShotLocation, opt => opt.Ignore())
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        // Coordinate mappings
        CreateMap<CoordinateModel, CoordinateDto>();
    }

    /// <summary>
    /// Helper method to map PostGIS Point to CoordinateDto
    /// </summary>
    private static CoordinateDto? MapPointToCoordinate(NetTopologySuite.Geometries.Point? point)
    {
        if (point == null) return null;
        
        var coords = ShotPlacementRepository.ExtractCoordinates(point);
        return new CoordinateDto 
        { 
            Latitude = coords.latitude, 
            Longitude = coords.longitude 
        };
    }
}