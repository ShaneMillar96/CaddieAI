using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using caddie.portal.dal.Models.AI;

namespace caddie.portal.dal.Context.Configuration;

public class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.ToTable("chat_messages", t => t.HasCheckConstraint("CK_ChatMessage_OpenAIRole", "openai_role IN ('user', 'assistant', 'system')"));

        builder.HasKey(cm => cm.Id);

        builder.Property(cm => cm.SessionId)
            .IsRequired();

        builder.Property(cm => cm.UserId)
            .IsRequired();

        builder.Property(cm => cm.MessageContent)
            .IsRequired();

        builder.Property(cm => cm.MessageType)
            .IsRequired();

        builder.Property(cm => cm.OpenAIRole)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue("user");

        builder.Property(cm => cm.OpenAIModelUsed)
            .HasMaxLength(50);

        builder.Property(cm => cm.ContextData)
            .HasColumnType("jsonb");

        builder.Property(cm => cm.Timestamp)
            .IsRequired();

        // Indexes
        builder.HasIndex(cm => cm.SessionId)
            .HasDatabaseName("idx_chat_messages_session_id");

        builder.HasIndex(cm => cm.UserId)
            .HasDatabaseName("idx_chat_messages_user_id");

        builder.HasIndex(cm => cm.Timestamp)
            .HasDatabaseName("idx_chat_messages_timestamp");

        builder.HasIndex(cm => cm.MessageType)
            .HasDatabaseName("idx_chat_messages_message_type");

        builder.HasIndex(cm => cm.OpenAIRole)
            .HasDatabaseName("idx_chat_messages_openai_role");

        builder.HasIndex(cm => cm.TokensConsumed)
            .HasDatabaseName("idx_chat_messages_tokens_consumed");

        builder.HasIndex(cm => new { cm.SessionId, cm.Timestamp })
            .HasDatabaseName("idx_chat_messages_session_timestamp");

        // Relationships
        builder.HasOne(cm => cm.ChatSession)
            .WithMany(cs => cs.ChatMessages)
            .HasForeignKey(cm => cm.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cm => cm.User)
            .WithMany(u => u.ChatMessages)
            .HasForeignKey(cm => cm.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}