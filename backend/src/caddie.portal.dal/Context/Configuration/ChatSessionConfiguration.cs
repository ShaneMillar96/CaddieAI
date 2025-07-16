using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using caddie.portal.dal.Models.AI;

namespace caddie.portal.dal.Context.Configuration;

public class ChatSessionConfiguration : IEntityTypeConfiguration<ChatSession>
{
    public void Configure(EntityTypeBuilder<ChatSession> builder)
    {
        builder.ToTable("chat_sessions", t => {
            t.HasCheckConstraint("CK_ChatSession_Temperature", "temperature >= 0.0 AND temperature <= 2.0");
            t.HasCheckConstraint("CK_ChatSession_MaxTokens", "max_tokens >= 1 AND max_tokens <= 4000");
        });

        builder.HasKey(cs => cs.Id);

        builder.Property(cs => cs.UserId)
            .IsRequired();

        builder.Property(cs => cs.SessionName)
            .HasMaxLength(255);

        builder.Property(cs => cs.Status)
            .IsRequired()
            .HasDefaultValue(ChatSessionStatus.Active);

        builder.Property(cs => cs.ContextData)
            .HasColumnType("jsonb");

        builder.Property(cs => cs.OpenAIModel)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("gpt-3.5-turbo");

        builder.Property(cs => cs.Temperature)
            .HasColumnType("decimal(3,2)")
            .HasDefaultValue(0.7m);

        builder.Property(cs => cs.MaxTokens)
            .HasDefaultValue(500);

        builder.Property(cs => cs.TotalMessages)
            .HasDefaultValue(0);

        builder.Property(cs => cs.SessionMetadata)
            .HasColumnType("jsonb");

        // Indexes
        builder.HasIndex(cs => cs.UserId)
            .HasDatabaseName("idx_chat_sessions_user_id");

        builder.HasIndex(cs => cs.RoundId)
            .HasDatabaseName("idx_chat_sessions_round_id");

        builder.HasIndex(cs => cs.CourseId)
            .HasDatabaseName("idx_chat_sessions_course_id");

        builder.HasIndex(cs => cs.Status)
            .HasDatabaseName("idx_chat_sessions_status");

        builder.HasIndex(cs => cs.OpenAIModel)
            .HasDatabaseName("idx_chat_sessions_openai_model");

        builder.HasIndex(cs => cs.LastMessageAt)
            .HasDatabaseName("idx_chat_sessions_last_message_at");

        builder.HasIndex(cs => new { cs.UserId, cs.Status })
            .HasDatabaseName("idx_chat_sessions_user_status");

        builder.HasIndex(cs => cs.ContextData)
            .HasDatabaseName("idx_chat_sessions_context_data")
            .HasMethod("GIN");

        // Relationships
        builder.HasOne(cs => cs.User)
            .WithMany(u => u.ChatSessions)
            .HasForeignKey(cs => cs.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cs => cs.Round)
            .WithMany(r => r.ChatSessions)
            .HasForeignKey(cs => cs.RoundId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cs => cs.Course)
            .WithMany(c => c.ChatSessions)
            .HasForeignKey(cs => cs.CourseId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(cs => cs.ChatMessages)
            .WithOne(cm => cm.ChatSession)
            .HasForeignKey(cm => cm.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}