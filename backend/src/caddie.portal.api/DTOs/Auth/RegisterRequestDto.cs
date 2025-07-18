using caddie.portal.dal.Models;

namespace caddie.portal.api.DTOs.Auth;

public class RegisterRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    
    public string ConfirmPassword { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public decimal? Handicap { get; set; }
    public int SkillLevelId { get; set; } = 1; // Default to Beginner
    public Dictionary<string, object>? Preferences { get; set; }
    public Dictionary<string, object>? PlayingStyle { get; set; }
}