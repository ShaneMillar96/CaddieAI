using caddie.portal.dal.Models.Users;

namespace caddie.portal.services.Models;

public class UserRegistrationModel
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public decimal? Handicap { get; set; }
    public SkillLevel SkillLevel { get; set; } = SkillLevel.Beginner;
    public Dictionary<string, object>? Preferences { get; set; }
    public Dictionary<string, object>? PlayingStyle { get; set; }
}