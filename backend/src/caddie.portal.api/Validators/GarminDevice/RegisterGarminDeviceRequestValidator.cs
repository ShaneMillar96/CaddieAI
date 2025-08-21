using FluentValidation;
using caddie.portal.api.DTOs.GarminDevice;
using System.Text.RegularExpressions;

namespace caddie.portal.api.Validators.GarminDevice;

/// <summary>
/// Validator for RegisterGarminDeviceRequestDto
/// </summary>
public class RegisterGarminDeviceRequestValidator : AbstractValidator<RegisterGarminDeviceRequestDto>
{
    private static readonly Regex BluetoothAddressRegex = new(@"^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$", RegexOptions.Compiled);

    public RegisterGarminDeviceRequestValidator()
    {
        RuleFor(x => x.DeviceName)
            .NotEmpty()
            .WithMessage("Device name is required")
            .Length(1, 100)
            .WithMessage("Device name must be between 1 and 100 characters");

        RuleFor(x => x.DeviceModel)
            .NotEmpty()
            .WithMessage("Device model is required")
            .Length(1, 100)
            .WithMessage("Device model must be between 1 and 100 characters");

        RuleFor(x => x.BluetoothAddress)
            .NotEmpty()
            .WithMessage("Bluetooth address is required")
            .Must(IsValidBluetoothAddress)
            .WithMessage("Bluetooth address must be in XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX format");

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
        RuleFor(x => x.DeviceModel)
            .Must(IsValidGarminModel)
            .WithMessage("Device model should be a recognized Garmin model (e.g., Forerunner, Fenix, etc.)");

        RuleFor(x => x.DeviceName)
            .Must(NotContainInvalidCharacters)
            .WithMessage("Device name contains invalid characters");
    }

    private static bool IsValidBluetoothAddress(string? bluetoothAddress)
    {
        if (string.IsNullOrEmpty(bluetoothAddress))
            return false;

        return BluetoothAddressRegex.IsMatch(bluetoothAddress);
    }

    private static bool IsValidGarminModel(string? deviceModel)
    {
        if (string.IsNullOrEmpty(deviceModel))
            return false;

        // List of known Garmin device series
        var validGarminSeries = new[]
        {
            "forerunner", "fenix", "vivoactive", "vivosmart", "vivosport",
            "instinct", "descent", "marq", "tactix", "quatix", "d2",
            "edge", "epix", "approach", "swim"
        };

        var lowerModel = deviceModel.ToLowerInvariant();
        return validGarminSeries.Any(series => lowerModel.Contains(series));
    }

    private static bool NotContainInvalidCharacters(string? deviceName)
    {
        if (string.IsNullOrEmpty(deviceName))
            return false;

        // Check for potentially problematic characters
        var invalidChars = new[] { '<', '>', '"', '\'', '&', '\n', '\r', '\t' };
        return !deviceName.Any(c => invalidChars.Contains(c));
    }
}