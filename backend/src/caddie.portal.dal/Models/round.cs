using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace caddie.portal.dal.Models;

/// <summary>
/// Simplified golf round tracking for basic score management
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

    [Column("course_id")]
    public int? CourseId { get; set; }

    [Column("user_course_id")]
    public int? UserCourseId { get; set; }

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
    /// Round status foreign key reference to round_statuses lookup table
    /// </summary>
    [Required]
    [Column("status_id")]
    public int StatusId { get; set; }

    [Column("total_score")]
    public int? TotalScore { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties - simplified to essential relationships only
    [ForeignKey("CourseId")]
    public virtual Course? Course { get; set; }

    [ForeignKey("UserCourseId")]
    public virtual UserCourse? UserCourse { get; set; }

    public virtual ICollection<HoleScore> HoleScores { get; set; } = new List<HoleScore>();

    public virtual ICollection<Location> Locations { get; set; } = new List<Location>();

    [ForeignKey("StatusId")]
    public virtual RoundStatus Status { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
