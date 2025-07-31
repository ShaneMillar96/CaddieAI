namespace caddie.portal.services.Exceptions;

public class OpenAIQuotaExceededException : Exception
{
    public string? QuotaType { get; }
    public int? RetryAfterSeconds { get; }

    public OpenAIQuotaExceededException(string message) : base(message)
    {
    }

    public OpenAIQuotaExceededException(string message, string quotaType, int? retryAfterSeconds = null) : base(message)
    {
        QuotaType = quotaType;
        RetryAfterSeconds = retryAfterSeconds;
    }

    public OpenAIQuotaExceededException(string message, Exception innerException) : base(message, innerException)
    {
    }
}