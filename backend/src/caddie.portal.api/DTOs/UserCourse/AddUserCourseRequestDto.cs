using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.UserCourse;

public class AddUserCourseRequestDto
{
    [Required]
    [StringLength(255, MinimumLength = 2, ErrorMessage = "Course name must be between 2 and 255 characters")]
    public string CourseName { get; set; } = null!;
    
    [StringLength(500, ErrorMessage = "Address cannot exceed 500 characters")]
    public string? Address { get; set; }
    
    [StringLength(100, ErrorMessage = "City cannot exceed 100 characters")]
    public string? City { get; set; }
    
    [StringLength(100, ErrorMessage = "State cannot exceed 100 characters")]
    public string? State { get; set; }
    
    [StringLength(100, ErrorMessage = "Country cannot exceed 100 characters")]
    public string? Country { get; set; }
    
    [Required]
    [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90")]
    public decimal Latitude { get; set; }
    
    [Required]
    [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180")]
    public decimal Longitude { get; set; }
}