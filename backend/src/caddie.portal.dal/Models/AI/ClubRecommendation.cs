using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using caddie.portal.dal.Models.Common;
using caddie.portal.dal.Models.Users;
using caddie.portal.dal.Models.Rounds;
using caddie.portal.dal.Models.Courses;

namespace caddie.portal.dal.Models.AI;

[Table("club_recommendations")]
public class ClubRecommendation : BaseEntity
{
    [Required]
    [ForeignKey("User")]
    public Guid UserId { get; set; }
    
    [ForeignKey("Round")]
    public Guid? RoundId { get; set; }
    
    [ForeignKey("Hole")]
    public Guid? HoleId { get; set; }
    
    [ForeignKey("Location")]
    public Guid? LocationId { get; set; }
    
    [Required]
    [StringLength(50)]
    public string RecommendedClub { get; set; } = string.Empty;
    
    [Column(TypeName = "decimal(3,2)")]
    public decimal? ConfidenceScore { get; set; }
    
    [Column(TypeName = "decimal(6,2)")]
    public decimal? DistanceToTarget { get; set; }
    
    public string? OpenAIReasoning { get; set; }
    
    [Column(TypeName = "jsonb")]
    public JsonDocument? ContextUsed { get; set; }
    
    public bool? WasAccepted { get; set; }
    
    [StringLength(50)]
    public string? ActualClubUsed { get; set; }
    
    [Column(TypeName = "jsonb")]
    public JsonDocument? RecommendationMetadata { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Round? Round { get; set; }
    public virtual Hole? Hole { get; set; }
    public virtual Location? Location { get; set; }
}