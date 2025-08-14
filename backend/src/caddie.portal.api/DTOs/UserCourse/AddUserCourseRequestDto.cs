using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.UserCourse;

public class AddUserCourseRequestDto
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Name { get; set; } = null!;
    
    [StringLength(500)]
    public string? Description { get; set; }
    
    [Required]
    [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90")]
    public double Latitude { get; set; }
    
    [Required]
    [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180")]
    public double Longitude { get; set; }
    
    [StringLength(300)]
    public string? Address { get; set; }
    
    [StringLength(100)]
    public string? City { get; set; }
    
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Country { get; set; } = null!;
    
    [Range(9, 36, ErrorMessage = "Total holes must be between 9 and 36")]
    public int TotalHoles { get; set; } = 18;
    
    [Range(54, 108, ErrorMessage = "Par total must be between 54 and 108")]
    public int ParTotal { get; set; } = 72;
}