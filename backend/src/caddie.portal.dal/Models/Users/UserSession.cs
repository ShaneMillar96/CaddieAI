using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using System.Net;
using caddie.portal.dal.Models.Common;

namespace caddie.portal.dal.Models.Users;

[Table("user_sessions")]
public class UserSession : BaseEntity
{
    [Required]
    [ForeignKey("User")]
    public Guid UserId { get; set; }
    
    [Required]
    [StringLength(255)]
    public string SessionToken { get; set; } = string.Empty;
    
    [Column(TypeName = "jsonb")]
    public JsonDocument? DeviceInfo { get; set; }
    
    [Column(TypeName = "inet")]
    public IPAddress? IpAddress { get; set; }
    
    public string? UserAgent { get; set; }
    
    [Required]
    public bool IsActive { get; set; } = true;
    
    [Required]
    public DateTime LastActivity { get; set; } = DateTime.UtcNow;
    
    [Required]
    public DateTime ExpiresAt { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    
    // Helper properties
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsValid => IsActive && !IsExpired;
}