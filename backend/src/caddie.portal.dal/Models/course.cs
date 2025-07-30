using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace caddie.portal.dal.Models;

/// <summary>
/// Golf course information with geospatial data and metadata
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

    [Column("description")]
    public string? Description { get; set; }

    [Column("address")]
    public string? Address { get; set; }

    [Column("city")]
    [StringLength(100)]
    public string? City { get; set; }

    [Column("state")]
    [StringLength(50)]
    public string? State { get; set; }

    [Required]
    [Column("country")]
    [StringLength(100)]
    public string Country { get; set; } = null!;

    [Column("phone")]
    [StringLength(20)]
    public string? Phone { get; set; }

    [Column("website")]
    [StringLength(255)]
    public string? Website { get; set; }

    [Column("email")]
    [StringLength(255)]
    public string? Email { get; set; }

    [Required]
    [Column("par_total")]
    public int ParTotal { get; set; }

    [Required]
    [Column("total_holes")]
    public int TotalHoles { get; set; }

    [Column("yardage_total")]
    public int? YardageTotal { get; set; }

    /// <summary>
    /// USGA course rating for scratch golfer
    /// </summary>
    [Column("course_rating", TypeName = "decimal(3,1)")]
    public decimal? CourseRating { get; set; }

    /// <summary>
    /// USGA slope rating (55-155 range)
    /// </summary>
    [Column("slope_rating")]
    public int? SlopeRating { get; set; }

    /// <summary>
    /// Primary course location point (clubhouse/pro shop)
    /// </summary>
    [Column("location", TypeName = "geometry(Point,4326)")]
    public Point? Location { get; set; }

    /// <summary>
    /// Course boundary polygon for geofencing
    /// </summary>
    [Column("boundary", TypeName = "geometry(Polygon,4326)")]
    public Polygon? Boundary { get; set; }

    [Column("timezone")]
    [StringLength(50)]
    public string? Timezone { get; set; }

    /// <summary>
    /// Pricing information stored as JSON
    /// </summary>
    [Column("green_fee_range", TypeName = "jsonb")]
    public string? GreenFeeRange { get; set; }

    /// <summary>
    /// Available amenities and facilities
    /// </summary>
    [Column("amenities", TypeName = "jsonb")]
    public string? Amenities { get; set; }

    [Column("course_metadata", TypeName = "jsonb")]
    public string? CourseMetadata { get; set; }

    [Column("is_active")]
    public bool? IsActive { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ChatSession> ChatSessions { get; set; } = new List<ChatSession>();

    public virtual ICollection<Hole> Holes { get; set; } = new List<Hole>();

    public virtual ICollection<Location> Locations { get; set; } = new List<Location>();

    public virtual ICollection<Round> Rounds { get; set; } = new List<Round>();
}
