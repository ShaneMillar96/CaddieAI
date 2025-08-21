using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.GarminDevice;

/// <summary>
/// Request DTO for updating Garmin device connection status
/// </summary>
public class UpdateConnectionStatusRequestDto
{
    /// <summary>
    /// Current connection status of the device
    /// </summary>
    [Required(ErrorMessage = "Connection status is required")]
    [StringLength(20, ErrorMessage = "Connection status cannot exceed 20 characters")]
    [RegularExpression("^(connected|disconnected|pairing|error)$", 
        ErrorMessage = "Connection status must be 'connected', 'disconnected', 'pairing', or 'error'")]
    public string ConnectionStatus { get; set; } = null!;

    /// <summary>
    /// Last reported battery level as percentage (0-100)
    /// </summary>
    [Range(0, 100, ErrorMessage = "Battery level must be between 0 and 100")]
    public int? BatteryLevel { get; set; }

    /// <summary>
    /// Device firmware version for compatibility tracking
    /// </summary>
    [StringLength(50, ErrorMessage = "Firmware version cannot exceed 50 characters")]
    public string? FirmwareVersion { get; set; }
}