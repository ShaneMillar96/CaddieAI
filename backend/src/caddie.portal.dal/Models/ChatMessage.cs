using System;
using System.Collections.Generic;

namespace caddie.portal.dal.Models;

/// <summary>
/// ChatGPT conversation messages with token tracking
/// </summary>
public partial class ChatMessage
{
    public int Id { get; set; }

    public int SessionId { get; set; }

    public int UserId { get; set; }

    /// <summary>
    /// Message content (text)
    /// </summary>
    public string MessageContent { get; set; } = null!;

    /// <summary>
    /// OpenAI role (user, assistant, system)
    /// </summary>
    public string? OpenaiRole { get; set; }

    /// <summary>
    /// Number of tokens used by OpenAI for this message
    /// </summary>
    public int? TokensConsumed { get; set; }

    /// <summary>
    /// OpenAI model used for this specific message
    /// </summary>
    public string? OpenaiModelUsed { get; set; }

    /// <summary>
    /// Additional context data for this message
    /// </summary>
    public string? ContextData { get; set; }

    public DateTime? Timestamp { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ChatSession Session { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
