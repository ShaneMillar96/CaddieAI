using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.GarminDevice;

/// <summary>
/// Request DTO for registering a new Garmin device
/// </summary>
public class RegisterGarminDeviceRequestDto
{
    /// <summary>
    /// User-friendly device name (e.g., "My Forerunner 55")
    /// </summary>
    [Required(ErrorMessage = "Device name is required")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Device name must be between 1 and 100 characters")]
    public string DeviceName { get; set; } = null!;

    /// <summary>
    /// Garmin device model (e.g., "Forerunner 55", "Fenix 7")
    /// </summary>
    [Required(ErrorMessage = "Device model is required")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Device model must be between 1 and 100 characters")]
    public string DeviceModel { get; set; } = null!;

    /// <summary>
    /// MAC address for Bluetooth connection in XX:XX:XX:XX:XX:XX format
    /// </summary>
    [Required(ErrorMessage = "Bluetooth address is required")]
    [StringLength(17, MinimumLength = 17, ErrorMessage = "Bluetooth address must be exactly 17 characters")]
    [RegularExpression(@"^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$", 
        ErrorMessage = "Bluetooth address must be in XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX format")]
    public string BluetoothAddress { get; set; } = null!;

    /// <summary>
    /// Device firmware version for compatibility tracking
    /// </summary>
    [StringLength(50, ErrorMessage = "Firmware version cannot exceed 50 characters")]
    public string? FirmwareVersion { get; set; }

    /// <summary>
    /// Whether to automatically connect to this device when starting rounds
    /// </summary>
    public bool? AutoConnect { get; set; } = false;

    /// <summary>
    /// Whether this is the user's preferred device when multiple devices are paired
    /// </summary>
    public bool? PreferredDevice { get; set; } = false;
}