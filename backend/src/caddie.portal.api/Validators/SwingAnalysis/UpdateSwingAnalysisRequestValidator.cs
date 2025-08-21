using FluentValidation;
using caddie.portal.api.DTOs.SwingAnalysis;

namespace caddie.portal.api.Validators.SwingAnalysis;

/// <summary>
/// Validator for UpdateSwingAnalysisRequestDto
/// </summary>
public class UpdateSwingAnalysisRequestValidator : AbstractValidator<UpdateSwingAnalysisRequestDto>
{
    public UpdateSwingAnalysisRequestValidator()
    {
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

        RuleFor(x => x.DetectionConfidence)
            .InclusiveBetween(0m, 1m)
            .When(x => x.DetectionConfidence.HasValue)
            .WithMessage("Detection confidence must be between 0.0 and 1.0");

        RuleFor(x => x.SwingQualityScore)
            .InclusiveBetween(0m, 10m)
            .When(x => x.SwingQualityScore.HasValue)
            .WithMessage("Swing quality score must be between 0 and 10");

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

        RuleFor(x => x.AiFeedback)
            .MaximumLength(1000)
            .When(x => !string.IsNullOrEmpty(x.AiFeedback))
            .WithMessage("AI feedback cannot exceed 1000 characters");
    }
}