using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace caddie.portal.dal.Models;

/// <summary>
/// Individual hole information with enhanced data and playing tips
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

    [Column("name")]
    [StringLength(100)]
    public string? Name { get; set; }

    [Required]
    [Column("par")]
    public int Par { get; set; }

    [Column("yardage_black")]
    public int? YardageBlack { get; set; }

    [Column("yardage_blue")]
    public int? YardageBlue { get; set; }

    [Column("yardage_white")]
    public int? YardageWhite { get; set; }

    [Column("yardage_red")]
    public int? YardageRed { get; set; }

    /// <summary>
    /// Hole difficulty ranking (1-18) for handicap calculations
    /// </summary>
    [Column("stroke_index")]
    public int? StrokeIndex { get; set; }

    /// <summary>
    /// Yardage from ladies tees
    /// </summary>
    [Column("ladies_yardage")]
    public int? LadiesYardage { get; set; }

    /// <summary>
    /// Par for ladies tees
    /// </summary>
    [Column("ladies_par")]
    public int? LadiesPar { get; set; }

    /// <summary>
    /// Ladies tee difficulty ranking (1-18)
    /// </summary>
    [Column("ladies_stroke_index")]
    public int? LadiesStrokeIndex { get; set; }

    /// <summary>
    /// Tee box center point
    /// </summary>
    [Column("tee_location", TypeName = "geometry(Point,4326)")]
    public Point? TeeLocation { get; set; }

    /// <summary>
    /// Green/pin location point
    /// </summary>
    [Column("pin_location", TypeName = "geometry(Point,4326)")]
    public Point? PinLocation { get; set; }

    /// <summary>
    /// Complete hole boundary including fairway, rough, and green
    /// </summary>
    [Column("hole_layout", TypeName = "geometry(Polygon,4326)")]
    public Polygon? HoleLayout { get; set; }

    /// <summary>
    /// Optimal playing line from tee to green
    /// </summary>
    [Column("fairway_center_line", TypeName = "geometry(LineString,4326)")]
    public LineString? FairwayCenterLine { get; set; }

    [Column("hole_description")]
    public string? HoleDescription { get; set; }

    /// <summary>
    /// Official playing tips and strategy advice for the hole
    /// </summary>
    [Column("hole_tips")]
    public string? HoleTips { get; set; }

    /// <summary>
    /// Simplified hazard information stored as JSON array
    /// </summary>
    [Column("simple_hazards", TypeName = "jsonb")]
    public string? SimpleHazards { get; set; }

    /// <summary>
    /// Additional strategic advice for playing the hole
    /// </summary>
    [Column("playing_tips")]
    public string? PlayingTips { get; set; }

    [Column("hole_metadata", TypeName = "jsonb")]
    public string? HoleMetadata { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ClubRecommendation> ClubRecommendations { get; set; } = new List<ClubRecommendation>();

    [ForeignKey("CourseId")]
    public virtual Course Course { get; set; } = null!;
}
