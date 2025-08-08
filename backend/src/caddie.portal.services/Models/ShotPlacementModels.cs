namespace caddie.portal.services.Models;

/// <summary>
/// Model for shot placement data
/// </summary>
public class ShotPlacementModel
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

    /// <summary>
    /// Related round information (when included)
    /// </summary>
    public RoundModel? Round { get; set; }

    /// <summary>
    /// Related hole information (when included)
    /// </summary>
    public HoleModel? Hole { get; set; }
}

/// <summary>
/// Model for creating a new shot placement
/// </summary>
public class CreateShotPlacementModel
{
    /// <summary>
    /// User ID creating the shot placement
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
    /// Additional metadata as JSON
    /// </summary>
    public string? Metadata { get; set; }
}

/// <summary>
/// Model for updating shot placement progress
/// </summary>
public class UpdateShotProgressModel
{
    /// <summary>
    /// Whether the shot was completed
    /// </summary>
    public bool IsCompleted { get; set; }

    /// <summary>
    /// Timestamp when shot was completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Actual shot outcome coordinates
    /// </summary>
    public double? ActualLatitude { get; set; }
    public double? ActualLongitude { get; set; }

    /// <summary>
    /// Club actually used
    /// </summary>
    public string? ClubUsed { get; set; }

    /// <summary>
    /// Additional notes or feedback
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Additional metadata updates
    /// </summary>
    public string? Metadata { get; set; }
}

/// <summary>
/// Model for shot placement statistics
/// </summary>
public class ShotPlacementStatsModel
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
/// Model for hole yardage information
/// </summary>
public class HoleYardageModel
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
    public CoordinateModel? PinLocation { get; set; }
    public CoordinateModel? TeeLocation { get; set; }
}

/// <summary>
/// Model for geographic coordinates
/// </summary>
public class CoordinateModel
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