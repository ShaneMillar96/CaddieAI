using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace caddie.portal.dal.Models;

/// <summary>
/// Individual hole information with enhanced data and playing tips
/// </summary>
public partial class Hole
{
    public int Id { get; set; }

    public int CourseId { get; set; }

    public int HoleNumber { get; set; }

    public string? Name { get; set; }

    public int Par { get; set; }

    public int? YardageBlack { get; set; }

    public int? YardageBlue { get; set; }

    public int? YardageWhite { get; set; }

    public int? YardageRed { get; set; }

    /// <summary>
    /// Hole difficulty ranking (1-18) for handicap calculations
    /// </summary>
    public int? StrokeIndex { get; set; }

    /// <summary>
    /// Yardage from ladies tees
    /// </summary>
    public int? LadiesYardage { get; set; }

    /// <summary>
    /// Par for ladies tees
    /// </summary>
    public int? LadiesPar { get; set; }

    /// <summary>
    /// Ladies tee difficulty ranking (1-18)
    /// </summary>
    public int? LadiesStrokeIndex { get; set; }

    /// <summary>
    /// Tee box center point
    /// </summary>
    public Point? TeeLocation { get; set; }

    /// <summary>
    /// Green/pin location point
    /// </summary>
    public Point? PinLocation { get; set; }

    /// <summary>
    /// Complete hole boundary including fairway, rough, and green
    /// </summary>
    public Polygon? HoleLayout { get; set; }

    /// <summary>
    /// Optimal playing line from tee to green
    /// </summary>
    public LineString? FairwayCenterLine { get; set; }

    public string? HoleDescription { get; set; }

    /// <summary>
    /// Official playing tips and strategy advice for the hole
    /// </summary>
    public string? HoleTips { get; set; }

    /// <summary>
    /// Simplified hazard information stored as JSON array
    /// </summary>
    public string? SimpleHazards { get; set; }

    /// <summary>
    /// Additional strategic advice for playing the hole
    /// </summary>
    public string? PlayingTips { get; set; }

    public string? HoleMetadata { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ClubRecommendation> ClubRecommendations { get; set; } = new List<ClubRecommendation>();

    public virtual Course Course { get; set; } = null!;
}
