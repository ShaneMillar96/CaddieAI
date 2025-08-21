using FluentValidation;
using caddie.portal.api.DTOs.GarminDevice;

namespace caddie.portal.api.Validators.GarminDevice;

/// <summary>
/// Validator for UpdateGarminDeviceRequestDto
/// </summary>
public class UpdateGarminDeviceRequestValidator : AbstractValidator<UpdateGarminDeviceRequestDto>
{
    public UpdateGarminDeviceRequestValidator()
    {
        RuleFor(x => x.DeviceName)
            .Length(1, 100)
            .When(x => !string.IsNullOrEmpty(x.DeviceName))
            .WithMessage("Device name must be between 1 and 100 characters");

        RuleFor(x => x.FirmwareVersion)
            .MaximumLength(50)
            .When(x => !string.IsNullOrEmpty(x.FirmwareVersion))
            .WithMessage("Firmware version cannot exceed 50 characters");

        RuleFor(x => x.AutoConnect)
            .NotNull()
            .When(x => x.AutoConnect.HasValue)
            .WithMessage("Auto connect must be true or false when provided");

        RuleFor(x => x.PreferredDevice)
            .NotNull()
            .When(x => x.PreferredDevice.HasValue)
            .WithMessage("Preferred device must be true or false when provided");

        // Custom validation rules
        RuleFor(x => x.DeviceName)
            .Must(NotContainInvalidCharacters)
            .When(x => !string.IsNullOrEmpty(x.DeviceName))
            .WithMessage("Device name contains invalid characters");

        RuleFor(x => x.FirmwareVersion)
            .Must(IsValidFirmwareFormat)
            .When(x => !string.IsNullOrEmpty(x.FirmwareVersion))
            .WithMessage("Firmware version should be in a valid format (e.g., 1.2.3 or 10.25)");
    }

    private static bool NotContainInvalidCharacters(string? deviceName)
    {
        if (string.IsNullOrEmpty(deviceName))
            return true;

        // Check for potentially problematic characters
        var invalidChars = new[] { '<', '>', '"', '\'', '&', '\n', '\r', '\t' };
        return !deviceName.Any(c => invalidChars.Contains(c));
    }

    private static bool IsValidFirmwareFormat(string? firmwareVersion)
    {
        if (string.IsNullOrEmpty(firmwareVersion))
            return true;

        // Basic validation for firmware version format
        // Should contain numbers and dots, common patterns: 1.2.3, 10.25, 2.1.0-beta
        var validChars = firmwareVersion.All(c => char.IsDigit(c) || c == '.' || c == '-' || char.IsLetter(c));
        var hasNumber = firmwareVersion.Any(char.IsDigit);
        
        return validChars && hasNumber && firmwareVersion.Length <= 50;
    }
}