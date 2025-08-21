using FluentValidation;
using caddie.portal.api.DTOs.SwingAnalysis;

namespace caddie.portal.api.Validators.SwingAnalysis;

/// <summary>
/// Validator for CreateSwingAnalysisRequestDto
/// </summary>
public class CreateSwingAnalysisRequestValidator : AbstractValidator<CreateSwingAnalysisRequestDto>
{
    public CreateSwingAnalysisRequestValidator()
    {
        RuleFor(x => x.UserId)
            .GreaterThan(0)
            .WithMessage("User ID must be a positive integer");

        RuleFor(x => x.RoundId)
            .GreaterThan(0)
            .WithMessage("Round ID must be a positive integer");

        RuleFor(x => x.HoleId)
            .GreaterThan(0)
            .When(x => x.HoleId.HasValue)
            .WithMessage("Hole ID must be a positive integer when provided");

        RuleFor(x => x.SwingSpeedMph)
            .InclusiveBetween(40m, 150m)
            .When(x => x.SwingSpeedMph.HasValue)
            .WithMessage("Swing speed must be between 40 and 150 mph");

        RuleFor(x => x.SwingAngleDegrees)
            .InclusiveBetween(-180m, 180m)
            .When(x => x.SwingAngleDegrees.HasValue)
            .WithMessage("Swing angle must be between -180 and 180 degrees");

        RuleFor(x => x.BackswingAngleDegrees)
            .InclusiveBetween(-180m, 180m)
            .When(x => x.BackswingAngleDegrees.HasValue)
            .WithMessage("Backswing angle must be between -180 and 180 degrees");

        RuleFor(x => x.FollowThroughAngleDegrees)
            .InclusiveBetween(-180m, 180m)
            .When(x => x.FollowThroughAngleDegrees.HasValue)
            .WithMessage("Follow-through angle must be between -180 and 180 degrees");

        RuleFor(x => x.DetectionSource)
            .NotEmpty()
            .WithMessage("Detection source is required")
            .Must(x => x == "garmin" || x == "mobile")
            .WithMessage("Detection source must be 'garmin' or 'mobile'");

        RuleFor(x => x.DeviceModel)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.DeviceModel))
            .WithMessage("Device model cannot exceed 100 characters");

        RuleFor(x => x.DetectionConfidence)
            .InclusiveBetween(0m, 1m)
            .When(x => x.DetectionConfidence.HasValue)
            .WithMessage("Detection confidence must be between 0.0 and 1.0");

        RuleFor(x => x.SwingQualityScore)
            .InclusiveBetween(0m, 10m)
            .When(x => x.SwingQualityScore.HasValue)
            .WithMessage("Swing quality score must be between 0 and 10");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90m, 90m)
            .When(x => x.Latitude.HasValue)
            .WithMessage("Latitude must be between -90 and 90 degrees");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180m, 180m)
            .When(x => x.Longitude.HasValue)
            .WithMessage("Longitude must be between -180 and 180 degrees");

        RuleFor(x => x.ClubUsed)
            .MaximumLength(50)
            .When(x => !string.IsNullOrEmpty(x.ClubUsed))
            .WithMessage("Club used cannot exceed 50 characters");

        RuleFor(x => x.DistanceToPinYards)
            .InclusiveBetween(0, 600)
            .When(x => x.DistanceToPinYards.HasValue)
            .WithMessage("Distance to pin must be between 0 and 600 yards");

        RuleFor(x => x.ComparedToTemplate)
            .MaximumLength(50)
            .When(x => !string.IsNullOrEmpty(x.ComparedToTemplate))
            .WithMessage("Compared to template cannot exceed 50 characters");

        // Custom validation rule: If latitude is provided, longitude must also be provided and vice versa
        RuleFor(x => x)
            .Must(x => (x.Latitude.HasValue && x.Longitude.HasValue) || (!x.Latitude.HasValue && !x.Longitude.HasValue))
            .WithMessage("Both latitude and longitude must be provided together or both omitted")
            .WithName("Location");

        // Custom validation rule: If detection source is garmin, device model should be provided
        RuleFor(x => x.DeviceModel)
            .NotEmpty()
            .When(x => x.DetectionSource == "garmin")
            .WithMessage("Device model is recommended when detection source is Garmin");
    }
}