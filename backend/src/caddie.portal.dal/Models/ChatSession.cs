using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace caddie.portal.dal.Models;

/// <summary>
/// OpenAI ChatGPT conversation sessions with AI caddie personality
/// </summary>
[Table("chat_sessions")]
public partial class ChatSession
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Column("round_id")]
    public int? RoundId { get; set; }

    [Column("course_id")]
    public int? CourseId { get; set; }

    [Column("session_name")]
    [StringLength(255)]
    public string? SessionName { get; set; }

    /// <summary>
    /// Conversation context including recent topics, user preferences, and game state
    /// </summary>
    [Column("context_data", TypeName = "jsonb")]
    public string? ContextData { get; set; }

    /// <summary>
    /// OpenAI model used for this session (gpt-3.5-turbo, gpt-4)
    /// </summary>
    [Column("openai_model")]
    [StringLength(50)]
    public string? OpenaiModel { get; set; }

    /// <summary>
    /// System prompt defining AI caddie personality and context
    /// </summary>
    [Column("system_prompt")]
    public string? SystemPrompt { get; set; }

    /// <summary>
    /// OpenAI temperature setting for response creativity
    /// </summary>
    [Column("temperature", TypeName = "decimal(3,2)")]
    public decimal? Temperature { get; set; }

    /// <summary>
    /// Token limit management for cost control
    /// </summary>
    [Column("max_tokens")]
    public int? MaxTokens { get; set; }

    /// <summary>
    /// Total number of messages in this session
    /// </summary>
    [Column("total_messages")]
    public int? TotalMessages { get; set; }

    [Column("last_message_at")]
    public DateTime? LastMessageAt { get; set; }

    [Column("session_metadata", TypeName = "jsonb")]
    public string? SessionMetadata { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();

    [ForeignKey("CourseId")]
    public virtual Course? Course { get; set; }

    [ForeignKey("RoundId")]
    public virtual Round? Round { get; set; }

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
