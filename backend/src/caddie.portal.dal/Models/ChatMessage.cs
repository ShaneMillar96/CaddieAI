using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace caddie.portal.dal.Models;

/// <summary>
/// ChatGPT conversation messages with token tracking
/// </summary>
[Table("chat_messages")]
public partial class ChatMessage
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("session_id")]
    public int SessionId { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    /// <summary>
    /// Message content (text)
    /// </summary>
    [Required]
    [Column("message_content")]
    public string MessageContent { get; set; } = null!;

    /// <summary>
    /// OpenAI role (user, assistant, system)
    /// </summary>
    [Column("openai_role")]
    [StringLength(20)]
    public string? OpenaiRole { get; set; }

    /// <summary>
    /// Number of tokens used by OpenAI for this message
    /// </summary>
    [Column("tokens_consumed")]
    public int? TokensConsumed { get; set; }

    /// <summary>
    /// OpenAI model used for this specific message
    /// </summary>
    [Column("openai_model_used")]
    [StringLength(50)]
    public string? OpenaiModelUsed { get; set; }

    /// <summary>
    /// Additional context data for this message
    /// </summary>
    [Column("context_data", TypeName = "jsonb")]
    public string? ContextData { get; set; }

    [Column("timestamp")]
    public DateTime? Timestamp { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    [ForeignKey("SessionId")]
    public virtual ChatSession Session { get; set; } = null!;

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
