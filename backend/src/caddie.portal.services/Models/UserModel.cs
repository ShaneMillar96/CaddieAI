using caddie.portal.dal.Models;

namespace caddie.portal.services.Models;

public class UserModel
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public decimal? Handicap { get; set; }
    public SkillLevel? SkillLevel { get; set; }
    public Dictionary<string, object>? Preferences { get; set; }
    public Dictionary<string, object>? PlayingStyle { get; set; }
    public UserStatus? Status { get; set; }
    public bool EmailVerified { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool TwoFactorEnabled { get; set; }
}