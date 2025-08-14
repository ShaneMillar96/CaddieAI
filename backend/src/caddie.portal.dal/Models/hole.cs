using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace caddie.portal.dal.Models;

/// <summary>
/// Simplified user-driven hole information with progressive data capture
/// </summary>
[Table("holes")]
public partial class Hole
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("course_id")]
    public int CourseId { get; set; }

    [Required]
    [Column("hole_number")]
    public int HoleNumber { get; set; }

    /// <summary>
    /// Par value for hole (captured during gameplay)
    /// </summary>
    [Column("par")]
    public int? Par { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties - essential relationships only
    [ForeignKey("CourseId")]
    public virtual Course Course { get; set; } = null!;

    public virtual ICollection<HoleScore> HoleScores { get; set; } = new List<HoleScore>();

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}