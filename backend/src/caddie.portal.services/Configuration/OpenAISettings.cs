namespace caddie.portal.services.Configuration;

public class OpenAISettings
{
    public const string SectionName = "OpenAISettings";
    
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "gpt-4o";
    public string BaseUrl { get; set; } = "https://api.openai.com/v1";
    public int MaxTokens { get; set; } = 1000;
    public double Temperature { get; set; } = 0.7;
    public int MaxRequestsPerMinute { get; set; } = 60;
    public int MaxTokensPerMinute { get; set; } = 150000;
    public int TimeoutSeconds { get; set; } = 30;
    public int MaxRetries { get; set; } = 3;
}