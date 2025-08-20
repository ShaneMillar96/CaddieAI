using System.ComponentModel.DataAnnotations;
using caddie.portal.services.Interfaces;

namespace caddie.portal.services.Models;

/// <summary>
/// Context for shot type detection
/// </summary>
public class ShotTypeContext
{
    /// <summary>
    /// Current player location
    /// </summary>
    public LocationContext CurrentLocation { get; set; } = new();

    /// <summary>
    /// Target location (if selected)
    /// </summary>
    public LocationContext? TargetLocation { get; set; }

    /// <summary>
    /// Current hole number
    /// </summary>
    [Range(1, 18)]
    public int CurrentHole { get; set; }

    /// <summary>
    /// Comprehensive golf context
    /// </summary>
    public GolfContext GolfContext { get; set; } = new();

    /// <summary>
    /// Additional shot context information
    /// </summary>
    public ShotContext? ShotContext { get; set; }

    /// <summary>
    /// Shot placement history for current hole
    /// </summary>
    public List<ShotPlacementHistory>? ShotHistory { get; set; }
}

/// <summary>
/// Shot context information
/// </summary>
public class ShotContext
{
    /// <summary>
    /// Position on hole (tee, fairway, rough, etc.)
    /// </summary>
    public string? Position { get; set; }

    /// <summary>
    /// Lie quality (good, average, poor)
    /// </summary>
    public string? LieQuality { get; set; }

    /// <summary>
    /// Slope information (uphill, downhill, sidehill)
    /// </summary>
    public string? Slope { get; set; }

    /// <summary>
    /// Hazards near target area
    /// </summary>
    public List<string>? Hazards { get; set; }

    /// <summary>
    /// Shot intention (aggressive, conservative, normal)
    /// </summary>
    public string? Intention { get; set; }

    /// <summary>
    /// Distance to pin in yards
    /// </summary>
    public decimal? DistanceToPinYards { get; set; }

    /// <summary>
    /// Weather conditions affecting shot
    /// </summary>
    public WeatherContext? Weather { get; set; }
}

/// <summary>
/// Result of shot type detection
/// </summary>
public class ShotTypeDetectionResult
{
    /// <summary>
    /// Detected shot type
    /// </summary>
    public string ShotType { get; set; } = string.Empty;

    /// <summary>
    /// Detection confidence (0.0 - 1.0)
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal Confidence { get; set; }

    /// <summary>
    /// Reasoning for shot type classification
    /// </summary>
    public string Reasoning { get; set; } = string.Empty;

    /// <summary>
    /// Alternative shot types considered
    /// </summary>
    public List<AlternativeShotType> Alternatives { get; set; } = new();

    /// <summary>
    /// Position analysis result
    /// </summary>
    public PositionAnalysis? PositionAnalysis { get; set; }

    /// <summary>
    /// Distance-based factors
    /// </summary>
    public DistanceFactors? DistanceFactors { get; set; }

    /// <summary>
    /// Context factors that influenced detection
    /// </summary>
    public List<string> InfluencingFactors { get; set; } = new();

    /// <summary>
    /// Detection timestamp
    /// </summary>
    public DateTime DetectedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Alternative shot type with probability
/// </summary>
public class AlternativeShotType
{
    /// <summary>
    /// Shot type name
    /// </summary>
    public string ShotType { get; set; } = string.Empty;

    /// <summary>
    /// Probability of this being the correct shot type
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal Probability { get; set; }

    /// <summary>
    /// Reason for consideration
    /// </summary>
    public string? Reason { get; set; }
}

/// <summary>
/// Position analysis on the hole
/// </summary>
public class PositionAnalysis
{
    /// <summary>
    /// Primary position (tee, fairway, rough, bunker, green, etc.)
    /// </summary>
    public string Position { get; set; } = string.Empty;

    /// <summary>
    /// Position confidence (0.0 - 1.0)
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal Confidence { get; set; }

    /// <summary>
    /// Distance from ideal position
    /// </summary>
    public decimal? DistanceFromIdealYards { get; set; }

    /// <summary>
    /// Lie characteristics
    /// </summary>
    public LieCharacteristics? LieInfo { get; set; }

    /// <summary>
    /// Strategic position assessment
    /// </summary>
    public string? StrategicAssessment { get; set; }

    /// <summary>
    /// Nearby hazards or features
    /// </summary>
    public List<string>? NearbyFeatures { get; set; }
}

/// <summary>
/// Lie characteristics
/// </summary>
public class LieCharacteristics
{
    /// <summary>
    /// Lie quality (excellent, good, fair, poor, terrible)
    /// </summary>
    public string Quality { get; set; } = "fair";

    /// <summary>
    /// Surface type (grass, sand, dirt, etc.)
    /// </summary>
    public string? Surface { get; set; }

    /// <summary>
    /// Slope direction and severity
    /// </summary>
    public string? Slope { get; set; }

    /// <summary>
    /// Grass length or condition
    /// </summary>
    public string? GrassCondition { get; set; }

    /// <summary>
    /// Any obstructions
    /// </summary>
    public List<string>? Obstructions { get; set; }
}

/// <summary>
/// Distance-based factors for shot type detection
/// </summary>
public class DistanceFactors
{
    /// <summary>
    /// Distance to pin in yards
    /// </summary>
    public decimal DistanceToPinYards { get; set; }

    /// <summary>
    /// Distance from tee in yards
    /// </summary>
    public decimal? DistanceFromTeeYards { get; set; }

    /// <summary>
    /// Carry distance needed
    /// </summary>
    public decimal? CarryDistanceYards { get; set; }

