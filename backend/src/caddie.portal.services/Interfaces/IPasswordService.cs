namespace caddie.portal.services.Interfaces;

public interface IPasswordService
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string hashedPassword);
    bool IsPasswordValid(string password);
    string GenerateRandomPassword(int length = 12);
}