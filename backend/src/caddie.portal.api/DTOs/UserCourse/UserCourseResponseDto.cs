namespace caddie.portal.api.DTOs.UserCourse;

public class UserCourseResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public int TotalHoles { get; set; }
    public int ParTotal { get; set; }
    public bool CanPlay { get; set; }
    public double? DistanceKm { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<UserHoleResponseDto> Holes { get; set; } = new List<UserHoleResponseDto>();
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