    /// <summary>
    /// Distance to hazards
    /// </summary>
    public Dictionary<string, decimal>? HazardDistances { get; set; }

    /// <summary>
    /// Effective playing distance (adjusted for conditions)
    /// </summary>
    public decimal? EffectiveDistanceYards { get; set; }

    /// <summary>
    /// Elevation change effect on distance
    /// </summary>
    public decimal? ElevationAdjustmentYards { get; set; }
}

/// <summary>
/// Shot difficulty assessment
/// </summary>
public class ShotDifficultyAssessment
{
    /// <summary>
    /// Overall difficulty level (1-10 scale)
    /// </summary>
    [Range(1, 10)]
    public int DifficultyLevel { get; set; }

    /// <summary>
    /// Difficulty category (easy, moderate, challenging, very_difficult)
    /// </summary>
    public string DifficultyCategory { get; set; } = "moderate";

    /// <summary>
    /// Skill level appropriateness
    /// </summary>
    public string SkillLevelMatch { get; set; } = "appropriate";

    /// <summary>
    /// Key difficulty factors
    /// </summary>
    public List<DifficultyFactor> DifficultyFactors { get; set; } = new();

    /// <summary>
    /// Success probability for user's skill level
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal SuccessProbability { get; set; }

    /// <summary>
    /// Risk assessment
    /// </summary>
    public RiskAssessment? RiskAssessment { get; set; }
}

/// <summary>
/// Individual difficulty factor
/// </summary>
public class DifficultyFactor
{
    /// <summary>
    /// Factor name (distance, hazards, wind, etc.)
    /// </summary>
    public string Factor { get; set; } = string.Empty;

    /// <summary>
    /// Factor severity (1-5 scale)
    /// </summary>
    [Range(1, 5)]
    public int Severity { get; set; }

    /// <summary>
    /// Description of factor impact
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Mitigation strategies
    /// </summary>
    public List<string>? Mitigation { get; set; }
}

/// <summary>
/// Risk assessment for shot
/// </summary>
public class RiskAssessment
{
    /// <summary>
    /// Overall risk level (low, moderate, high, very_high)
    /// </summary>
    public string RiskLevel { get; set; } = "moderate";

    /// <summary>
    /// Potential penalties
    /// </summary>
    public List<string>? PotentialPenalties { get; set; }

    /// <summary>
    /// Risk mitigation advice
    /// </summary>
    public List<string>? MitigationAdvice { get; set; }

    /// <summary>
    /// Conservative alternative suggestions
    /// </summary>
    public List<string>? ConservativeAlternatives { get; set; }
}

/// <summary>
/// Shot placement history item
/// </summary>
public class ShotPlacementHistory
{
    /// <summary>
    /// Shot sequence number
    /// </summary>
    public int ShotNumber { get; set; }

    /// <summary>
    /// Shot type detected
    /// </summary>
    public string ShotType { get; set; } = string.Empty;

    /// <summary>
    /// Location of shot
    /// </summary>
    public LocationContext Location { get; set; } = new();

    /// <summary>
    /// Distance to pin when shot was taken
    /// </summary>
    public decimal? DistanceToPinYards { get; set; }

    /// <summary>
    /// Club used (if known)
    /// </summary>
    public string? ClubUsed { get; set; }

    /// <summary>
    /// Shot result description
    /// </summary>
    public string? Result { get; set; }

    /// <summary>
    /// Timestamp of shot
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Shot distance ranges for different shot types
/// </summary>
public class ShotDistanceRange
{
    /// <summary>
    /// Shot type name
    /// </summary>
    public string ShotType { get; set; } = string.Empty;

    /// <summary>
    /// Minimum distance in yards
    /// </summary>
    public decimal MinDistanceYards { get; set; }

    /// <summary>
    /// Maximum distance in yards
    /// </summary>
    public decimal MaxDistanceYards { get; set; }

    /// <summary>
    /// Typical distance range description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Key characteristics for this distance range
    /// </summary>
    public List<string> Characteristics { get; set; } = new();
}

/// <summary>
/// Shot types enumeration for consistent classification
/// </summary>
public static class ShotTypes
{
    public const string Drive = "drive";
    public const string TeeShotPar3 = "tee-shot-par3";
    public const string ApproachShot = "approach-shot";
    public const string ChipShot = "chip-shot";
    public const string PitchShot = "pitch-shot";
    public const string BunkerShot = "bunker-shot";
    public const string Putt = "putt";
    public const string RecoveryShot = "recovery-shot";
    public const string LayupShot = "layup-shot";
    public const string GeneralShot = "general-shot";
    
    /// <summary>
    /// Get all available shot types
    /// </summary>
    public static List<string> GetAllShotTypes()
    {
        return new List<string>
        {
            Drive, TeeShotPar3, ApproachShot, ChipShot, PitchShot,
            BunkerShot, Putt, RecoveryShot, LayupShot, GeneralShot
        };
    }
}

/// <summary>
/// Position types enumeration
/// </summary>
public static class PositionTypes
{
    public const string TeeBox = "tee_box";
    public const string Fairway = "fairway";
    public const string Rough = "rough";
    public const string Bunker = "bunker";
    public const string Green = "green";
    public const string FringeApron = "fringe_apron";
    public const string Trees = "trees";
    public const string Hazard = "hazard";
    public const string Unknown = "unknown";
    
    /// <summary>
    /// Get all available position types
    /// </summary>
    public static List<string> GetAllPositionTypes()
    {
        return new List<string>
        {
            TeeBox, Fairway, Rough, Bunker, Green, 
            FringeApron, Trees, Hazard, Unknown
        };
    }
}