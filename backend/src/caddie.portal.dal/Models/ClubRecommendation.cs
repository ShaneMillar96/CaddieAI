using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace caddie.portal.dal.Models;

/// <summary>
/// Simplified AI-generated club recommendations via OpenAI ChatGPT
/// </summary>
[Table("club_recommendations")]
public partial class ClubRecommendation
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Column("round_id")]
    public int? RoundId { get; set; }

    [Column("hole_id")]
    public int? HoleId { get; set; }

    [Column("location_id")]
    public int? LocationId { get; set; }

    /// <summary>
    /// Primary club recommendation
    /// </summary>
    [Required]
    [Column("recommended_club")]
    [StringLength(50)]
    public string RecommendedClub { get; set; } = null!;

    /// <summary>
    /// Numerical confidence score (0-1)
    /// </summary>
    [Column("confidence_score", TypeName = "decimal(3,2)")]
    public decimal? ConfidenceScore { get; set; }

    /// <summary>
    /// Distance to target in meters
    /// </summary>
    [Column("distance_to_target", TypeName = "decimal(6,2)")]
    public decimal? DistanceToTarget { get; set; }

    /// <summary>
    /// OpenAI-generated reasoning for the recommendation
    /// </summary>
    [Column("openai_reasoning")]
    public string? OpenaiReasoning { get; set; }

    /// <summary>
    /// Context data used for the recommendation
    /// </summary>
    [Column("context_used", TypeName = "jsonb")]
    public string? ContextUsed { get; set; }

    /// <summary>
    /// Whether user accepted the recommendation
    /// </summary>
    [Column("was_accepted")]
    public bool? WasAccepted { get; set; }

    /// <summary>
    /// Club actually used by player (for learning)
    /// </summary>
    [Column("actual_club_used")]
    [StringLength(50)]
    public string? ActualClubUsed { get; set; }

    [Column("recommendation_metadata", TypeName = "jsonb")]
    public string? RecommendationMetadata { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    [ForeignKey("HoleId")]
    public virtual Hole? Hole { get; set; }

    [ForeignKey("LocationId")]
    public virtual Location? Location { get; set; }

    [ForeignKey("RoundId")]
    public virtual Round? Round { get; set; }

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
