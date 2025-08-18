using FluentValidation;
using caddie.portal.api.DTOs.Round;

namespace caddie.portal.api.Validators.Round;

/// <summary>
/// Validator for QuickScoreUpdateRequestDto
/// </summary>
public class QuickScoreUpdateRequestValidator : AbstractValidator<QuickScoreUpdateRequestDto>
{
    public QuickScoreUpdateRequestValidator()
    {
        RuleFor(x => x.Score)
            .NotEmpty()
            .WithMessage("Score is required")
            .InclusiveBetween(1, 15)
            .WithMessage("Score must be between 1 and 15");
    }
}