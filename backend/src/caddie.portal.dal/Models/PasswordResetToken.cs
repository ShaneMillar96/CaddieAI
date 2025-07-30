using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace caddie.portal.dal.Models;

/// <summary>
/// Password reset tokens for secure password recovery
/// </summary>
[Table("password_reset_tokens")]
public partial class PasswordResetToken
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

    [Column("used_at")]
    public DateTime? UsedAt { get; set; }

    [Column("is_used")]
    public bool? IsUsed { get; set; }

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
