using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.Chat;

public class StartChatSessionRequestDto
{
    public int? RoundId { get; set; }
    public int? CourseId { get; set; }
    
    [StringLength(100, ErrorMessage = "Session name cannot exceed 100 characters")]
    public string? SessionName { get; set; }
}