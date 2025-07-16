using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using caddie.portal.dal.Models.Common;
using caddie.portal.dal.Models.Users;
using caddie.portal.dal.Models.Rounds;
using caddie.portal.dal.Models.Courses;

namespace caddie.portal.dal.Models.AI;

[Table("chat_sessions")]
public class ChatSession : BaseEntity
{
    [Required]
    [ForeignKey("User")]
    public Guid UserId { get; set; }
    
    [ForeignKey("Round")]
    public Guid? RoundId { get; set; }
    
    [ForeignKey("Course")]
    public Guid? CourseId { get; set; }
    
    [StringLength(255)]
    public string? SessionName { get; set; }
    
    [Required]
    public ChatSessionStatus Status { get; set; } = ChatSessionStatus.Active;
    
    [Column(TypeName = "jsonb")]
    public JsonDocument? ContextData { get; set; }
    
    [Required]
    [StringLength(50)]
    public string OpenAIModel { get; set; } = "gpt-3.5-turbo";
    
    public string? SystemPrompt { get; set; }
    
    [Column(TypeName = "decimal(3,2)")]
    public decimal Temperature { get; set; } = 0.7m;
    
    public int MaxTokens { get; set; } = 500;
    
    public int TotalMessages { get; set; } = 0;
    
    public DateTime? LastMessageAt { get; set; }
    
    [Column(TypeName = "jsonb")]
    public JsonDocument? SessionMetadata { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Round? Round { get; set; }
    public virtual Course? Course { get; set; }
    public virtual ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
}