using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace caddie.portal.dal.Models;

/// <summary>
/// Voice AI conversations and responses during golf rounds
/// </summary>
[Table("ai_conversations")]
public partial class AIConversation
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("round_id")]
    public int? RoundId { get; set; }

    /// <summary>
    /// User's input to the AI (voice transcription or text)
    /// </summary>
    [Required]
    [Column("user_input")]
    public string UserInput { get; set; } = string.Empty;

    /// <summary>
    /// AI-generated response
    /// </summary>
    [Required]
    [Column("ai_response")]
    public string AIResponse { get; set; } = string.Empty;

    /// <summary>
    /// JSON context data including location, course info, and player state
    /// </summary>
    [Column("context_data", TypeName = "jsonb")]
    public string? ContextData { get; set; }

    /// <summary>
    /// AI response generation time in milliseconds
    /// </summary>
    [Column("response_time_ms")]
    public int? ResponseTimeMs { get; set; }

    /// <summary>
    /// Number of tokens used for this conversation
    /// </summary>
    [Column("token_usage")]
    public int? TokenUsage { get; set; }

    /// <summary>
    /// AI confidence in response accuracy (0.0-1.0)
    /// </summary>
    [Range(0.0, 1.0)]
    [Column("confidence_score", TypeName = "decimal(3,2)")]
    public decimal ConfidenceScore { get; set; } = 0.8m;

    /// <summary>
    /// Type of conversation: voice, text, or auto-generated
    /// </summary>
    [MaxLength(50)]
    [Column("conversation_type")]
    public string ConversationType { get; set; } = "voice";

    /// <summary>
    /// Whether the response requires user confirmation
    /// </summary>
    [Column("requires_confirmation")]
    public bool RequiresConfirmation { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("RoundId")]
    public virtual Round? Round { get; set; }
}