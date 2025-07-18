using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace caddie.portal.dal.Models;

/// <summary>
/// Enhanced real-time GPS tracking with distance calculations and course position awareness
/// </summary>
public partial class Location
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int? RoundId { get; set; }

    public int? CourseId { get; set; }

    /// <summary>
    /// GPS latitude coordinate
    /// </summary>
    public decimal Latitude { get; set; }

    /// <summary>
    /// GPS longitude coordinate
    /// </summary>
    public decimal Longitude { get; set; }

    public decimal? AltitudeMeters { get; set; }

    /// <summary>
    /// GPS accuracy in meters
    /// </summary>
    public decimal? AccuracyMeters { get; set; }

    public decimal? HeadingDegrees { get; set; }

    public decimal? SpeedMps { get; set; }

    /// <summary>
    /// Auto-detected current hole based on GPS position
    /// </summary>
    public int? CurrentHoleDetected { get; set; }

    /// <summary>
    /// Real-time calculated distance to current hole tee
    /// </summary>
    public decimal? DistanceToTeeMeters { get; set; }

    /// <summary>
    /// Real-time calculated distance to current hole pin
    /// </summary>
    public decimal? DistanceToPinMeters { get; set; }

    /// <summary>
    /// Current position on hole (tee, fairway, rough, green, hazard)
    /// </summary>
    public string? PositionOnHole { get; set; }

    /// <summary>
    /// Player movement speed in meters per second
    /// </summary>
    public decimal? MovementSpeedMps { get; set; }

    /// <summary>
    /// Whether player is currently within course boundaries
    /// </summary>
    public bool? CourseBoundaryStatus { get; set; }

    /// <summary>
    /// Previous shot position for context
    /// </summary>
    public Point? LastShotLocation { get; set; }

    /// <summary>
    /// When the location was recorded
    /// </summary>
    public DateTime? Timestamp { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ClubRecommendation> ClubRecommendations { get; set; } = new List<ClubRecommendation>();

    public virtual Course? Course { get; set; }

    public virtual Round? Round { get; set; }

    public virtual User User { get; set; } = null!;
}
