using System;
using System.Collections.Generic;

namespace caddie.portal.dal.Models;

/// <summary>
/// OpenAI ChatGPT conversation sessions with AI caddie personality
/// </summary>
public partial class ChatSession
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int? RoundId { get; set; }

    public int? CourseId { get; set; }

    public string? SessionName { get; set; }

    /// <summary>
    /// Conversation context including recent topics, user preferences, and game state
    /// </summary>
    public string? ContextData { get; set; }

    /// <summary>
    /// OpenAI model used for this session (gpt-3.5-turbo, gpt-4)
    /// </summary>
    public string? OpenaiModel { get; set; }

    /// <summary>
    /// System prompt defining AI caddie personality and context
    /// </summary>
    public string? SystemPrompt { get; set; }

    /// <summary>
    /// OpenAI temperature setting for response creativity
    /// </summary>
    public decimal? Temperature { get; set; }

    /// <summary>
    /// Token limit management for cost control
    /// </summary>
    public int? MaxTokens { get; set; }

    /// <summary>
    /// Total number of messages in this session
    /// </summary>
    public int? TotalMessages { get; set; }

    public DateTime? LastMessageAt { get; set; }

    public string? SessionMetadata { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();

    public virtual Course? Course { get; set; }

    public virtual Round? Round { get; set; }

    public virtual User User { get; set; } = null!;
}
