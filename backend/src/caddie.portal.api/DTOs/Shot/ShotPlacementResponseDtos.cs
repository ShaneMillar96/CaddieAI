namespace caddie.portal.api.DTOs.Shot;

/// <summary>
/// Response DTO for shot placement data
/// </summary>
public class ShotPlacementResponseDto
{
    /// <summary>
    /// Shot placement ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// User ID who created the shot placement
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Round ID this shot belongs to
    /// </summary>
    public int RoundId { get; set; }

    /// <summary>
    /// Hole ID (optional for practice shots)
    /// </summary>
    public int? HoleId { get; set; }

    /// <summary>
    /// Shot placement coordinates
    /// </summary>
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    /// <summary>
    /// GPS accuracy in meters
    /// </summary>
    public double? Accuracy { get; set; }

    /// <summary>
    /// Distance to pin in yards
    /// </summary>
    public int? DistanceToPin { get; set; }

    /// <summary>
    /// Distance from current location in yards
    /// </summary>
    public int? DistanceFromCurrent { get; set; }

    /// <summary>
    /// AI-generated club recommendation
    /// </summary>
    public string? ClubRecommendation { get; set; }

    /// <summary>
    /// Whether the shot has been completed
    /// </summary>
    public bool IsCompleted { get; set; }

    /// <summary>
    /// When the shot was completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Actual shot outcome coordinates
    /// </summary>
    public double? ActualLatitude { get; set; }
    public double? ActualLongitude { get; set; }

    /// <summary>
    /// Club actually used for the shot
    /// </summary>
    public string? ClubUsed { get; set; }

    /// <summary>
    /// Additional notes or feedback
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Additional metadata stored as JSON
    /// </summary>
    public string? Metadata { get; set; }

    /// <summary>
    /// Creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Last update timestamp
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Response DTO for shot placement statistics
/// </summary>
public class ShotPlacementStatsResponseDto
{
    /// <summary>
    /// User ID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Total number of shot placements
    /// </summary>
    public int TotalShots { get; set; }

    /// <summary>
    /// Number of completed shots
    /// </summary>
    public int CompletedShots { get; set; }

    /// <summary>
    /// Average distance to pin
    /// </summary>
    public double? AverageDistanceToPin { get; set; }

    /// <summary>
    /// Most common club recommendation
    /// </summary>
    public string? MostCommonClub { get; set; }

    /// <summary>
    /// Date range for statistics
    /// </summary>
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }

    /// <summary>
    /// Accuracy statistics
    /// </summary>
    public double? AverageAccuracy { get; set; }

    /// <summary>
    /// Shot accuracy percentage (shots within reasonable distance of target)
    /// </summary>
    public double? ShotAccuracyPercentage { get; set; }
}

/// <summary>
/// Response DTO for hole yardage information
/// </summary>
public class HoleYardageResponseDto
{
    /// <summary>
    /// Hole ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Hole number
    /// </summary>
    public int HoleNumber { get; set; }

    /// <summary>
    /// Par for the hole
    /// </summary>
    public int Par { get; set; }

    /// <summary>
    /// Yardages from different tees
    /// </summary>
    public int? YardageBlack { get; set; }
    public int? YardageBlue { get; set; }
    public int? YardageWhite { get; set; }
    public int? YardageRed { get; set; }
    public int? LadiesYardage { get; set; }

    /// <summary>
    /// Pin and tee coordinates for distance calculations
    /// </summary>
    public CoordinateDto? PinLocation { get; set; }
    public CoordinateDto? TeeLocation { get; set; }
}

/// <summary>
/// Response DTO for hole information
/// </summary>
public class HoleResponseDto
{
    /// <summary>
    /// Hole ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Course ID this hole belongs to
    /// </summary>
    public int CourseId { get; set; }

    /// <summary>
    /// Hole number (1-18)
    /// </summary>
    public int HoleNumber { get; set; }

    /// <summary>
    /// Hole name
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// Par for the hole
    /// </summary>
    public int Par { get; set; }

    /// <summary>
    /// Yardages from different tees
    /// </summary>
    public int? YardageBlack { get; set; }
    public int? YardageBlue { get; set; }
    public int? YardageWhite { get; set; }
    public int? YardageRed { get; set; }

    /// <summary>
    /// Stroke index for handicap calculations
    /// </summary>
    public int? StrokeIndex { get; set; }

    /// <summary>
    /// Ladies tee information
    /// </summary>
    public int? LadiesYardage { get; set; }
    public int? LadiesPar { get; set; }
    public int? LadiesStrokeIndex { get; set; }

    /// <summary>
    /// Pin and tee coordinates
    /// </summary>
    public CoordinateDto? PinLocation { get; set; }
    public CoordinateDto? TeeLocation { get; set; }

    /// <summary>
    /// Hole description and tips
    /// </summary>
    public string? HoleDescription { get; set; }
    public string? HoleTips { get; set; }
    public string? PlayingTips { get; set; }

    /// <summary>
    /// Simplified hazard information
    /// </summary>
    public string? SimpleHazards { get; set; }

    /// <summary>
    /// Additional metadata
    /// </summary>
    public string? HoleMetadata { get; set; }

    /// <summary>
    /// Timestamps
    /// </summary>
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// DTO for geographic coordinates
/// </summary>
public class CoordinateDto
{
    /// <summary>
    /// Latitude coordinate
    /// </summary>
    public double Latitude { get; set; }

    /// <summary>
    /// Longitude coordinate
    /// </summary>
    public double Longitude { get; set; }
}