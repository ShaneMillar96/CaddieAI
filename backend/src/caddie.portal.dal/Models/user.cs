using System;
using System.Collections.Generic;

namespace caddie.portal.dal.Models;

/// <summary>
/// Core user information including golf-specific data and preferences
/// </summary>
public partial class User
{
    public int Id { get; set; }

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    /// <summary>
    /// Golf handicap index, typically between -10 and 54
    /// </summary>
    public decimal? Handicap { get; set; }

    /// <summary>
    /// User preferences stored as JSON (club preferences, notifications, etc.)
    /// </summary>
    public string? Preferences { get; set; }

    /// <summary>
    /// Playing style characteristics stored as JSON (aggressive, conservative, etc.)
    /// </summary>
    public string? PlayingStyle { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? LastLoginAt { get; set; }

    /// <summary>
    /// Flag indicating if email address has been verified
    /// </summary>
    public bool? EmailVerified { get; set; }

    public string? EmailVerificationToken { get; set; }

    public DateTime? EmailVerificationExpires { get; set; }

    public string? PasswordResetToken { get; set; }

    public DateTime? PasswordResetExpires { get; set; }

    /// <summary>
    /// Counter for failed login attempts (for account locking)
    /// </summary>
    public int? FailedLoginAttempts { get; set; }

    /// <summary>
    /// Timestamp until which account is locked due to failed attempts
    /// </summary>
    public DateTime? LockedUntil { get; set; }

    /// <summary>
    /// Flag indicating if 2FA is enabled for the user
    /// </summary>
    public bool? TwoFactorEnabled { get; set; }

    public string? TwoFactorSecret { get; set; }

    public int SkillLevelId { get; set; }

    public int StatusId { get; set; }

    public virtual ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();

    public virtual ICollection<ChatSession> ChatSessions { get; set; } = new List<ChatSession>();

    public virtual ICollection<ClubRecommendation> ClubRecommendations { get; set; } = new List<ClubRecommendation>();

    public virtual ICollection<Location> Locations { get; set; } = new List<Location>();

    public virtual ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();

    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public virtual ICollection<Round> Rounds { get; set; } = new List<Round>();

    public virtual SkillLevel SkillLevel { get; set; } = null!;

    public virtual UserStatus Status { get; set; } = null!;

    public virtual ICollection<UserSession> UserSessions { get; set; } = new List<UserSession>();
}
