using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.GarminDevice;

/// <summary>
/// Request DTO for updating Garmin device information
/// </summary>
public class UpdateGarminDeviceRequestDto
{
    /// <summary>
    /// User-friendly device name (e.g., "My Forerunner 55")
    /// </summary>
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Device name must be between 1 and 100 characters")]
    public string? DeviceName { get; set; }

    /// <summary>
    /// Device firmware version for compatibility tracking
    /// </summary>
    [StringLength(50, ErrorMessage = "Firmware version cannot exceed 50 characters")]
    public string? FirmwareVersion { get; set; }

    /// <summary>
    /// Whether to automatically connect to this device when starting rounds
    /// </summary>
    public bool? AutoConnect { get; set; }

    /// <summary>
    /// Whether this is the user's preferred device when multiple devices are paired
    /// </summary>
    public bool? PreferredDevice { get; set; }
}