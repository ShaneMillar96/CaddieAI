using System;
using System.Collections.Generic;

namespace caddie.portal.dal.Models;

/// <summary>
/// Password reset tokens for secure password recovery
/// </summary>
public partial class PasswordResetToken
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string Token { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UsedAt { get; set; }

    public bool? IsUsed { get; set; }

    public virtual User User { get; set; } = null!;
}
