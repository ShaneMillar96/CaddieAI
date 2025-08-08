using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace caddie.portal.dal.Models;

/// <summary>
/// Shot placement entity for tracking shot locations and measurements
/// </summary>
[Table("shot_placements")]
public partial class ShotPlacement
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
    /// Shot placement coordinates as PostGIS Point
    /// </summary>
    [Column("shot_location", TypeName = "geometry(Point,4326)")]
    public Point? ShotLocation { get; set; }

    /// <summary>
    /// GPS accuracy in meters
    /// </summary>
    [Column("accuracy_meters")]
    public double? AccuracyMeters { get; set; }

    /// <summary>
    /// Distance to pin in yards
    /// </summary>
    [Column("distance_to_pin_yards")]
    public int? DistanceToPinYards { get; set; }

    /// <summary>
    /// Distance from current location in yards
    /// </summary>
    [Column("distance_from_current_yards")]
    public int? DistanceFromCurrentYards { get; set; }

    /// <summary>
    /// AI-generated club recommendation
    /// </summary>
    [Column("club_recommendation")]
    [StringLength(100)]
    public string? ClubRecommendation { get; set; }

    /// <summary>
    /// Whether the shot has been completed
    /// </summary>
    [Column("is_completed")]
    public bool IsCompleted { get; set; } = false;

    /// <summary>
    /// When the shot was completed
    /// </summary>
    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Actual shot outcome coordinates as PostGIS Point
    /// </summary>
    [Column("actual_shot_location", TypeName = "geometry(Point,4326)")]
    public Point? ActualShotLocation { get; set; }

    /// <summary>
    /// Club actually used for the shot
    /// </summary>
    [Column("club_used")]
    [StringLength(100)]
    public string? ClubUsed { get; set; }

    /// <summary>
    /// Additional notes or feedback
    /// </summary>
    [Column("notes")]
    public string? Notes { get; set; }

    /// <summary>
    /// Additional metadata stored as JSONB
    /// </summary>
    [Column("metadata", TypeName = "jsonb")]
    public string? Metadata { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [ForeignKey("RoundId")]
    public virtual Round Round { get; set; } = null!;

    [ForeignKey("HoleId")]
    public virtual Hole? Hole { get; set; }
}