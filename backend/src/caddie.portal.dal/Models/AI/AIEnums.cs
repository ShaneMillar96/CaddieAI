namespace caddie.portal.dal.Models.AI;

public enum MessageType
{
    UserMessage,
    AIResponse,
    SystemMessage,
    ErrorMessage
}

public enum ChatSessionStatus
{
    Active,
    Paused,
    Completed,
    Archived
}