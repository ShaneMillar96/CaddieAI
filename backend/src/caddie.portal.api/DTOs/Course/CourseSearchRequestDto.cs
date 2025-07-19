using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.Course;

public class CourseSearchRequestDto
{
    public string? SearchTerm { get; set; }

    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 10;
}

public class NearbyCourseSearchRequestDto
{
    [Required]
    [Range(-90.0, 90.0)]
    public double Latitude { get; set; }

    [Required]
    [Range(-180.0, 180.0)]
    public double Longitude { get; set; }

    [Required]
    [Range(0.1, 100.0)]
    public double RadiusKm { get; set; } = 10.0;
}

public class RegionCourseSearchRequestDto
{
    [Required]
    [StringLength(100)]
    public string Region { get; set; } = string.Empty;
}

public class CourseNameAvailabilityRequestDto
{
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;
}

public class LocationWithinCourseRequestDto
{
    [Required]
    [Range(-90.0, 90.0)]
    public double Latitude { get; set; }

    [Required]
    [Range(-180.0, 180.0)]
    public double Longitude { get; set; }
}

public class DistanceToCourseRequestDto
{
    [Required]
    [Range(-90.0, 90.0)]
    public double Latitude { get; set; }

    [Required]
    [Range(-180.0, 180.0)]
    public double Longitude { get; set; }
}