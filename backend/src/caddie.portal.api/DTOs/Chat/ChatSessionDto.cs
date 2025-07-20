namespace caddie.portal.api.DTOs.Chat;

public class ChatSessionDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? RoundId { get; set; }
    public int? CourseId { get; set; }
    public string? SessionName { get; set; }
    public string? OpenaiModel { get; set; }
    public decimal? Temperature { get; set; }
    public int? MaxTokens { get; set; }
    public int? TotalMessages { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class ChatSessionDetailDto : ChatSessionDto
{
    public List<ChatMessageDto> Messages { get; set; } = new();
    public string? CourseName { get; set; }
    public string? RoundStatus { get; set; }
}

public class ChatSessionSummaryDto
{
    public int Id { get; set; }
    public string? SessionName { get; set; }
    public string? CourseName { get; set; }
    public int? TotalMessages { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public DateTime? CreatedAt { get; set; }
    public bool IsActive { get; set; }
}