using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace caddie.portal.dal.Models;

/// <summary>
/// User-specific golf course information added through Mapbox Places API detection
/// Independent of the main courses table to support user-driven course management
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
    [Column("course_name")]
    [StringLength(255)]
    public string CourseName { get; set; } = null!;

    [Column("address")]
    [StringLength(500)]
    public string? Address { get; set; }

    [Column("city")]
    [StringLength(100)]
    public string? City { get; set; }

    [Column("state")]
    [StringLength(100)]
    public string? State { get; set; }

    [Column("country")]
    [StringLength(100)]
    public string? Country { get; set; }

    /// <summary>
    /// Course latitude coordinate in decimal degrees
    /// </summary>
    [Column("latitude", TypeName = "decimal(10,7)")]
    public decimal? Latitude { get; set; }

    /// <summary>
    /// Course longitude coordinate in decimal degrees
    /// </summary>
    [Column("longitude", TypeName = "decimal(10,7)")]
    public decimal? Longitude { get; set; }

    /// <summary>
    /// PostGIS Point geometry for spatial queries and distance calculations
    /// Automatically updated from latitude/longitude via database trigger
    /// </summary>
    [Column("location", TypeName = "geometry(Point,4326)")]
    public Point? Location { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    /// <summary>
    /// Related rounds played at this user course
    /// </summary>
    [InverseProperty("UserCourse")]
    public virtual ICollection<Round> Rounds { get; set; } = new List<Round>();

    /// <summary>
    /// Location tracking entries for this user course
    /// </summary>
    [InverseProperty("UserCourse")]
    public virtual ICollection<Location> Locations { get; set; } = new List<Location>();
}