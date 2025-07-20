namespace caddie.portal.api.DTOs.Chat;

public class ChatResponseDto
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public ChatSessionDto? Session { get; set; }
    public ChatMessageDto? UserMessage { get; set; }
    public ChatMessageDto? AssistantMessage { get; set; }
}

public class StartChatSessionResponseDto
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public ChatSessionDto? Session { get; set; }
}

public class ChatUsageStatsDto
{
    public int TotalTokens { get; set; }
    public int TotalMessages { get; set; }
    public decimal EstimatedCost { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime StatsGeneratedAt { get; set; } = DateTime.UtcNow;
}