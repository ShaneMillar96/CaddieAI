using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using caddie.portal.dal.Models.Users;

namespace caddie.portal.dal.Context.Configuration;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users", t => t.HasCheckConstraint("CK_User_Handicap", "handicap >= -10 AND handicap <= 54"));

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(255);

        builder.HasIndex(u => u.Email)
            .IsUnique()
            .HasDatabaseName("idx_users_email");

        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(u => u.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.Handicap)
            .HasColumnType("decimal(4,1)");

        builder.Property(u => u.SkillLevel)
            .IsRequired()
            .HasDefaultValue(SkillLevel.Beginner);

        builder.Property(u => u.Status)
            .IsRequired()
            .HasDefaultValue(UserStatus.Active);

        builder.Property(u => u.Preferences)
            .HasColumnType("jsonb");

        builder.Property(u => u.PlayingStyle)
            .HasColumnType("jsonb");

        // Authentication fields
        builder.Property(u => u.EmailVerified)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(u => u.EmailVerificationToken)
            .HasMaxLength(255);

        builder.Property(u => u.PasswordResetToken)
            .HasMaxLength(255);

        builder.Property(u => u.FailedLoginAttempts)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(u => u.TwoFactorEnabled)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(u => u.TwoFactorSecret)
            .HasMaxLength(255);

        // Indexes
        builder.HasIndex(u => u.Status)
            .HasDatabaseName("idx_users_status");

        builder.HasIndex(u => u.SkillLevel)
            .HasDatabaseName("idx_users_skill_level");

        builder.HasIndex(u => u.Handicap)
            .HasDatabaseName("idx_users_handicap");

        builder.HasIndex(u => u.Preferences)
            .HasDatabaseName("idx_users_preferences")
            .HasMethod("GIN");

        builder.HasIndex(u => u.PlayingStyle)
            .HasDatabaseName("idx_users_playing_style")
            .HasMethod("GIN");

        // Authentication indexes
        builder.HasIndex(u => u.EmailVerified)
            .HasDatabaseName("idx_users_email_verified");

        builder.HasIndex(u => u.EmailVerificationToken)
            .HasDatabaseName("idx_users_email_verification_token");

        builder.HasIndex(u => u.PasswordResetToken)
            .HasDatabaseName("idx_users_password_reset_token");

        builder.HasIndex(u => u.FailedLoginAttempts)
            .HasDatabaseName("idx_users_failed_login_attempts");

        builder.HasIndex(u => u.LockedUntil)
            .HasDatabaseName("idx_users_locked_until");

        builder.HasIndex(u => u.TwoFactorEnabled)
            .HasDatabaseName("idx_users_two_factor_enabled");

        // Relationships
        builder.HasMany(u => u.Rounds)
            .WithOne(r => r.User)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.ChatSessions)
            .WithOne(cs => cs.User)
            .HasForeignKey(cs => cs.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.ChatMessages)
            .WithOne(cm => cm.User)
            .HasForeignKey(cm => cm.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.ClubRecommendations)
            .WithOne(cr => cr.User)
            .HasForeignKey(cr => cr.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.Locations)
            .WithOne(l => l.User)
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.RefreshTokens)
            .WithOne(rt => rt.User)
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.UserSessions)
            .WithOne(us => us.User)
            .HasForeignKey(us => us.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.PasswordResetTokens)
            .WithOne(prt => prt.User)
            .HasForeignKey(prt => prt.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}