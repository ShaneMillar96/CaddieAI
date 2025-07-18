using System;
using System.Collections.Generic;
using System.Net;

namespace caddie.portal.dal.Models;

/// <summary>
/// Active user sessions for tracking and management
/// </summary>
public partial class UserSession
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string SessionToken { get; set; } = null!;

    /// <summary>
    /// Device information stored as JSON
    /// </summary>
    public string? DeviceInfo { get; set; }

    public IPAddress? IpAddress { get; set; }

    /// <summary>
    /// User agent string from the request
    /// </summary>
    public string? UserAgent { get; set; }

    public bool? IsActive { get; set; }

    /// <summary>
    /// Last activity timestamp for session management
    /// </summary>
    public DateTime? LastActivity { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    public virtual User User { get; set; } = null!;
}
