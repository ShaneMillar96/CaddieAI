using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace caddie.portal.dal.Models;

/// <summary>
/// Simplified user-driven golf course information with basic location data
/// </summary>
[Table("courses")]
public partial class Course
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("name")]
    [StringLength(200)]
    public string Name { get; set; } = null!;

    /// <summary>
    /// Course location point (user-provided)
    /// </summary>
    [Column("location", TypeName = "geometry(Point,4326)")]
    public Point? Location { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties - essential relationships only
    public virtual ICollection<Hole> Holes { get; set; } = new List<Hole>();

    public virtual ICollection<Location> Locations { get; set; } = new List<Location>();

    public virtual ICollection<Round> Rounds { get; set; } = new List<Round>();

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}