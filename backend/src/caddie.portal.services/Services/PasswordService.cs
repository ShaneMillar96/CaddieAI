using Microsoft.Extensions.Options;
using caddie.portal.services.Configuration;
using caddie.portal.services.Interfaces;
using System.Text.RegularExpressions;

namespace caddie.portal.services.Services;

public class PasswordService : IPasswordService
{
    private readonly AuthenticationSettings _authSettings;
    private readonly Random _random = new();

    public PasswordService(IOptions<AuthenticationSettings> authSettings)
    {
        _authSettings = authSettings.Value;
    }

    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt());
    }

    public bool VerifyPassword(string password, string hashedPassword)
    {
        return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
    }

    public bool IsPasswordValid(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
            return false;

        if (password.Length < _authSettings.PasswordMinLength)
            return false;

        if (_authSettings.RequireUppercase && !password.Any(char.IsUpper))
            return false;

        if (_authSettings.RequireLowercase && !password.Any(char.IsLower))
            return false;

        if (_authSettings.RequireDigit && !password.Any(char.IsDigit))
            return false;

        if (_authSettings.RequireSpecialChar && !Regex.IsMatch(password, @"[!@#$%^&*(),.?\"":{}|<>]"))
            return false;

        return true;
    }

    public string GenerateRandomPassword(int length = 12)
    {
        const string upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const string lowerChars = "abcdefghijklmnopqrstuvwxyz";
        const string digitChars = "0123456789";
        const string specialChars = "!@#$%^&*(),.?\":{}|<>";
        
        var password = new List<char>();
        
        // Ensure at least one character from each required category
        if (_authSettings.RequireUppercase)
            password.Add(upperChars[_random.Next(upperChars.Length)]);
        
        if (_authSettings.RequireLowercase)
            password.Add(lowerChars[_random.Next(lowerChars.Length)]);
        
        if (_authSettings.RequireDigit)
            password.Add(digitChars[_random.Next(digitChars.Length)]);
        
        if (_authSettings.RequireSpecialChar)
            password.Add(specialChars[_random.Next(specialChars.Length)]);

        // Fill remaining length with random characters from all categories
        var allChars = upperChars + lowerChars + digitChars + specialChars;
        for (int i = password.Count; i < length; i++)
        {
            password.Add(allChars[_random.Next(allChars.Length)]);
        }

        // Shuffle the password
        return new string(password.OrderBy(x => _random.Next()).ToArray());
    }
}