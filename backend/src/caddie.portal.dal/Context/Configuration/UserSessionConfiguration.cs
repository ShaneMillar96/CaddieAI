using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using caddie.portal.dal.Models.Users;

namespace caddie.portal.dal.Context.Configuration;

public class UserSessionConfiguration : IEntityTypeConfiguration<UserSession>
{
    public void Configure(EntityTypeBuilder<UserSession> builder)
    {
        builder.ToTable("user_sessions");

        builder.HasKey(us => us.Id);

        builder.Property(us => us.UserId)
            .IsRequired();

        builder.Property(us => us.SessionToken)
            .IsRequired()
            .HasMaxLength(255);

        builder.HasIndex(us => us.SessionToken)
            .IsUnique()
            .HasDatabaseName("idx_user_sessions_session_token");

        builder.Property(us => us.DeviceInfo)
            .HasColumnType("jsonb");

        builder.Property(us => us.IpAddress)
            .HasColumnType("inet");

        builder.Property(us => us.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(us => us.LastActivity)
            .IsRequired();

        builder.Property(us => us.ExpiresAt)
            .IsRequired();

        // Indexes
        builder.HasIndex(us => us.UserId)
            .HasDatabaseName("idx_user_sessions_user_id");

        builder.HasIndex(us => us.IsActive)
            .HasDatabaseName("idx_user_sessions_is_active");

        builder.HasIndex(us => us.LastActivity)
            .HasDatabaseName("idx_user_sessions_last_activity");

        builder.HasIndex(us => us.ExpiresAt)
            .HasDatabaseName("idx_user_sessions_expires_at");

        // Relationships
        builder.HasOne(us => us.User)
            .WithMany(u => u.UserSessions)
            .HasForeignKey(us => us.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}