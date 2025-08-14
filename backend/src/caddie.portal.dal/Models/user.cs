using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace caddie.portal.dal.Models;

/// <summary>
/// Core user information including golf-specific data and preferences
/// </summary>
[Table("users")]
public partial class User
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("email")]
    [StringLength(255)]
    public string Email { get; set; } = null!;

    [Required]
    [Column("password_hash")]
    [StringLength(255)]
    public string PasswordHash { get; set; } = null!;

    [Required]
    [Column("first_name")]
    [StringLength(100)]
    public string FirstName { get; set; } = null!;

    [Required]
    [Column("last_name")]
    [StringLength(100)]
    public string LastName { get; set; } = null!;

    /// <summary>
    /// Golf handicap index, typically between -10 and 54
    /// </summary>
    [Column("handicap", TypeName = "decimal(4,1)")]
    public decimal? Handicap { get; set; }

    /// <summary>
    /// User preferences stored as JSON (club preferences, notifications, etc.)
    /// </summary>
    [Column("preferences", TypeName = "jsonb")]
    public string? Preferences { get; set; }

    /// <summary>
    /// Playing style characteristics stored as JSON (aggressive, conservative, etc.)
    /// </summary>
    [Column("playing_style", TypeName = "jsonb")]
    public string? PlayingStyle { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    [Column("last_login_at")]
    public DateTime? LastLoginAt { get; set; }

    /// <summary>
    /// Flag indicating if email address has been verified
    /// </summary>
    [Column("email_verified")]
    public bool? EmailVerified { get; set; }

    [Column("email_verification_token")]
    [StringLength(255)]
    public string? EmailVerificationToken { get; set; }

    [Column("email_verification_expires")]
    public DateTime? EmailVerificationExpires { get; set; }

    [Column("password_reset_token")]
    [StringLength(255)]
    public string? PasswordResetToken { get; set; }

    [Column("password_reset_expires")]
    public DateTime? PasswordResetExpires { get; set; }

    /// <summary>
    /// Counter for failed login attempts (for account locking)
    /// </summary>
    [Column("failed_login_attempts")]
    public int? FailedLoginAttempts { get; set; }

    /// <summary>
    /// Timestamp until which account is locked due to failed attempts
    /// </summary>
    [Column("locked_until")]
    public DateTime? LockedUntil { get; set; }

    /// <summary>
    /// Flag indicating if 2FA is enabled for the user
    /// </summary>
    [Column("two_factor_enabled")]
    public bool? TwoFactorEnabled { get; set; }

    [Column("two_factor_secret")]
    [StringLength(255)]
    public string? TwoFactorSecret { get; set; }

    [Column("skill_level_id")]
    public int SkillLevelId { get; set; }

    [Column("status_id")]
    public int StatusId { get; set; }


    public virtual ICollection<Course> Courses { get; set; } = new List<Course>();

    public virtual ICollection<Hole> Holes { get; set; } = new List<Hole>();

    public virtual ICollection<Location> Locations { get; set; } = new List<Location>();

    public virtual ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();

    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public virtual ICollection<Round> Rounds { get; set; } = new List<Round>();

    [ForeignKey("SkillLevelId")]
    public virtual SkillLevel SkillLevel { get; set; } = null!;

    [ForeignKey("StatusId")]
    public virtual UserStatus Status { get; set; } = null!;

    public virtual ICollection<UserSession> UserSessions { get; set; } = new List<UserSession>();

    [InverseProperty("User")]
    public virtual ICollection<UserCourse> UserCourses { get; set; } = new List<UserCourse>();
}
