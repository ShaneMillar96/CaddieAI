using caddie.portal.dal.Models;

namespace caddie.portal.services.Models;

public class CourseModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string Country { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? Email { get; set; }
    public int TotalHoles { get; set; }
    public int ParTotal { get; set; }
    public int? SlopeRating { get; set; }
    public decimal? CourseRating { get; set; }
    public int? YardageTotal { get; set; }
    public string? GreenFeeRange { get; set; }
    public string? Timezone { get; set; }
    public bool? IsActive { get; set; }
    public Dictionary<string, object>? Amenities { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public List<HoleModel> Holes { get; set; } = new();
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class HoleModel
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public int HoleNumber { get; set; }
    public int UserId { get; set; }
    public string? Name { get; set; }
    public int? Par { get; set; }
    public int? YardageBlack { get; set; }
    public int? YardageBlue { get; set; }
    public int? YardageWhite { get; set; }
    public int? YardageRed { get; set; }
    public int? StrokeIndex { get; set; }
    public int? LadiesYardage { get; set; }
    public int? LadiesPar { get; set; }
    public int? LadiesStrokeIndex { get; set; }
    
    // PostGIS geometry fields
    public NetTopologySuite.Geometries.Point? TeeLocation { get; set; }
    public NetTopologySuite.Geometries.Point? PinLocation { get; set; }
    
    public string? HoleDescription { get; set; }
    public string? HoleTips { get; set; }
    public string? PlayingTips { get; set; }
    public string? SimpleHazards { get; set; }
    public string? HoleMetadata { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Legacy properties for backward compatibility
    public int? YardageMen { get; set; }
    public int? YardageWomen { get; set; }
    public int? Handicap { get; set; }
    public string? Description { get; set; }
}

public class CreateCourseModel
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string Country { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? Email { get; set; }
    public int TotalHoles { get; set; }
    public int ParTotal { get; set; }
    public int? SlopeRating { get; set; }
    public decimal? CourseRating { get; set; }
    public int? YardageTotal { get; set; }
    public string? GreenFeeRange { get; set; }
    public string? Timezone { get; set; }
    public bool IsActive { get; set; } = true;
    public Dictionary<string, object>? Amenities { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public List<CreateHoleModel> Holes { get; set; } = new();
}

public class CreateHoleModel
{
    public int CourseId { get; set; }
    public int UserId { get; set; }
    public int HoleNumber { get; set; }
    public int? Par { get; set; }
    public string? Name { get; set; }
    public string? HoleDescription { get; set; }
    public int? YardageMen { get; set; }
    public int? YardageWomen { get; set; }
    public int? Handicap { get; set; }
    public string? Description { get; set; }
}

public class UpdateHoleModel
{
    public int? Par { get; set; }
    public string? Name { get; set; }
    public string? HoleDescription { get; set; }
    public int? YardageBlack { get; set; }
    public int? YardageBlue { get; set; }
    public int? YardageWhite { get; set; }
    public int? YardageRed { get; set; }
    public int? StrokeIndex { get; set; }
}

public class UpdateCourseModel
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string Country { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? Email { get; set; }
    public int TotalHoles { get; set; }
    public int ParTotal { get; set; }
    public int? SlopeRating { get; set; }
    public decimal? CourseRating { get; set; }
    public int? YardageTotal { get; set; }
    public string? GreenFeeRange { get; set; }
    public string? Timezone { get; set; }
    public bool IsActive { get; set; }
    public Dictionary<string, object>? Amenities { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class PaginatedResult<T>
{
    public IEnumerable<T> Data { get; set; } = new List<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}