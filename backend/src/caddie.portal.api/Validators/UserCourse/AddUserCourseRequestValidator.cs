using FluentValidation;
using caddie.portal.api.DTOs.UserCourse;

namespace caddie.portal.api.Validators.UserCourse;

public class AddUserCourseRequestValidator : AbstractValidator<AddUserCourseRequestDto>
{
    public AddUserCourseRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Course name is required")
            .Length(2, 200)
            .WithMessage("Course name must be between 2 and 200 characters")
            .Matches(@"^[a-zA-Z0-9\s\-',.&()]+$")
            .WithMessage("Course name contains invalid characters");

        RuleFor(x => x.Description)
            .MaximumLength(500)
            .WithMessage("Description cannot exceed 500 characters");

        RuleFor(x => x.Latitude)
            .NotEmpty()
            .WithMessage("Latitude is required")
            .InclusiveBetween(-90, 90)
            .WithMessage("Latitude must be between -90 and 90 degrees");

        RuleFor(x => x.Longitude)
            .NotEmpty()
            .WithMessage("Longitude is required")
            .InclusiveBetween(-180, 180)
            .WithMessage("Longitude must be between -180 and 180 degrees");

        RuleFor(x => x.Address)
            .MaximumLength(300)
            .WithMessage("Address cannot exceed 300 characters");

        RuleFor(x => x.City)
            .MaximumLength(100)
            .WithMessage("City cannot exceed 100 characters");

        RuleFor(x => x.Country)
            .NotEmpty()
            .WithMessage("Country is required")
            .Length(2, 100)
            .WithMessage("Country must be between 2 and 100 characters")
            .Matches(@"^[a-zA-Z\s\-']+$")
            .WithMessage("Country name contains invalid characters");

        RuleFor(x => x.TotalHoles)
            .InclusiveBetween(9, 36)
            .WithMessage("Total holes must be between 9 and 36");

        RuleFor(x => x.ParTotal)
            .InclusiveBetween(54, 108)
            .WithMessage("Par total must be between 54 and 108");

        // Custom validation: Par should be reasonable for the number of holes
        RuleFor(x => x)
            .Must(ValidateParToHoleRatio)
            .WithMessage("Par total seems unrealistic for the number of holes specified")
            .WithName("ParToHoleRatio");

        // Validate coordinate precision (not too precise for real locations)
        RuleFor(x => x)
            .Must(ValidateCoordinatePrecision)
            .WithMessage("Coordinates appear to have unrealistic precision")
            .WithName("CoordinatePrecision");
    }

    private static bool ValidateParToHoleRatio(AddUserCourseRequestDto request)
    {
        // Basic validation: Par per hole should be between 3-5 on average
        var averageParPerHole = (double)request.ParTotal / request.TotalHoles;
        return averageParPerHole >= 3.0 && averageParPerHole <= 5.0;
    }

    private static bool ValidateCoordinatePrecision(AddUserCourseRequestDto request)
    {
        // Coordinates with more than 6 decimal places are unrealistically precise
        var latString = request.Latitude.ToString("F10");
        var lonString = request.Longitude.ToString("F10");
        
        var latDecimals = latString.Contains('.') ? latString.Split('.')[1].TrimEnd('0').Length : 0;
        var lonDecimals = lonString.Contains('.') ? lonString.Split('.')[1].TrimEnd('0').Length : 0;
        
        return latDecimals <= 8 && lonDecimals <= 8; // Allow up to 8 decimal places (about 1mm precision)
    }
}