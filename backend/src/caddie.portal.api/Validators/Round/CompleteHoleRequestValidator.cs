using FluentValidation;
using caddie.portal.api.DTOs.Round;

namespace caddie.portal.api.Validators.Round;

public class CompleteHoleRequestValidator : AbstractValidator<CompleteHoleRequestDto>
{
    public CompleteHoleRequestValidator()
    {
        RuleFor(x => x.HoleNumber)
            .NotEmpty()
            .WithMessage("Hole number is required")
            .InclusiveBetween(1, 18)
            .WithMessage("Hole number must be between 1 and 18");

        RuleFor(x => x.Score)
            .NotEmpty()
            .WithMessage("Score is required")
            .InclusiveBetween(1, 15)
            .WithMessage("Score must be between 1 and 15");

        RuleFor(x => x.Par)
            .InclusiveBetween(3, 5)
            .When(x => x.Par.HasValue)
            .WithMessage("Par must be between 3 and 5");

        RuleFor(x => x.HoleName)
            .MaximumLength(100)
            .WithMessage("Hole name cannot exceed 100 characters")
            .Matches(@"^[a-zA-Z0-9\s\-',.&()]*$")
            .When(x => !string.IsNullOrEmpty(x.HoleName))
            .WithMessage("Hole name contains invalid characters");

        RuleFor(x => x.HoleDescription)
            .MaximumLength(500)
            .WithMessage("Hole description cannot exceed 500 characters");

        // Custom validation: Score should be reasonable compared to par
        RuleFor(x => x)
            .Must(ValidateScoreVsPar)
            .When(x => x.Par.HasValue)
            .WithMessage("Score seems unrealistic compared to par (more than 10 strokes over par)")
            .WithName("ScoreVsPar");
    }

    private static bool ValidateScoreVsPar(CompleteHoleRequestDto request)
    {
        if (!request.Par.HasValue)
            return true;

        // Allow up to 10 strokes over par (reasonable for beginners)
        var strokesOverPar = request.Score - request.Par.Value;
        return strokesOverPar <= 10;
    }
}