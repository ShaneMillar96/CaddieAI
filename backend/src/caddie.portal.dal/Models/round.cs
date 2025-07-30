using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace caddie.portal.dal.Models;

/// <summary>
/// Individual golf round tracking with status and performance metrics
/// </summary>
[Table("rounds")]
public partial class Round
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [Column("course_id")]
    public int CourseId { get; set; }

    [Required]
    [Column("round_date")]
    public DateOnly RoundDate { get; set; }

    [Column("start_time")]
    public DateTime? StartTime { get; set; }

    [Column("end_time")]
    public DateTime? EndTime { get; set; }

    /// <summary>
    /// Current hole being played (1-18)
    /// </summary>
    [Column("current_hole")]
    public int? CurrentHole { get; set; }

    /// <summary>
    /// Foreign key to RoundStatus lookup table
    /// </summary>
    [Required]
    [Column("status_id")]
    public int StatusId { get; set; }

    [Column("total_score")]
    public int? TotalScore { get; set; }

    [Column("total_putts")]
    public int? TotalPutts { get; set; }

    /// <summary>
    /// Number of fairways hit in regulation
    /// </summary>
    [Column("fairways_hit")]
    public int? FairwaysHit { get; set; }

    /// <summary>
    /// Number of greens reached in regulation strokes
    /// </summary>
    [Column("greens_in_regulation")]
    public int? GreensInRegulation { get; set; }

    [Column("temperature_celsius", TypeName = "decimal(4,1)")]
    public decimal? TemperatureCelsius { get; set; }

    [Column("wind_speed_kmh", TypeName = "decimal(4,1)")]
    public decimal? WindSpeedKmh { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    /// <summary>
    /// Additional round information and settings
    /// </summary>
    [Column("round_metadata", TypeName = "jsonb")]
    public string? RoundMetadata { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ChatSession> ChatSessions { get; set; } = new List<ChatSession>();

    public virtual ICollection<ClubRecommendation> ClubRecommendations { get; set; } = new List<ClubRecommendation>();

    [ForeignKey("CourseId")]
    public virtual Course Course { get; set; } = null!;

    public virtual ICollection<HoleScore> HoleScores { get; set; } = new List<HoleScore>();

    public virtual ICollection<Location> Locations { get; set; } = new List<Location>();

    [ForeignKey("StatusId")]
    public virtual RoundStatus Status { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
