using AutoMapper;
using caddie.portal.api.DTOs.GarminDevice;
using caddie.portal.dal.Models;
using caddie.portal.services.Models;

namespace caddie.portal.api.Mapping;

/// <summary>
/// AutoMapper profile for Garmin device mappings between DTOs, service models, and DAL entities
/// </summary>
public class GarminDeviceMappingProfile : Profile
{
    public GarminDeviceMappingProfile()
    {
        // Request DTOs to Service Models
        CreateMap<RegisterGarminDeviceRequestDto, RegisterGarminDeviceModel>()
            .ForMember(dest => dest.UserId, opt => opt.Ignore()); // Set by controller

        CreateMap<UpdateGarminDeviceRequestDto, UpdateGarminDeviceModel>();
        CreateMap<UpdateConnectionStatusRequestDto, UpdateConnectionStatusModel>();

        // Service Models to DAL Entities
        CreateMap<RegisterGarminDeviceModel, GarminDevice>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.ConnectionStatus, opt => opt.MapFrom(src => "disconnected"))
            .ForMember(dest => dest.LastConnectedAt, opt => opt.Ignore())
            .ForMember(dest => dest.BatteryLevel, opt => opt.Ignore())
            .ForMember(dest => dest.PairedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.SwingAnalyses, opt => opt.Ignore());

        CreateMap<UpdateGarminDeviceModel, GarminDevice>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.DeviceModel, opt => opt.Ignore())
            .ForMember(dest => dest.BluetoothAddress, opt => opt.Ignore())
            .ForMember(dest => dest.ConnectionStatus, opt => opt.Ignore())
            .ForMember(dest => dest.LastConnectedAt, opt => opt.Ignore())
            .ForMember(dest => dest.BatteryLevel, opt => opt.Ignore())
            .ForMember(dest => dest.PairedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.SwingAnalyses, opt => opt.Ignore());

        // DAL Entities to Service Models
        CreateMap<GarminDevice, GarminDeviceModel>();
        CreateMap<GarminDevice, RegisterGarminDeviceModel>();

        // Service Models to Response DTOs
        CreateMap<GarminDeviceModel, GarminDeviceResponseDto>();
        CreateMap<RegisterGarminDeviceModel, GarminDeviceResponseDto>();
        CreateMap<DeviceConnectionSummaryModel, DeviceConnectionSummaryResponseDto>();
        CreateMap<DeviceHealthStatus, DeviceHealthStatusResponseDto>();
        CreateMap<DevicePairingResult, DevicePairingResultResponseDto>()
            .ForMember(dest => dest.Device, opt => opt.MapFrom(src => src.Device));

        // DAL Entities to Response DTOs (direct mapping)
        CreateMap<GarminDevice, GarminDeviceResponseDto>();
    }
}

/// <summary>
/// Response DTO for device connection summary
/// </summary>
public class DeviceConnectionSummaryResponseDto
{
    public int UserId { get; set; }
    public int TotalDevices { get; set; }
    public int ConnectedDevices { get; set; }
    public int DisconnectedDevices { get; set; }
    public GarminDeviceResponseDto? PreferredDevice { get; set; }
    public List<GarminDeviceResponseDto> Devices { get; set; } = new();
}

/// <summary>
/// Response DTO for device health status
/// </summary>
public class DeviceHealthStatusResponseDto
{
    public int DeviceId { get; set; }
    public string DeviceName { get; set; } = null!;
    public string ConnectionStatus { get; set; } = null!;
    public int? BatteryLevel { get; set; }
    public DateTime? LastConnectedAt { get; set; }
    public bool IsHealthy { get; set; }
    public List<string> HealthIssues { get; set; } = new();
    public DateTime CheckedAt { get; set; }
}

/// <summary>
/// Response DTO for device pairing result
/// </summary>
public class DevicePairingResultResponseDto
{
    public bool Success { get; set; }
    public GarminDeviceResponseDto? Device { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

/// <summary>
/// Response DTO for connectivity test result
/// </summary>
public class ConnectivityTestResultResponseDto
{
    public bool IsConnected { get; set; }
    public string StatusMessage { get; set; } = null!;
    public DateTime TestedAt { get; set; } = DateTime.UtcNow;
}