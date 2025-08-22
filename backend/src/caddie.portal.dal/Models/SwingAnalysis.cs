using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace caddie.portal.dal.Models;

/// <summary>
/// Golf swing analysis data captured from Garmin devices and mobile sensors during rounds
/// </summary>
[Table("swing_analyses")]
public partial class SwingAnalysis
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [Column("round_id")]
    public int RoundId { get; set; }

    [Column("hole_id")]
    public int? HoleId { get; set; }

    /// <summary>
    /// Foreign key to garmin_devices table, only populated when detection_source is garmin, NULL for mobile detections
    /// </summary>
    [Column("garmin_device_id")]
    public int? GarminDeviceId { get; set; }

    /// <summary>
    /// Club head speed in miles per hour measured at impact
    /// </summary>
    [Column("swing_speed_mph", TypeName = "decimal(5,2)")]
    public decimal? SwingSpeedMph { get; set; }

    /// <summary>
    /// Primary swing plane angle in degrees
    /// </summary>
    [Column("swing_angle_degrees", TypeName = "decimal(6,2)")]
    public decimal? SwingAngleDegrees { get; set; }

    /// <summary>
    /// Maximum backswing angle in degrees
    /// </summary>
    [Column("backswing_angle_degrees", TypeName = "decimal(6,2)")]
    public decimal? BackswingAngleDegrees { get; set; }

    /// <summary>
    /// Follow-through completion angle in degrees
    /// </summary>
    [Column("follow_through_angle_degrees", TypeName = "decimal(6,2)")]
    public decimal? FollowThroughAngleDegrees { get; set; }

    /// <summary>
    /// JSON blob containing raw accelerometer and gyroscope data for future analysis
    /// </summary>
    [Column("raw_sensor_data", TypeName = "jsonb")]
    public string? RawSensorData { get; set; }

    /// <summary>
    /// Source device that detected the swing (garmin or mobile)
    /// </summary>
    [Required]
    [Column("detection_source")]
    [StringLength(20)]
    public string DetectionSource { get; set; } = null!;

    /// <summary>
    /// Garmin device model (e.g., "Forerunner 55", "Fenix 7")
    /// </summary>
    [Column("device_model")]
    [StringLength(100)]
    public string? DeviceModel { get; set; }

    /// <summary>
    /// Confidence score (0.0-1.0) that detected motion was an actual golf swing
    /// </summary>
    [Column("detection_confidence", TypeName = "decimal(3,2)")]
    public decimal? DetectionConfidence { get; set; }

    /// <summary>
    /// AI-generated swing quality score from 0-10 based on technique analysis
    /// </summary>
    [Column("swing_quality_score", TypeName = "decimal(3,2)")]
    public decimal? SwingQualityScore { get; set; }

    /// <summary>
    /// AI-generated feedback and improvement suggestions for the swing
    /// </summary>
    [Column("ai_feedback")]
    public string? AiFeedback { get; set; }

    /// <summary>
    /// Template or pro swing used for comparison analysis
    /// </summary>
    [Column("compared_to_template")]
    [StringLength(50)]
    public string? ComparedToTemplate { get; set; }

    /// <summary>
    /// GPS location where swing was detected (PostGIS Point geometry)
    /// </summary>
    [Column("shot_location", TypeName = "geometry(Point,4326)")]
    public Point? ShotLocation { get; set; }

    /// <summary>
    /// Golf club used for the shot (driver, 7-iron, etc.)
    /// </summary>
    [Column("club_used")]
    [StringLength(50)]
    public string? ClubUsed { get; set; }

    /// <summary>
    /// Distance to pin in yards at time of swing
    /// </summary>
    [Column("distance_to_pin_yards")]
    public int? DistanceToPinYards { get; set; }

    /// <summary>
    /// Timestamp when the swing was detected
    /// </summary>
    [Column("detected_at")]
    public DateTime? DetectedAt { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [ForeignKey("RoundId")]
    public virtual Round Round { get; set; } = null!;

    [ForeignKey("HoleId")]
    public virtual Hole? Hole { get; set; }

    [ForeignKey("GarminDeviceId")]
    public virtual GarminDevice? GarminDevice { get; set; }
}