using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.Chat;

public class SendMessageRequestDto
{
    [Required(ErrorMessage = "Message content is required")]
    [StringLength(2000, ErrorMessage = "Message cannot exceed 2000 characters")]
    [MinLength(1, ErrorMessage = "Message cannot be empty")]
    public string Message { get; set; } = string.Empty;
}