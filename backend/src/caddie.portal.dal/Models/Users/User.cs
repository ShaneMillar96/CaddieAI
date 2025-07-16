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
    
    // Authentication fields
    [Required]
    public bool EmailVerified { get; set; } = false;
    
    [StringLength(255)]
    public string? EmailVerificationToken { get; set; }
    
    public DateTime? EmailVerificationExpires { get; set; }
    
    [StringLength(255)]
    public string? PasswordResetToken { get; set; }
    
    public DateTime? PasswordResetExpires { get; set; }
    
    [Required]
    public int FailedLoginAttempts { get; set; } = 0;
    
    public DateTime? LockedUntil { get; set; }
    
    [Required]
    public bool TwoFactorEnabled { get; set; } = false;
    
    [StringLength(255)]
    public string? TwoFactorSecret { get; set; }

    // Navigation properties
    public virtual ICollection<Round> Rounds { get; set; } = new List<Round>();
    public virtual ICollection<ChatSession> ChatSessions { get; set; } = new List<ChatSession>();
    public virtual ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
    public virtual ICollection<ClubRecommendation> ClubRecommendations { get; set; } = new List<ClubRecommendation>();
    public virtual ICollection<caddie.portal.dal.Models.Rounds.Location> Locations { get; set; } = new List<caddie.portal.dal.Models.Rounds.Location>();
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public virtual ICollection<UserSession> UserSessions { get; set; } = new List<UserSession>();
    public virtual ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();
    
    // Helper properties
    public bool IsAccountLocked => LockedUntil.HasValue && LockedUntil.Value > DateTime.UtcNow;
    public string FullName => $"{FirstName} {LastName}";
}