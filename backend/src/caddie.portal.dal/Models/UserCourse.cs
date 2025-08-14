using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace caddie.portal.dal.Models;

/// <summary>
/// Join table linking users to courses they have access to or have played.
/// Replaces the previous user-specific course data storage with normalized relationship management.
/// </summary>
[Table("user_courses")]
public partial class UserCourse
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

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [ForeignKey("CourseId")]
    public virtual Course Course { get; set; } = null!;

    /// <summary>
    /// Related rounds played at this user course association
    /// </summary>
    [InverseProperty("UserCourse")]
    public virtual ICollection<Round> Rounds { get; set; } = new List<Round>();

    /// <summary>
    /// Location tracking entries for this user course association
    /// </summary>
    [InverseProperty("UserCourse")]
    public virtual ICollection<Location> Locations { get; set; } = new List<Location>();
}