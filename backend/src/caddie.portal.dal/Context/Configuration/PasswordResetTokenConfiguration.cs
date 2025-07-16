using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using caddie.portal.dal.Models.Users;

namespace caddie.portal.dal.Context.Configuration;

public class PasswordResetTokenConfiguration : IEntityTypeConfiguration<PasswordResetToken>
{
    public void Configure(EntityTypeBuilder<PasswordResetToken> builder)
    {
        builder.ToTable("password_reset_tokens");

        builder.HasKey(prt => prt.Id);

        builder.Property(prt => prt.UserId)
            .IsRequired();

        builder.Property(prt => prt.Token)
            .IsRequired()
            .HasMaxLength(255);

        builder.HasIndex(prt => prt.Token)
            .IsUnique()
            .HasDatabaseName("idx_password_reset_tokens_token");

        builder.Property(prt => prt.ExpiresAt)
            .IsRequired();

        builder.Property(prt => prt.IsUsed)
            .IsRequired()
            .HasDefaultValue(false);

        // Indexes
        builder.HasIndex(prt => prt.UserId)
            .HasDatabaseName("idx_password_reset_tokens_user_id");

        builder.HasIndex(prt => prt.ExpiresAt)
            .HasDatabaseName("idx_password_reset_tokens_expires_at");

        builder.HasIndex(prt => prt.IsUsed)
            .HasDatabaseName("idx_password_reset_tokens_is_used");

        // Relationships
        builder.HasOne(prt => prt.User)
            .WithMany(u => u.PasswordResetTokens)
            .HasForeignKey(prt => prt.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}