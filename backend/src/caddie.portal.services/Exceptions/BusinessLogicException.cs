namespace caddie.portal.services.Exceptions;

/// <summary>
/// Exception thrown when business logic rules are violated
/// </summary>
public class BusinessLogicException : Exception
{
    public string ErrorCode { get; }

    public BusinessLogicException(string message) : base(message)
    {
        ErrorCode = "BUSINESS_LOGIC_ERROR";
    }

    public BusinessLogicException(string message, string errorCode) : base(message)
    {
        ErrorCode = errorCode;
    }

    public BusinessLogicException(string message, Exception innerException) : base(message, innerException)
    {
        ErrorCode = "BUSINESS_LOGIC_ERROR";
    }

    public BusinessLogicException(string message, string errorCode, Exception innerException) : base(message, innerException)
    {
        ErrorCode = errorCode;
    }
}