using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace caddie.portal.dal.Models;

/// <summary>
/// Individual golf shot tracked via GPS movement analysis
/// </summary>
[Table("shot_events")]
public partial class ShotEvent
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

    [Required]
    [Range(1, 18)]
    [Column("hole_number")]
    public int HoleNumber { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    [Column("shot_number")]
    public int ShotNumber { get; set; }

    /// <summary>
    /// GPS location where shot was initiated
    /// </summary>
    [Required]
    [Column("start_location", TypeName = "geometry(Point,4326)")]
    public Point StartLocation { get; set; } = null!;

    /// <summary>
    /// GPS location where ball came to rest
    /// </summary>
    [Required]
    [Column("end_location", TypeName = "geometry(Point,4326)")]
    public Point EndLocation { get; set; } = null!;

    /// <summary>
    /// Distance of shot in meters
    /// </summary>
    [Required]
    [Range(0, double.MaxValue)]
    [Column("distance_meters", TypeName = "decimal(6,2)")]
    public decimal DistanceMeters { get; set; }

    /// <summary>
    /// Estimated club used for the shot
    /// </summary>
    [MaxLength(50)]
    [Column("estimated_club")]
    public string? EstimatedClub { get; set; }

    /// <summary>
    /// Type of shot (tee_shot, approach, chip, putt, recovery, penalty)
    /// </summary>
    [MaxLength(30)]
    [Column("shot_type")]
    public string? ShotType { get; set; }

    /// <summary>
    /// Lie condition where shot was taken (tee, fairway, rough, sand, water, penalty)
    /// </summary>
    [MaxLength(30)]
    [Column("lie_condition")]
    public string? LieCondition { get; set; }

    /// <summary>
    /// Shot accuracy assessment (perfect, good, average, poor, mishit)
    /// </summary>
    [MaxLength(20)]
    [Column("shot_accuracy")]
    public string? ShotAccuracy { get; set; }

    /// <summary>
    /// Duration of movement in seconds
    /// </summary>
    [Column("movement_duration_seconds", TypeName = "decimal(5,2)")]
    public decimal? MovementDurationSeconds { get; set; }

    /// <summary>
    /// Confidence level of automatic shot detection (0.0-1.0)
    /// </summary>
    [Range(0.0, 1.0)]
    [Column("detection_confidence", TypeName = "decimal(3,2)")]
    public decimal DetectionConfidence { get; set; } = 0.8m;

    /// <summary>
    /// Whether shot was automatically detected or manually entered
    /// </summary>
    [Column("auto_detected")]
    public bool AutoDetected { get; set; } = true;

    /// <summary>
    /// Whether user has confirmed the detected shot
    /// </summary>
    [Column("user_confirmed")]
    public bool UserConfirmed { get; set; } = false;

    /// <summary>
    /// Additional shot metadata as JSON
    /// </summary>
    [Column("shot_metadata", TypeName = "jsonb")]
    public string? ShotMetadata { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("RoundId")]
    public virtual Round Round { get; set; } = null!;
    
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}