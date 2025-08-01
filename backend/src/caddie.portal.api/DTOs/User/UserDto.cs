namespace caddie.portal.api.DTOs.User;

public class UserDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public decimal? Handicap { get; set; }
    public int SkillLevelId { get; set; }
    public string SkillLevelName { get; set; } = string.Empty;
    public Dictionary<string, object>? Preferences { get; set; }
    public Dictionary<string, object>? PlayingStyle { get; set; }
    public int StatusId { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public bool EmailVerified { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool TwoFactorEnabled { get; set; }
}