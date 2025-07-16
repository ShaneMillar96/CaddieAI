using FluentValidation;
using caddie.portal.api.DTOs.Auth;

namespace caddie.portal.api.Validators.Auth;

public class VerifyEmailRequestValidator : AbstractValidator<VerifyEmailRequestDto>
{
    public VerifyEmailRequestValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Verification token is required");
    }
}