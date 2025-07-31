namespace caddie.portal.services.Configuration;

public class OpenAISettings
{
    public const string SectionName = "OpenAISettings";
    
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "gpt-4o-mini";
    public string BaseUrl { get; set; } = "https://api.openai.com/v1";
    public int MaxTokens { get; set; } = 500;
    public double Temperature { get; set; } = 0.7;
    public int MaxRequestsPerMinute { get; set; } = 60;
    public int MaxTokensPerMinute { get; set; } = 150000;
    public int TimeoutSeconds { get; set; } = 30;
    public int MaxRetries { get; set; } = 3;
    public bool EnableFallbackResponses { get; set; } = true;
    public QuotaMonitoringSettings QuotaMonitoring { get; set; } = new();
}

public class QuotaMonitoringSettings
{
    public bool EnableQuotaChecking { get; set; } = true;
    public int DailyTokenLimit { get; set; } = 50000;
    public int HourlyTokenLimit { get; set; } = 5000;
}