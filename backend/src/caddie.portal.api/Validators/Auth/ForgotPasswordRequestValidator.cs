using FluentValidation;
using caddie.portal.api.DTOs.Auth;

namespace caddie.portal.api.Validators.Auth;

public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequestDto>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Email must be valid");
    }
}