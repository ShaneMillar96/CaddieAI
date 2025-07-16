using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;
using caddie.portal.dal.Models.Common;
using caddie.portal.dal.Models.Users;
using caddie.portal.dal.Models.Courses;
using caddie.portal.dal.Models.AI;

namespace caddie.portal.dal.Models.Rounds;

[Table("locations")]
public class Location : BaseEntity
{
    [Required]
    [ForeignKey("User")]
    public Guid UserId { get; set; }
    
    [ForeignKey("Round")]
    public Guid? RoundId { get; set; }
    
    [ForeignKey("Course")]
    public Guid? CourseId { get; set; }
    
    [Required]
    [Column(TypeName = "decimal(10,7)")]
    public decimal Latitude { get; set; }
    
    [Required]
    [Column(TypeName = "decimal(10,7)")]
    public decimal Longitude { get; set; }
    
    [Column(TypeName = "decimal(6,2)")]
    public decimal? AltitudeMeters { get; set; }
    
    [Column(TypeName = "decimal(6,2)")]
    public decimal? AccuracyMeters { get; set; }
    
    [Column(TypeName = "decimal(5,2)")]
    public decimal? HeadingDegrees { get; set; }
    
    [Column(TypeName = "decimal(5,2)")]
    public decimal? SpeedMps { get; set; }
    
    public int? CurrentHoleDetected { get; set; }
    
    [Column(TypeName = "decimal(6,2)")]
    public decimal? DistanceToTeeMeters { get; set; }
    
    [Column(TypeName = "decimal(6,2)")]
    public decimal? DistanceToPinMeters { get; set; }
    
    [StringLength(20)]
    public string? PositionOnHole { get; set; }
    
    [Column(TypeName = "decimal(4,2)")]
    public decimal? MovementSpeedMps { get; set; }
    
    public bool CourseBoundaryStatus { get; set; } = false;
    
    [Column(TypeName = "geometry(Point, 4326)")]
    public Point? LastShotLocation { get; set; }
    
    [Required]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Round? Round { get; set; }
    public virtual Course? Course { get; set; }
    public virtual ICollection<ClubRecommendation> ClubRecommendations { get; set; } = new List<ClubRecommendation>();
}