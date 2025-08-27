using FluentValidation;
using caddie.portal.api.DTOs.ShotAnalysis;

namespace caddie.portal.api.Validators.ShotAnalysis;

/// <summary>
/// Validator for shot analysis request
/// </summary>
public class ShotAnalysisRequestValidator : AbstractValidator<ShotAnalysisRequestDto>
{
    public ShotAnalysisRequestValidator()
    {
        RuleFor(x => x.UserId)
            .GreaterThan(0)
            .WithMessage("UserId must be a positive integer");

        RuleFor(x => x.RoundId)
            .GreaterThan(0)
            .WithMessage("RoundId must be a positive integer");

        RuleFor(x => x.HoleNumber)
            .InclusiveBetween(1, 18)
            .WithMessage("HoleNumber must be between 1 and 18");

        RuleFor(x => x.DistanceYards)
            .InclusiveBetween(10, 600)
            .WithMessage("DistanceYards must be between 10 and 600 yards");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90)
            .WithMessage("Latitude must be between -90 and 90 degrees");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180)
            .WithMessage("Longitude must be between -180 and 180 degrees");

        RuleFor(x => x.PlayerSkillLevel)
            .Must(BeValidSkillLevel)
            .WithMessage("PlayerSkillLevel must be one of: beginner, intermediate, advanced, professional")
            .When(x => !string.IsNullOrEmpty(x.PlayerSkillLevel));
    }

    private static bool BeValidSkillLevel(string? skillLevel)
    {
        if (string.IsNullOrEmpty(skillLevel)) return true;

        var validSkillLevels = new[] { "beginner", "intermediate", "advanced", "professional" };
        return validSkillLevels.Contains(skillLevel.ToLower());
    }
}