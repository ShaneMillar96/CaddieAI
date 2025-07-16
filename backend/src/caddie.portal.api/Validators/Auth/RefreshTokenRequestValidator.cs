using FluentValidation;
using caddie.portal.api.DTOs.Auth;

namespace caddie.portal.api.Validators.Auth;

public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequestDto>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required");
    }
}