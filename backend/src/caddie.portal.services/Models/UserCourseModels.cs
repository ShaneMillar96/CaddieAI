using System.ComponentModel.DataAnnotations;

namespace caddie.portal.services.Models;

public class UserCourseModel
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool CanPlay { get; set; }
    public double? DistanceKm { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<UserHoleModel> Holes { get; set; } = new List<UserHoleModel>();
}

public class UserHoleModel
{
    public int Id { get; set; }
    public int HoleNumber { get; set; }
    public int? Par { get; set; }
}

public class AddUserCourseModel
{
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = null!;
    
    [Required]
    [Range(-90, 90)]
    public double Latitude { get; set; }
    
    [Required]
    [Range(-180, 180)]
    public double Longitude { get; set; }
}

public class UserCourseProximityModel
{
    public int CourseId { get; set; }
    public string CourseName { get; set; } = null!;
    public bool IsWithinProximity { get; set; }
    public double DistanceMeters { get; set; }
    public double DistanceKm => DistanceMeters / 1000.0;
}

public class CompleteHoleModel
{
    [Required]
    [Range(1, 18)]
    public int HoleNumber { get; set; }
    
    [Required]
    [Range(1, 15)]
    public int Score { get; set; }
    
    [Range(3, 5)]
    public int? Par { get; set; } // Only required for first-time hole completion
    
    [StringLength(100)]
    public string? HoleName { get; set; }
    
    [StringLength(500)]
    public string? HoleDescription { get; set; }
}