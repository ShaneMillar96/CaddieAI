using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace caddie.portal.dal.Models;

/// <summary>
/// Detailed GPS location history for shot detection and course analysis
/// </summary>
[Table("location_history")]
public partial class LocationHistory
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("round_id")]
    public int RoundId { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    /// <summary>
    /// GPS location point
    /// </summary>
    [Required]
    [Column("location", TypeName = "geometry(Point,4326)")]
    public Point Location { get; set; } = null!;

    /// <summary>
    /// GPS accuracy in meters
    /// </summary>
    [Column("accuracy_meters", TypeName = "decimal(6,2)")]
    public decimal? AccuracyMeters { get; set; }

    /// <summary>
    /// Altitude in meters
    /// </summary>
    [Column("altitude_meters", TypeName = "decimal(6,2)")]
    public decimal? AltitudeMeters { get; set; }

    /// <summary>
    /// Device heading in degrees (0-359)
    /// </summary>
    [Range(0, 359.99)]
    [Column("heading_degrees", TypeName = "decimal(5,2)")]
    public decimal? HeadingDegrees { get; set; }

    /// <summary>
    /// Movement speed in meters per second
    /// </summary>
    [Column("speed_mps", TypeName = "decimal(5,2)")]
    public decimal? SpeedMps { get; set; }

    /// <summary>
    /// Auto-detected current hole (1-18)
    /// </summary>
    [Range(1, 18)]
    [Column("detected_hole")]
    public int? DetectedHole { get; set; }

    /// <summary>
    /// Distance to pin in meters
    /// </summary>
    [Column("distance_to_pin_meters", TypeName = "decimal(6,2)")]
    public decimal? DistanceToPinMeters { get; set; }

    /// <summary>
    /// Distance to tee in meters
    /// </summary>
    [Column("distance_to_tee_meters", TypeName = "decimal(6,2)")]
    public decimal? DistanceToTeeMeters { get; set; }

    /// <summary>
    /// Position on hole (tee, fairway, rough, green, hazard, unknown)
    /// </summary>
    [MaxLength(20)]
    [Column("position_on_hole")]
    public string? PositionOnHole { get; set; }

    /// <summary>
    /// Whether location is within course boundaries
    /// </summary>
    [Column("within_course_boundary")]
    public bool WithinCourseBoundary { get; set; } = true;

    /// <summary>
    /// Type of movement detected (walking, running, stationary, driving, unknown)
    /// </summary>
    [MaxLength(20)]
    [Column("movement_type")]
    public string MovementType { get; set; } = "unknown";

    /// <summary>
    /// Additional location metadata as JSON
    /// </summary>
    [Column("location_metadata", TypeName = "jsonb")]
    public string? LocationMetadata { get; set; }

    /// <summary>
    /// When the GPS location was recorded by device
    /// </summary>
    [Required]
    [Column("recorded_at")]
    public DateTime RecordedAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("RoundId")]
    public virtual Round Round { get; set; } = null!;
    
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}