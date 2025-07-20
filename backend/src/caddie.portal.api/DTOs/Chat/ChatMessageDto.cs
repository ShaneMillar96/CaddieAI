namespace caddie.portal.api.DTOs.Chat;

public class ChatMessageDto
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public int UserId { get; set; }
    public string MessageContent { get; set; } = string.Empty;
    public string? OpenaiRole { get; set; }
    public int? TokensConsumed { get; set; }
    public string? OpenaiModelUsed { get; set; }
    public DateTime? Timestamp { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class ChatMessageSummaryDto
{
    public int Id { get; set; }
    public string MessageContent { get; set; } = string.Empty;
    public string? OpenaiRole { get; set; }
    public DateTime? Timestamp { get; set; }
    public bool IsFromUser => OpenaiRole == "user";
    public bool IsFromAssistant => OpenaiRole == "assistant";
}