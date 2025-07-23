using System;
using System.Collections.Generic;
using System.Net;

namespace caddie.portal.dal.Models;

/// <summary>
/// JWT refresh tokens for maintaining user sessions
/// </summary>
public partial class RefreshToken
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string Token { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? RevokedAt { get; set; }

    /// <summary>
    /// Flag indicating if token has been revoked
    /// </summary>
    public bool? IsRevoked { get; set; }

    /// <summary>
    /// Device information stored as JSON (device type, OS, etc.)
    /// </summary>
    public string? DeviceInfo { get; set; }

    /// <summary>
    /// IP address where token was issued
    /// </summary>
    public IPAddress? IpAddress { get; set; }

    public virtual User User { get; set; } = null!;

    /// <summary>
    /// Computed property to check if the token is active (not revoked and not expired)
    /// </summary>
    public bool IsActive => !IsRevoked.GetValueOrDefault() && !RevokedAt.HasValue && ExpiresAt > DateTime.UtcNow;
}
