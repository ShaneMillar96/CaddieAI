using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.Course;

public class UpdateCourseRequestDto
{
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [StringLength(500)]
    public string? Address { get; set; }

    [StringLength(100)]
    public string? City { get; set; }

    [StringLength(100)]
    public string? State { get; set; }

    [Required]
    [StringLength(100)]
    public string Country { get; set; } = string.Empty;

    [StringLength(20)]
    public string? Phone { get; set; }

    [StringLength(200)]
    public string? Website { get; set; }

    [StringLength(100)]
    [EmailAddress]
    public string? Email { get; set; }

    [Required]
    [Range(9, 27)]
    public int TotalHoles { get; set; }

    [Required]
    [Range(54, 90)]
    public int ParTotal { get; set; }

    [Range(55, 155)]
    public int? SlopeRating { get; set; }

    [Range(50.0, 80.0)]
    public decimal? CourseRating { get; set; }

    [Range(3000, 8000)]
    public int? YardageTotal { get; set; }

    [StringLength(200)]
    public string? GreenFeeRange { get; set; }

    [StringLength(50)]
    public string? Timezone { get; set; }

    public bool IsActive { get; set; }

    public Dictionary<string, object>? Amenities { get; set; }

    [Required]
    [Range(-90.0, 90.0)]
    public double Latitude { get; set; }

    [Required]
    [Range(-180.0, 180.0)]
    public double Longitude { get; set; }
}