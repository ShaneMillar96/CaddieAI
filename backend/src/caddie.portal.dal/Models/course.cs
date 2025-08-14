using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace caddie.portal.dal.Models;

/// <summary>
/// Core golf course information with comprehensive location data.
/// Courses are now normalized entities that can be associated with multiple users through UserCourse join table.
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
    public virtual ICollection<Hole> Holes { get; set; } = new List<Hole>();

    public virtual ICollection<Location> Locations { get; set; } = new List<Location>();

    public virtual ICollection<Round> Rounds { get; set; } = new List<Round>();

    /// <summary>
    /// Users associated with this course through the UserCourse join table
    /// </summary>
    [InverseProperty("Course")]
    public virtual ICollection<UserCourse> UserCourses { get; set; } = new List<UserCourse>();
}