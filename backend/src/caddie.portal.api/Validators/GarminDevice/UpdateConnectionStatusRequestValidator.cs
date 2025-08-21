using FluentValidation;
using caddie.portal.api.DTOs.GarminDevice;

namespace caddie.portal.api.Validators.GarminDevice;

/// <summary>
/// Validator for UpdateConnectionStatusRequestDto
/// </summary>
public class UpdateConnectionStatusRequestValidator : AbstractValidator<UpdateConnectionStatusRequestDto>
{
    public UpdateConnectionStatusRequestValidator()
    {
        RuleFor(x => x.ConnectionStatus)
            .NotEmpty()
            .WithMessage("Connection status is required")
            .Must(IsValidConnectionStatus)
            .WithMessage("Connection status must be 'connected', 'disconnected', 'pairing', or 'error'");

        RuleFor(x => x.BatteryLevel)
            .InclusiveBetween(0, 100)
            .When(x => x.BatteryLevel.HasValue)
            .WithMessage("Battery level must be between 0 and 100");

        RuleFor(x => x.FirmwareVersion)
            .MaximumLength(50)
            .When(x => !string.IsNullOrEmpty(x.FirmwareVersion))
            .WithMessage("Firmware version cannot exceed 50 characters");

        // Custom validation rules
        RuleFor(x => x.FirmwareVersion)
            .Must(IsValidFirmwareFormat)
            .When(x => !string.IsNullOrEmpty(x.FirmwareVersion))
            .WithMessage("Firmware version should be in a valid format (e.g., 1.2.3 or 10.25)");

        // Business rule: Battery level should be provided when status is connected
        RuleFor(x => x.BatteryLevel)
            .NotNull()
            .When(x => x.ConnectionStatus == "connected")
            .WithMessage("Battery level is recommended when device is connected");
    }

    private static bool IsValidConnectionStatus(string? connectionStatus)
    {
        if (string.IsNullOrEmpty(connectionStatus))
            return false;

        var validStatuses = new[] { "connected", "disconnected", "pairing", "error" };
        return validStatuses.Contains(connectionStatus.ToLowerInvariant());
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