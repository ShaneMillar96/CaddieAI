using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace caddie.portal.dal.Models;

/// <summary>
/// Enhanced real-time GPS tracking with distance calculations and course position awareness
/// </summary>
[Table("locations")]
public partial class Location
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Column("round_id")]
    public int? RoundId { get; set; }

    [Column("course_id")]
    public int? CourseId { get; set; }

    /// <summary>
    /// GPS latitude coordinate
    /// </summary>
    [Required]
    [Column("latitude", TypeName = "decimal(10,7)")]
    public decimal Latitude { get; set; }

    /// <summary>
    /// GPS longitude coordinate
    /// </summary>
    [Required]
    [Column("longitude", TypeName = "decimal(10,7)")]
    public decimal Longitude { get; set; }

    [Column("altitude_meters", TypeName = "decimal(6,2)")]
    public decimal? AltitudeMeters { get; set; }

    /// <summary>
    /// GPS accuracy in meters
    /// </summary>
    [Column("accuracy_meters", TypeName = "decimal(6,2)")]
    public decimal? AccuracyMeters { get; set; }

    [Column("heading_degrees", TypeName = "decimal(5,2)")]
    public decimal? HeadingDegrees { get; set; }

    [Column("speed_mps", TypeName = "decimal(5,2)")]
    public decimal? SpeedMps { get; set; }

    /// <summary>
    /// Auto-detected current hole based on GPS position
    /// </summary>
    [Column("current_hole_detected")]
    public int? CurrentHoleDetected { get; set; }

    /// <summary>
    /// Real-time calculated distance to current hole tee
    /// </summary>
    [Column("distance_to_tee_meters", TypeName = "decimal(6,2)")]
    public decimal? DistanceToTeeMeters { get; set; }

    /// <summary>
    /// Real-time calculated distance to current hole pin
    /// </summary>
    [Column("distance_to_pin_meters", TypeName = "decimal(6,2)")]
    public decimal? DistanceToPinMeters { get; set; }

    /// <summary>
    /// Current position on hole (tee, fairway, rough, green, hazard)
    /// </summary>
    [Column("position_on_hole")]
    [StringLength(20)]
    public string? PositionOnHole { get; set; }

    /// <summary>
    /// Player movement speed in meters per second
    /// </summary>
    [Column("movement_speed_mps", TypeName = "decimal(4,2)")]
    public decimal? MovementSpeedMps { get; set; }

    /// <summary>
    /// Whether player is currently within course boundaries
    /// </summary>
    [Column("course_boundary_status")]
    public bool? CourseBoundaryStatus { get; set; }

    /// <summary>
    /// Previous shot position for context
    /// </summary>
    [Column("last_shot_location", TypeName = "geometry(Point,4326)")]
    public Point? LastShotLocation { get; set; }

    /// <summary>
    /// When the location was recorded
    /// </summary>
    [Column("timestamp")]
    public DateTime? Timestamp { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ClubRecommendation> ClubRecommendations { get; set; } = new List<ClubRecommendation>();

    [ForeignKey("CourseId")]
    public virtual Course? Course { get; set; }

    [ForeignKey("RoundId")]
    public virtual Round? Round { get; set; }

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
