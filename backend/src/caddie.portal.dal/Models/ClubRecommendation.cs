using System;
using System.Collections.Generic;

namespace caddie.portal.dal.Models;

/// <summary>
/// Simplified AI-generated club recommendations via OpenAI ChatGPT
/// </summary>
public partial class ClubRecommendation
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int? RoundId { get; set; }

    public int? HoleId { get; set; }

    public int? LocationId { get; set; }

    /// <summary>
    /// Primary club recommendation
    /// </summary>
    public string RecommendedClub { get; set; } = null!;

    /// <summary>
    /// Numerical confidence score (0-1)
    /// </summary>
    public decimal? ConfidenceScore { get; set; }

    /// <summary>
    /// Distance to target in meters
    /// </summary>
    public decimal? DistanceToTarget { get; set; }

    /// <summary>
    /// OpenAI-generated reasoning for the recommendation
    /// </summary>
    public string? OpenaiReasoning { get; set; }

    /// <summary>
    /// Context data used for the recommendation
    /// </summary>
    public string? ContextUsed { get; set; }

    /// <summary>
    /// Whether user accepted the recommendation
    /// </summary>
    public bool? WasAccepted { get; set; }

    /// <summary>
    /// Club actually used by player (for learning)
    /// </summary>
    public string? ActualClubUsed { get; set; }

    public string? RecommendationMetadata { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Hole? Hole { get; set; }

    public virtual Location? Location { get; set; }

    public virtual Round? Round { get; set; }

    public virtual User User { get; set; } = null!;
}
