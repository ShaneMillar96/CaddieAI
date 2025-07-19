using System;
using System.Collections.Generic;

namespace caddie.portal.dal.Models;

/// <summary>
/// Individual golf round tracking with status and performance metrics
/// </summary>
public partial class Round
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int CourseId { get; set; }

    public DateOnly RoundDate { get; set; }

    public DateTime? StartTime { get; set; }

    public DateTime? EndTime { get; set; }

    /// <summary>
    /// Current hole being played (1-18)
    /// </summary>
    public int? CurrentHole { get; set; }

    /// <summary>
    /// Foreign key to RoundStatus lookup table
    /// </summary>
    public int StatusId { get; set; }

    public int? TotalScore { get; set; }

    public int? TotalPutts { get; set; }

    /// <summary>
    /// Number of fairways hit in regulation
    /// </summary>
    public int? FairwaysHit { get; set; }

    /// <summary>
    /// Number of greens reached in regulation strokes
    /// </summary>
    public int? GreensInRegulation { get; set; }

    public decimal? TemperatureCelsius { get; set; }

    public decimal? WindSpeedKmh { get; set; }

    public string? Notes { get; set; }

    /// <summary>
    /// Additional round information and settings
    /// </summary>
    public string? RoundMetadata { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ChatSession> ChatSessions { get; set; } = new List<ChatSession>();

    public virtual ICollection<ClubRecommendation> ClubRecommendations { get; set; } = new List<ClubRecommendation>();

    public virtual Course Course { get; set; } = null!;

    public virtual ICollection<Location> Locations { get; set; } = new List<Location>();

    public virtual RoundStatus Status { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
