using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using System.Net;
using caddie.portal.dal.Models.Common;

namespace caddie.portal.dal.Models.Users;

[Table("refresh_tokens")]
public class RefreshToken : BaseEntity
{
    [Required]
    [ForeignKey("User")]
    public Guid UserId { get; set; }
    
    [Required]
    [StringLength(255)]
    public string Token { get; set; } = string.Empty;
    
    [Required]
    public DateTime ExpiresAt { get; set; }
    
    public DateTime? RevokedAt { get; set; }
    
    [Required]
    public bool IsRevoked { get; set; } = false;
    
    [Column(TypeName = "jsonb")]
    public JsonDocument? DeviceInfo { get; set; }
    
    [Column(TypeName = "inet")]
    public IPAddress? IpAddress { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    
    // Helper properties
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => !IsRevoked && !IsExpired;
}