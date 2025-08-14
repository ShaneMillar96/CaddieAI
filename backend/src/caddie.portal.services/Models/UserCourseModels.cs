using System.ComponentModel.DataAnnotations;

namespace caddie.portal.services.Models;

public class UserCourseModel
{
    public int Id { get; set; }
    public int CourseId { get; set; }
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

public class UserHoleModel
{
    public int Id { get; set; }
    public int HoleNumber { get; set; }
    public int? Par { get; set; }
}

public class AddUserCourseModel
{
    // Option 1: Add course by providing course data (creates course if it doesn't exist)
    [StringLength(255)]
    public string? CourseName { get; set; }
    
    [StringLength(500)]
    public string? Address { get; set; }
    
    [StringLength(100)]
    public string? City { get; set; }
    
    [StringLength(100)]
    public string? State { get; set; }
    
    [StringLength(100)]
    public string? Country { get; set; }
    
    [Range(-90, 90)]
    public decimal? Latitude { get; set; }
    
    [Range(-180, 180)]
    public decimal? Longitude { get; set; }
    
    // Option 2: Add existing course by ID
    public int? CourseId { get; set; }
    
    // Validation logic should ensure either (CourseName + coordinates) or CourseId is provided
}

public class UserCourseProximityModel
{
    public int UserCourseId { get; set; }
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