using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using NetTopologySuite.Geometries;
using caddie.portal.dal.Models.Common;
using caddie.portal.dal.Models.Rounds;
using caddie.portal.dal.Models.AI;

namespace caddie.portal.dal.Models.Courses;

[Table("courses")]
public class Course : BaseEntity
{
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    public string? Address { get; set; }
    
    [StringLength(100)]
    public string? City { get; set; }
    
    [StringLength(50)]
    public string? State { get; set; }
    
    [Required]
    [StringLength(100)]
    public string Country { get; set; } = string.Empty;
    
    [StringLength(20)]
    public string? Phone { get; set; }
    
    [StringLength(255)]
    public string? Website { get; set; }
    
    [StringLength(255)]
    public string? Email { get; set; }
    
    [Required]
    public int ParTotal { get; set; }
    
    [Required]
    public int TotalHoles { get; set; } = 18;
    
    public int? YardageTotal { get; set; }
    
    [Column(TypeName = "decimal(3,1)")]
    public decimal? CourseRating { get; set; }
    
    public int? SlopeRating { get; set; }
    
    [Required]
    public CourseDifficulty Difficulty { get; set; } = CourseDifficulty.Moderate;
    
    [Column(TypeName = "geometry(Point, 4326)")]
    public Point? Location { get; set; }
    
    [Column(TypeName = "geometry(Polygon, 4326)")]
    public Polygon? Boundary { get; set; }
    
    [Required]
    [StringLength(50)]
    public string Timezone { get; set; } = "UTC";
    
    [Column(TypeName = "jsonb")]
    public JsonDocument? GreenFeeRange { get; set; }
    
    [Column(TypeName = "jsonb")]
    public JsonDocument? Amenities { get; set; }
    
    [Column(TypeName = "jsonb")]
    public JsonDocument? CourseMetadata { get; set; }
    
    [Required]
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual ICollection<Hole> Holes { get; set; } = new List<Hole>();
    public virtual ICollection<Round> Rounds { get; set; } = new List<Round>();
    public virtual ICollection<ChatSession> ChatSessions { get; set; } = new List<ChatSession>();
    public virtual ICollection<caddie.portal.dal.Models.Rounds.Location> Locations { get; set; } = new List<caddie.portal.dal.Models.Rounds.Location>();
}