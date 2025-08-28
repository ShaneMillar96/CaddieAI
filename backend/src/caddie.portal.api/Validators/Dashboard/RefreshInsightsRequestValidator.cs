using FluentValidation;
using caddie.portal.api.DTOs.Dashboard;

namespace caddie.portal.api.Validators.Dashboard;

/// <summary>
/// Validator for refresh insights requests
/// </summary>
public class RefreshInsightsRequestValidator : AbstractValidator<RefreshInsightsRequestDto>
{
    public RefreshInsightsRequestValidator()
    {
        // ForceRefresh is optional and can be true/false, no validation needed
        // This validator exists for consistency and future extensibility
        
        RuleFor(x => x.ForceRefresh)
            .NotNull()
            .WithMessage("ForceRefresh flag must be specified");
    }
}