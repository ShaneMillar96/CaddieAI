namespace caddie.portal.services.Models;

/// <summary>
/// Service model for registering a new Garmin device
/// </summary>
public class RegisterGarminDeviceModel
{
    public int UserId { get; set; }
    public string DeviceName { get; set; } = null!;
    public string DeviceModel { get; set; } = null!;
    public string BluetoothAddress { get; set; } = null!;
    public string? FirmwareVersion { get; set; }
    public bool? AutoConnect { get; set; } = false;
    public bool? PreferredDevice { get; set; } = false;
}

/// <summary>
/// Service model for updating a Garmin device
/// </summary>
public class UpdateGarminDeviceModel
{
    public string? DeviceName { get; set; }
    public string? FirmwareVersion { get; set; }
    public bool? AutoConnect { get; set; }
    public bool? PreferredDevice { get; set; }
}

/// <summary>
/// Service model for updating device connection status
/// </summary>
public class UpdateConnectionStatusModel
{
    public string ConnectionStatus { get; set; } = null!;
    public int? BatteryLevel { get; set; }
    public string? FirmwareVersion { get; set; }
}

/// <summary>
/// Service model for Garmin device data
/// </summary>
public class GarminDeviceModel
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string DeviceName { get; set; } = null!;
    public string DeviceModel { get; set; } = null!;
    public string BluetoothAddress { get; set; } = null!;
    public string? ConnectionStatus { get; set; }
    public DateTime? LastConnectedAt { get; set; }
    public int? BatteryLevel { get; set; }
    public string? FirmwareVersion { get; set; }
    public bool? AutoConnect { get; set; }
    public bool? PreferredDevice { get; set; }
    public DateTime? PairedAt { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Service model for device connection summary
/// </summary>
public class DeviceConnectionSummaryModel
{
    public int UserId { get; set; }
    public int TotalDevices { get; set; }
    public int ConnectedDevices { get; set; }
    public int DisconnectedDevices { get; set; }
    public GarminDeviceModel? PreferredDevice { get; set; }
    public List<GarminDeviceModel> Devices { get; set; } = new();
}

/// <summary>
/// Service model for device validation result
/// </summary>
public class DeviceValidationResult
{
    public bool IsValid { get; set; }
    public List<string> ValidationErrors { get; set; } = new();
    public string? ErrorCode { get; set; }
}

/// <summary>
/// Service model for device pairing result
/// </summary>
public class DevicePairingResult
{
    public bool Success { get; set; }
    public GarminDeviceModel? Device { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

/// <summary>
/// Service model for device health status
/// </summary>
public class DeviceHealthStatus
{
    public int DeviceId { get; set; }
    public string DeviceName { get; set; } = null!;
    public string ConnectionStatus { get; set; } = null!;
    public int? BatteryLevel { get; set; }
    public DateTime? LastConnectedAt { get; set; }
    public bool IsHealthy { get; set; }
    public List<string> HealthIssues { get; set; } = new();
    public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
}