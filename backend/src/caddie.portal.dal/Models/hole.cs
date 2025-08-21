using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace caddie.portal.dal.Models;

/// <summary>
/// Golf hole information associated with courses, containing hole-specific playing characteristics.
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

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("CourseId")]
    public virtual Course Course { get; set; } = null!;

    public virtual ICollection<HoleScore> HoleScores { get; set; } = new List<HoleScore>();

    [InverseProperty("Hole")]
    public virtual ICollection<SwingAnalysis> SwingAnalyses { get; set; } = new List<SwingAnalysis>();
}