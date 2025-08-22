using NetTopologySuite.Geometries;

namespace caddie.portal.services.Models;

/// <summary>
/// Service model for creating a new swing analysis
/// </summary>
public class CreateSwingAnalysisModel
{
    public int UserId { get; set; }
    public int RoundId { get; set; }
    public int? HoleId { get; set; }
    public int? GarminDeviceId { get; set; }
    public decimal? SwingSpeedMph { get; set; }
    public decimal? SwingAngleDegrees { get; set; }
    public decimal? BackswingAngleDegrees { get; set; }
    public decimal? FollowThroughAngleDegrees { get; set; }
    public string? RawSensorData { get; set; }
    public string DetectionSource { get; set; } = null!;
    public string? DeviceModel { get; set; }
    public decimal? DetectionConfidence { get; set; }
    public decimal? SwingQualityScore { get; set; }
    public string? AiFeedback { get; set; }
    public string? ComparedToTemplate { get; set; }
    public Point? ShotLocation { get; set; }
    public string? ClubUsed { get; set; }
    public int? DistanceToPinYards { get; set; }
    public DateTime? DetectedAt { get; set; }
}

/// <summary>
/// Service model for updating an existing swing analysis
/// </summary>
public class UpdateSwingAnalysisModel
{
    public decimal? SwingSpeedMph { get; set; }
    public decimal? SwingAngleDegrees { get; set; }
    public decimal? BackswingAngleDegrees { get; set; }
    public decimal? FollowThroughAngleDegrees { get; set; }
    public decimal? DetectionConfidence { get; set; }
    public decimal? SwingQualityScore { get; set; }
    public string? AiFeedback { get; set; }
    public string? ComparedToTemplate { get; set; }
    public string? ClubUsed { get; set; }
    public int? DistanceToPinYards { get; set; }
}

/// <summary>
/// Service model for swing analysis data
/// </summary>
public class SwingAnalysisModel
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int RoundId { get; set; }
    public int? HoleId { get; set; }
    public int? GarminDeviceId { get; set; }
    public decimal? SwingSpeedMph { get; set; }
    public decimal? SwingAngleDegrees { get; set; }
    public decimal? BackswingAngleDegrees { get; set; }
    public decimal? FollowThroughAngleDegrees { get; set; }
    public string? RawSensorData { get; set; }
    public string DetectionSource { get; set; } = null!;
    public string? DeviceModel { get; set; }
    public decimal? DetectionConfidence { get; set; }
    public decimal? SwingQualityScore { get; set; }
    public string? AiFeedback { get; set; }
    public string? ComparedToTemplate { get; set; }
    public Point? ShotLocation { get; set; }
    public string? ClubUsed { get; set; }
    public int? DistanceToPinYards { get; set; }
    public DateTime? DetectedAt { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Service model for swing analysis statistics
/// </summary>
public class SwingAnalysisStatsModel
{
    public int TotalSwings { get; set; }
    public decimal? AverageSwingSpeed { get; set; }
    public decimal? AverageQualityScore { get; set; }
    public int GarminSwings { get; set; }
    public int MobileSwings { get; set; }
    public DateTime? LastSwingDate { get; set; }
}

/// <summary>
/// Service model for round-specific swing analysis summary
/// </summary>
public class RoundSwingAnalysisSummaryModel
{
    public int RoundId { get; set; }
    public int TotalSwings { get; set; }
    public decimal? AverageSwingSpeed { get; set; }
    public decimal? BestSwingSpeed { get; set; }
    public decimal? AverageQualityScore { get; set; }
    public decimal? BestQualityScore { get; set; }
    public List<SwingAnalysisModel> Swings { get; set; } = new();
    public Dictionary<string, int> SwingsByClub { get; set; } = new();
    public Dictionary<string, int> SwingsByDetectionSource { get; set; } = new();
}