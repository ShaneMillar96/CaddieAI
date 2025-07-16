using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using caddie.portal.dal.Models.Common;
using caddie.portal.dal.Models.Rounds;
using caddie.portal.dal.Models.AI;

namespace caddie.portal.dal.Models.Users;

[Table("users")]
public class User : BaseEntity
{
    [Required]
    [StringLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [StringLength(255)]
    public string PasswordHash { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;
    
    [Column(TypeName = "decimal(4,1)")]
    public decimal? Handicap { get; set; }
    
    [Required]
    public SkillLevel SkillLevel { get; set; } = SkillLevel.Beginner;
    
    [Column(TypeName = "jsonb")]
    public JsonDocument? Preferences { get; set; }
    
    [Column(TypeName = "jsonb")]
    public JsonDocument? PlayingStyle { get; set; }
    
    [Required]
    public UserStatus Status { get; set; } = UserStatus.Active;
    
    public DateTime? LastLoginAt { get; set; }

    // Navigation properties
    public virtual ICollection<Round> Rounds { get; set; } = new List<Round>();
    public virtual ICollection<ChatSession> ChatSessions { get; set; } = new List<ChatSession>();
    public virtual ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
    public virtual ICollection<ClubRecommendation> ClubRecommendations { get; set; } = new List<ClubRecommendation>();
    public virtual ICollection<caddie.portal.dal.Models.Rounds.Location> Locations { get; set; } = new List<caddie.portal.dal.Models.Rounds.Location>();
}