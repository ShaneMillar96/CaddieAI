namespace caddie.portal.api.DTOs.GarminDevice;

/// <summary>
/// Response DTO for Garmin device information
/// </summary>
public class GarminDeviceResponseDto
{
    /// <summary>
    /// Unique identifier for the Garmin device
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// The user who owns this device
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// User-friendly device name (e.g., "My Forerunner 55")
    /// </summary>
    public string DeviceName { get; set; } = null!;

    /// <summary>
    /// Garmin device model (e.g., "Forerunner 55", "Fenix 7")
    /// </summary>
    public string DeviceModel { get; set; } = null!;

    /// <summary>
    /// MAC address for Bluetooth connection in XX:XX:XX:XX:XX:XX format
    /// </summary>
    public string BluetoothAddress { get; set; } = null!;

    /// <summary>
    /// Current connection status of the device
    /// </summary>
    public string? ConnectionStatus { get; set; }

    /// <summary>
    /// Timestamp of the last successful connection
    /// </summary>
    public DateTime? LastConnectedAt { get; set; }

    /// <summary>
    /// Last reported battery level as percentage (0-100)
    /// </summary>
    public int? BatteryLevel { get; set; }

    /// <summary>
    /// Device firmware version for compatibility tracking
    /// </summary>
    public string? FirmwareVersion { get; set; }

    /// <summary>
    /// Whether to automatically connect to this device when starting rounds
    /// </summary>
    public bool? AutoConnect { get; set; }

    /// <summary>
    /// Whether this is the user's preferred device when multiple devices are paired
    /// </summary>
    public bool? PreferredDevice { get; set; }

    /// <summary>
    /// Timestamp when the device was first paired
    /// </summary>
    public DateTime? PairedAt { get; set; }

    /// <summary>
    /// Timestamp when the record was created
    /// </summary>
    public DateTime? CreatedAt { get; set; }

    /// <summary>
    /// Timestamp when the record was last updated
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}