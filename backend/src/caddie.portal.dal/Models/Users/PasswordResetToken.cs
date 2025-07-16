using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using caddie.portal.dal.Models.Common;

namespace caddie.portal.dal.Models.Users;

[Table("password_reset_tokens")]
public class PasswordResetToken : BaseEntity
{
    [Required]
    [ForeignKey("User")]
    public Guid UserId { get; set; }
    
    [Required]
    [StringLength(255)]
    public string Token { get; set; } = string.Empty;
    
    [Required]
    public DateTime ExpiresAt { get; set; }
    
    public DateTime? UsedAt { get; set; }
    
    [Required]
    public bool IsUsed { get; set; } = false;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    
    // Helper properties
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsValid => !IsUsed && !IsExpired;
}