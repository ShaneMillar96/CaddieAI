using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using caddie.portal.dal.Models.Common;
using caddie.portal.dal.Models.Users;
using caddie.portal.dal.Models.Courses;
using caddie.portal.dal.Models.AI;

namespace caddie.portal.dal.Models.Rounds;

[Table("rounds")]
public class Round : BaseEntity
{
    [Required]
    [ForeignKey("User")]
    public Guid UserId { get; set; }
    
    [Required]
    [ForeignKey("Course")]
    public Guid CourseId { get; set; }
    
    [Required]
    public DateOnly RoundDate { get; set; }
    
    public DateTime? StartTime { get; set; }
    
    public DateTime? EndTime { get; set; }
    
    public int? CurrentHole { get; set; }
    
    [Required]
    public RoundStatus Status { get; set; } = RoundStatus.NotStarted;
    
    public int? TotalScore { get; set; }
    
    public int? TotalPutts { get; set; }
    
    public int FairwaysHit { get; set; } = 0;
    
    public int GreensInRegulation { get; set; } = 0;
    
    public WeatherCondition? WeatherCondition { get; set; }
    
    [Column(TypeName = "decimal(4,1)")]
    public decimal? TemperatureCelsius { get; set; }
    
    [Column(TypeName = "decimal(4,1)")]
    public decimal? WindSpeedKmh { get; set; }
    
    public string? Notes { get; set; }
    
    [Column(TypeName = "jsonb")]
    public JsonDocument? RoundMetadata { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Course Course { get; set; } = null!;
    public virtual ICollection<Location> Locations { get; set; } = new List<Location>();
    public virtual ICollection<ChatSession> ChatSessions { get; set; } = new List<ChatSession>();
    public virtual ICollection<ClubRecommendation> ClubRecommendations { get; set; } = new List<ClubRecommendation>();
}