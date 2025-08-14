using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace caddie.portal.dal.Models;

/// <summary>
/// Simplified hole score tracking for basic score management
/// </summary>
[Table("hole_scores")]
public class HoleScore
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("round_id")]
    public int RoundId { get; set; }

    [Required]
    [Column("hole_id")]
    public int HoleId { get; set; }

    [Required]
    [Column("hole_number")]
    [Range(1, 18)]
    public int HoleNumber { get; set; }

    [Column("score")]
    public int? Score { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties - essential relationships only
    [ForeignKey("RoundId")]
    public virtual Round Round { get; set; } = null!;

    [ForeignKey("HoleId")]
    public virtual Hole Hole { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}