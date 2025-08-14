using FluentValidation;
using caddie.portal.api.DTOs.UserCourse;

namespace caddie.portal.api.Validators.UserCourse;

public class AddUserCourseRequestValidator : AbstractValidator<AddUserCourseRequestDto>
{
    public AddUserCourseRequestValidator()
    {
        RuleFor(x => x.CourseName)
            .NotEmpty()
            .WithMessage("Course name is required")
            .Length(2, 255)
            .WithMessage("Course name must be between 2 and 255 characters")
            .Matches(@"^[a-zA-Z0-9\s\-',.&()]+$")
            .WithMessage("Course name contains invalid characters");

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
            .MaximumLength(500)
            .WithMessage("Address cannot exceed 500 characters");

        RuleFor(x => x.City)
            .MaximumLength(100)
            .WithMessage("City cannot exceed 100 characters");

        RuleFor(x => x.Country)
            .MaximumLength(100)
            .WithMessage("Country cannot exceed 100 characters")
            .Matches(@"^[a-zA-Z\s\-']*$")
            .WithMessage("Country name contains invalid characters")
            .When(x => !string.IsNullOrEmpty(x.Country));

        // Validate coordinate precision (not too precise for real locations)
        RuleFor(x => x)
            .Must(ValidateCoordinatePrecision)
            .WithMessage("Coordinates appear to have unrealistic precision")
            .WithName("CoordinatePrecision");
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