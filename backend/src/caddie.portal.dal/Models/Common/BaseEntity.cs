using System.ComponentModel.DataAnnotations;

namespace caddie.portal.dal.Models.Common;

public abstract class BaseEntity
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}