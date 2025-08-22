using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace caddie.portal.dal.Models;

/// <summary>
/// Manages Garmin device connections and pairing information for users
/// </summary>
[Table("garmin_devices")]
public partial class GarminDevice
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    /// <summary>
    /// User-friendly device name (e.g., "My Forerunner 55")
    /// </summary>
    [Required]
    [Column("device_name")]
    [StringLength(100)]
    public string DeviceName { get; set; } = null!;

    /// <summary>
    /// Garmin device model (e.g., "Forerunner 55", "Fenix 7")
    /// </summary>
    [Required]
    [Column("device_model")]
    [StringLength(100)]
    public string DeviceModel { get; set; } = null!;

    /// <summary>
    /// MAC address for Bluetooth connection in XX:XX:XX:XX:XX:XX format
    /// </summary>
    [Required]
    [Column("bluetooth_address")]
    [StringLength(17)]
    public string BluetoothAddress { get; set; } = null!;

    /// <summary>
    /// Current connection status of the device
    /// </summary>
    [Column("connection_status")]
    [StringLength(20)]
    public string? ConnectionStatus { get; set; }

    /// <summary>
    /// Timestamp of the last successful connection
    /// </summary>
    [Column("last_connected_at")]
    public DateTime? LastConnectedAt { get; set; }

    /// <summary>
    /// Last reported battery level as percentage (0-100)
    /// </summary>
    [Column("battery_level")]
    public int? BatteryLevel { get; set; }

    /// <summary>
    /// Device firmware version for compatibility tracking
    /// </summary>
    [Column("firmware_version")]
    [StringLength(50)]
    public string? FirmwareVersion { get; set; }

    /// <summary>
    /// Whether to automatically connect to this device when starting rounds
    /// </summary>
    [Column("auto_connect")]
    public bool? AutoConnect { get; set; }

    /// <summary>
    /// Whether this is the user's preferred device when multiple devices are paired
    /// </summary>
    [Column("preferred_device")]
    public bool? PreferredDevice { get; set; }

    /// <summary>
    /// Timestamp when the device was first paired
    /// </summary>
    [Column("paired_at")]
    public DateTime? PairedAt { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    /// <summary>
    /// Collection of swing analyses captured from this device
    /// </summary>
    [InverseProperty("GarminDevice")]
    public virtual ICollection<SwingAnalysis> SwingAnalyses { get; set; } = new List<SwingAnalysis>();
}