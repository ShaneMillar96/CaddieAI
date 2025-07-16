using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using NetTopologySuite.Geometries;
using caddie.portal.dal.Models.Common;
using caddie.portal.dal.Models.AI;

namespace caddie.portal.dal.Models.Courses;

[Table("holes")]
public class Hole : BaseEntity
{
    [Required]
    [ForeignKey("Course")]
    public Guid CourseId { get; set; }
    
    [Required]
    public int HoleNumber { get; set; }
    
    [StringLength(100)]
    public string? Name { get; set; }
    
    [Required]
    public int Par { get; set; }
    
    [Required]
    public HoleType HoleType { get; set; }
    
    public int? YardageBlack { get; set; }
    
    public int? YardageBlue { get; set; }
    
    public int? YardageWhite { get; set; }
    
    public int? YardageRed { get; set; }
    
    public int? StrokeIndex { get; set; }
    
    public int? LadiesYardage { get; set; }
    
    public int? LadiesPar { get; set; }
    
    public int? LadiesStrokeIndex { get; set; }
    
    [Column(TypeName = "geometry(Point, 4326)")]
    public Point? TeeLocation { get; set; }
    
    [Column(TypeName = "geometry(Point, 4326)")]
    public Point? PinLocation { get; set; }
    
    [Column(TypeName = "geometry(Polygon, 4326)")]
    public Polygon? HoleLayout { get; set; }
    
    [Column(TypeName = "geometry(LineString, 4326)")]
    public LineString? FairwayCenterLine { get; set; }
    
    public string? HoleDescription { get; set; }
    
    public string? HoleTips { get; set; }
    
    [Column(TypeName = "jsonb")]
    public JsonDocument? SimpleHazards { get; set; }
    
    public string? PlayingTips { get; set; }
    
    [Column(TypeName = "jsonb")]
    public JsonDocument? HoleMetadata { get; set; }

    // Navigation properties
    public virtual Course Course { get; set; } = null!;
    public virtual ICollection<ClubRecommendation> ClubRecommendations { get; set; } = new List<ClubRecommendation>();
}