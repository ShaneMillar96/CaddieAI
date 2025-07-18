using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace caddie.portal.dal.Models;

/// <summary>
/// Golf course information with geospatial data and metadata
/// </summary>
public partial class Course
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string? Address { get; set; }

    public string? City { get; set; }

    public string? State { get; set; }

    public string Country { get; set; } = null!;

    public string? Phone { get; set; }

    public string? Website { get; set; }

    public string? Email { get; set; }

    public int ParTotal { get; set; }

    public int TotalHoles { get; set; }

    public int? YardageTotal { get; set; }

    /// <summary>
    /// USGA course rating for scratch golfer
    /// </summary>
    public decimal? CourseRating { get; set; }

    /// <summary>
    /// USGA slope rating (55-155 range)
    /// </summary>
    public int? SlopeRating { get; set; }

    /// <summary>
    /// Primary course location point (clubhouse/pro shop)
    /// </summary>
    public Point? Location { get; set; }

    /// <summary>
    /// Course boundary polygon for geofencing
    /// </summary>
    public Polygon? Boundary { get; set; }

    public string? Timezone { get; set; }

    /// <summary>
    /// Pricing information stored as JSON
    /// </summary>
    public string? GreenFeeRange { get; set; }

    /// <summary>
    /// Available amenities and facilities
    /// </summary>
    public string? Amenities { get; set; }

    public string? CourseMetadata { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ChatSession> ChatSessions { get; set; } = new List<ChatSession>();

    public virtual ICollection<Hole> Holes { get; set; } = new List<Hole>();

    public virtual ICollection<Location> Locations { get; set; } = new List<Location>();

    public virtual ICollection<Round> Rounds { get; set; } = new List<Round>();
}
