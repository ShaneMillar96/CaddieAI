namespace caddie.portal.api.DTOs.UserCourse;

public class UserCourseResponseDto
{
    public int Id { get; set; }
    public string CourseName { get; set; } = null!;
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool CanPlay { get; set; }
    public double? DistanceKm { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class UserHoleResponseDto
{
    public int Id { get; set; }
    public int HoleNumber { get; set; }
    public int Par { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
}

public class UserCourseProximityResponseDto
{
    public int CourseId { get; set; }
    public string CourseName { get; set; } = null!;
    public bool IsWithinProximity { get; set; }
    public double DistanceMeters { get; set; }
    public double DistanceKm { get; set; }
}