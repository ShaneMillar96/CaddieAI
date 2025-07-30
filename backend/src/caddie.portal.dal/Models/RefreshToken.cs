using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Net;

namespace caddie.portal.dal.Models;

/// <summary>
/// JWT refresh tokens for maintaining user sessions
/// </summary>
[Table("refresh_tokens")]
public partial class RefreshToken
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [Column("token")]
    [StringLength(255)]
    public string Token { get; set; } = null!;

    [Required]
    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    [Column("revoked_at")]
    public DateTime? RevokedAt { get; set; }

    /// <summary>
    /// Flag indicating if token has been revoked
    /// </summary>
    [Column("is_revoked")]
    public bool? IsRevoked { get; set; }

    /// <summary>
    /// Device information stored as JSON (device type, OS, etc.)
    /// </summary>
    [Column("device_info", TypeName = "jsonb")]
    public string? DeviceInfo { get; set; }

    /// <summary>
    /// IP address where token was issued
    /// </summary>
    [Column("ip_address")]
    public IPAddress? IpAddress { get; set; }

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    /// <summary>
    /// Computed property to check if the token is active (not revoked and not expired)
    /// </summary>
    [NotMapped]
    public bool IsActive => !IsRevoked.GetValueOrDefault() && !RevokedAt.HasValue && ExpiresAt > DateTime.UtcNow;
}
