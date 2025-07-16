using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using caddie.portal.dal.Models.Common;
using caddie.portal.dal.Models.Users;

namespace caddie.portal.dal.Models.AI;

[Table("chat_messages")]
public class ChatMessage : BaseEntity
{
    [Required]
    [ForeignKey("ChatSession")]
    public Guid SessionId { get; set; }
    
    [Required]
    [ForeignKey("User")]
    public Guid UserId { get; set; }
    
    [Required]
    public string MessageContent { get; set; } = string.Empty;
    
    [Required]
    public MessageType MessageType { get; set; }
    
    [Required]
    [StringLength(20)]
    public string OpenAIRole { get; set; } = "user";
    
    public int? TokensConsumed { get; set; }
    
    [StringLength(50)]
    public string? OpenAIModelUsed { get; set; }
    
    [Column(TypeName = "jsonb")]
    public JsonDocument? ContextData { get; set; }
    
    [Required]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ChatSession ChatSession { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}