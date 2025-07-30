using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Net;

namespace caddie.portal.dal.Models;

/// <summary>
/// Active user sessions for tracking and management
/// </summary>
[Table("user_sessions")]
public partial class UserSession
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [Column("session_token")]
    [StringLength(255)]
    public string SessionToken { get; set; } = null!;

    /// <summary>
    /// Device information stored as JSON
    /// </summary>
    [Column("device_info", TypeName = "jsonb")]
    public string? DeviceInfo { get; set; }

    [Column("ip_address")]
    public IPAddress? IpAddress { get; set; }

    /// <summary>
    /// User agent string from the request
    /// </summary>
    [Column("user_agent")]
    public string? UserAgent { get; set; }

    [Column("is_active")]
    public bool? IsActive { get; set; }

    /// <summary>
    /// Last activity timestamp for session management
    /// </summary>
    [Column("last_activity")]
    public DateTime? LastActivity { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Required]
    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
