using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.Round;

public class CompleteHoleRequestDto
{
    [Required]
    [Range(1, 18, ErrorMessage = "Hole number must be between 1 and 18")]
    public int HoleNumber { get; set; }
    
    [Required]
    [Range(1, 15, ErrorMessage = "Score must be between 1 and 15")]
    public int Score { get; set; }
    
    [Range(3, 5, ErrorMessage = "Par must be between 3 and 5")]
    public int? Par { get; set; } // Required for first-time hole completion
    
    [StringLength(100)]
    public string? HoleName { get; set; }
    
    [StringLength(500)]
    public string? HoleDescription { get; set; }
}