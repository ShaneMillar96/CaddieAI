using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace caddie.portal.dal.Models;

/// <summary>
/// Basic GPS location tracking during rounds
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

    [Column("user_course_id")]
    public int? UserCourseId { get; set; }

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

    /// <summary>
    /// When the location was recorded
    /// </summary>
    [Column("timestamp")]
    public DateTime? Timestamp { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties - simplified to essential relationships only
    [ForeignKey("CourseId")]
    public virtual Course? Course { get; set; }

    [ForeignKey("UserCourseId")]
    public virtual UserCourse? UserCourse { get; set; }

    [ForeignKey("RoundId")]
    public virtual Round? Round { get; set; }

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
