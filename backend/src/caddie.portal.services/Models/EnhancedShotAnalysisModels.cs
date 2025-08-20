using System.ComponentModel.DataAnnotations;
using caddie.portal.services.Interfaces;

namespace caddie.portal.services.Models;

/// <summary>
/// Comprehensive shot analysis result
/// </summary>
public class EnhancedShotAnalysisResult
{
    /// <summary>
    /// Club recommendation with skill-based adjustments
    /// </summary>
    public ClubRecommendationResult ClubRecommendation { get; set; } = new();

    /// <summary>
    /// Strategic advice tailored to skill level
    /// </summary>
    public StrategicAdviceResult StrategicAdvice { get; set; } = new();

    /// <summary>
    /// Distance calculations and analysis
    /// </summary>
    public DistanceAnalysisResult DistanceAnalysis { get; set; } = new();

    /// <summary>
    /// Environmental factors affecting the shot
    /// </summary>
    public EnvironmentalFactors EnvironmentalFactors { get; set; } = new();

    /// <summary>
    /// Shot confidence assessment
    /// </summary>
    public ShotConfidenceScore ConfidenceScore { get; set; } = new();

    /// <summary>
    /// Overall analysis confidence (0.0 - 1.0)
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal OverallConfidence { get; set; }

    /// <summary>
    /// Key analysis factors that influenced recommendations
    /// </summary>
    public List<AnalysisFactor> KeyFactors { get; set; } = new();

    /// <summary>
    /// Alternative shot approaches
    /// </summary>
    public List<ShotAlternative> ShotAlternatives { get; set; } = new();

    /// <summary>
    /// Analysis timestamp
    /// </summary>
    public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Performance prediction for this shot
    /// </summary>
    public PerformancePrediction? PerformancePrediction { get; set; }
}

/// <summary>
/// Distance analysis with environmental adjustments
/// </summary>
public class DistanceAnalysisResult
{
    /// <summary>
    /// Straight-line distance to target in yards
    /// </summary>
    public decimal StraightDistanceYards { get; set; }

    /// <summary>
    /// Required carry distance in yards
    /// </summary>
    public decimal CarryDistanceYards { get; set; }

    /// <summary>
    /// Total playing distance adjusted for conditions
    /// </summary>
    public decimal PlayingDistanceYards { get; set; }

    /// <summary>
    /// Elevation change effect (+/- yards)
    /// </summary>
    public decimal ElevationAdjustmentYards { get; set; }

    /// <summary>
    /// Wind effect on distance (+/- yards)
    /// </summary>
    public decimal WindAdjustmentYards { get; set; }

    /// <summary>
    /// Temperature effect on distance (+/- yards)
    /// </summary>
    public decimal TemperatureAdjustmentYards { get; set; }

    /// <summary>
    /// Altitude effect on distance (+/- yards)
    /// </summary>
    public decimal AltitudeAdjustmentYards { get; set; }

    /// <summary>
    /// Distance to hazards and obstacles
    /// </summary>
    public Dictionary<string, decimal> HazardDistances { get; set; } = new();

    /// <summary>
    /// Distance accuracy confidence
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal DistanceConfidence { get; set; }

    /// <summary>
    /// Factors affecting distance calculation
    /// </summary>
    public List<DistanceFactor> InfluencingFactors { get; set; } = new();
}

/// <summary>
/// Club recommendation result with skill-based analysis
/// </summary>
public class ClubRecommendationResult
{
    /// <summary>
    /// Primary club recommendation
    /// </summary>
    public string PrimaryClub { get; set; } = string.Empty;

    /// <summary>
    /// Alternative club options
    /// </summary>
    public List<ClubOption> AlternativeClubs { get; set; } = new();

    /// <summary>
    /// Skill-based reasoning for recommendation
    /// </summary>
    public string SkillBasedReasoning { get; set; } = string.Empty;

    /// <summary>
    /// Confidence in club recommendation
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal RecommendationConfidence { get; set; }

    /// <summary>
    /// Shot execution tips for recommended club
    /// </summary>
    public List<ExecutionTip> ExecutionTips { get; set; } = new();

    /// <summary>
    /// Adjustments made for skill level
    /// </summary>
    public List<SkillAdjustment> SkillAdjustments { get; set; } = new();

    /// <summary>
    /// Conservative vs aggressive options
    /// </summary>
    public PlayingStyleOptions PlayingStyleOptions { get; set; } = new();
}

/// <summary>
/// Strategic advice result
/// </summary>
public class StrategicAdviceResult
{
    /// <summary>
    /// Primary strategic recommendation
    /// </summary>
    public string PrimaryStrategy { get; set; } = string.Empty;

    /// <summary>
    /// Target area recommendations
    /// </summary>
    public TargetingStrategy TargetingStrategy { get; set; } = new();

    /// <summary>
    /// Risk assessment and management
    /// </summary>
    public RiskManagementAdvice RiskManagement { get; set; } = new();

    /// <summary>
    /// Course management considerations
    /// </summary>
    public CourseManagementAdvice CourseManagement { get; set; } = new();

    /// <summary>
    /// Mental approach recommendations
    /// </summary>
    public MentalGameAdvice MentalGame { get; set; } = new();

    /// <summary>
    /// Shot sequence planning
    /// </summary>
    public ShotSequencePlanning? SequencePlanning { get; set; }

    /// <summary>
    /// Skill development opportunities
    /// </summary>
    public List<SkillDevelopmentOpportunity> DevelopmentOpportunities { get; set; } = new();
}

/// <summary>
/// Environmental factors assessment
/// </summary>
public class EnvironmentalFactors
{
    /// <summary>
    /// Wind analysis and impact
    /// </summary>
    public WindAnalysis? WindAnalysis { get; set; }

    /// <summary>
    /// Temperature effects
    /// </summary>
    public TemperatureEffects? TemperatureEffects { get; set; }

    /// <summary>
    /// Ground conditions
    /// </summary>
    public GroundConditions? GroundConditions { get; set; }

    /// <summary>
    /// Elevation and slope factors
    /// </summary>
    public ElevationFactors? ElevationFactors { get; set; }

    /// <summary>
    /// Lighting and visibility
    /// </summary>
    public VisibilityFactors? VisibilityFactors { get; set; }

    /// <summary>
    /// Overall environmental impact score
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal EnvironmentalImpactScore { get; set; }

    /// <summary>
    /// Adaptations needed for conditions
    /// </summary>
    public List<EnvironmentalAdaptation> RequiredAdaptations { get; set; } = new();
}

/// <summary>
/// Shot confidence score and analysis
/// </summary>
public class ShotConfidenceScore
{
    /// <summary>
    /// Overall confidence score (0.0 - 1.0)
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal OverallConfidence { get; set; }

    /// <summary>
    /// Success probability for user's skill level
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal SuccessProbability { get; set; }

    /// <summary>
    /// Confidence factors breakdown
    /// </summary>
    public ConfidenceFactors ConfidenceBreakdown { get; set; } = new();

    /// <summary>
    /// Areas of concern for shot execution
    /// </summary>
    public List<ConfidenceConcern> Concerns { get; set; } = new();

    /// <summary>
    /// Confidence building recommendations
    /// </summary>
    public List<ConfidenceBuilder> ConfidenceBuilders { get; set; } = new();

    /// <summary>
    /// Skill level appropriateness
    /// </summary>
    public SkillAppropriatenessScore SkillAppropriateness { get; set; } = new();
}

/// <summary>
/// Analysis factor that influenced recommendations
/// </summary>
public class AnalysisFactor
{
    /// <summary>
    /// Factor name (distance, wind, skill_level, etc.)
    /// </summary>
    public string FactorName { get; set; } = string.Empty;

    /// <summary>
    /// Factor importance (1-5 scale)
    /// </summary>
    [Range(1, 5)]
    public int Importance { get; set; }

    /// <summary>
    /// How this factor influenced the recommendation
    /// </summary>
    public string Influence { get; set; } = string.Empty;

    /// <summary>
    /// Factor value or measurement
    /// </summary>
    public string Value { get; set; } = string.Empty;
}

/// <summary>
/// Shot alternative approach
/// </summary>
public class ShotAlternative
{
    /// <summary>
    /// Alternative approach name
    /// </summary>
    public string ApproachName { get; set; } = string.Empty;

    /// <summary>
    /// Description of alternative
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Recommended club for alternative
    /// </summary>
    public string RecommendedClub { get; set; } = string.Empty;

    /// <summary>
    /// Expected outcome
    /// </summary>
    public string ExpectedOutcome { get; set; } = string.Empty;

    /// <summary>
    /// Success probability
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal SuccessProbability { get; set; }

    /// <summary>
    /// Risk level (low, moderate, high)
    /// </summary>
    public string RiskLevel { get; set; } = "moderate";

    /// <summary>
    /// When this alternative is most appropriate
    /// </summary>
    public string WhenAppropriate { get; set; } = string.Empty;
}

/// <summary>
/// Performance prediction for shot
/// </summary>
public class PerformancePrediction
{
    /// <summary>
    /// Predicted shot outcome
    /// </summary>
    public string PredictedOutcome { get; set; } = string.Empty;

    /// <summary>
    /// Accuracy prediction (distance from target)
    /// </summary>
    public AccuracyPrediction AccuracyPrediction { get; set; } = new();

    /// <summary>
    /// Distance prediction
    /// </summary>
    public DistancePrediction DistancePrediction { get; set; } = new();

    /// <summary>
    /// Potential miss patterns for skill level
    /// </summary>
    public List<MissPattern> PotentialMisses { get; set; } = new();

    /// <summary>
    /// Success scenarios
    /// </summary>
    public List<SuccessScenario> SuccessScenarios { get; set; } = new();
}

/// <summary>
/// Club option with analysis
/// </summary>
public class ClubOption
{
    /// <summary>
    /// Club name
    /// </summary>
    public string Club { get; set; } = string.Empty;

    /// <summary>
    /// Confidence in this option
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal Confidence { get; set; }

    /// <summary>
    /// When to choose this club
    /// </summary>
    public string WhenToChoose { get; set; } = string.Empty;

    /// <summary>
    /// Expected ball flight
    /// </summary>
    public BallFlightCharacteristics BallFlight { get; set; } = new();

    /// <summary>
    /// Skill level suitability
    /// </summary>
    public string SkillSuitability { get; set; } = string.Empty;
}

/// <summary>
/// Shot execution tip
/// </summary>
public class ExecutionTip
{
    /// <summary>
    /// Tip category (setup, swing, mental, etc.)
    /// </summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Tip description
    /// </summary>
    public string Tip { get; set; } = string.Empty;

    /// <summary>
    /// Why this tip is important
    /// </summary>
    public string Importance { get; set; } = string.Empty;

    /// <summary>
    /// Skill level this tip applies to
    /// </summary>
    public string SkillLevel { get; set; } = string.Empty;
}

/// <summary>
/// Playing style options (conservative vs aggressive)
/// </summary>
public class PlayingStyleOptions
{
    /// <summary>
    /// Conservative approach
    /// </summary>
    public PlayingStyleOption Conservative { get; set; } = new();

    /// <summary>
    /// Aggressive approach
    /// </summary>
    public PlayingStyleOption Aggressive { get; set; } = new();

    /// <summary>
    /// Recommended approach for skill level
    /// </summary>
    public string RecommendedApproach { get; set; } = "conservative";

    /// <summary>
    /// Reasoning for recommendation
    /// </summary>
    public string Reasoning { get; set; } = string.Empty;
}

/// <summary>
/// Individual playing style option
/// </summary>
public class PlayingStyleOption
{
    /// <summary>
    /// Club recommendation
    /// </summary>
    public string Club { get; set; } = string.Empty;

    /// <summary>
    /// Target area
    /// </summary>
    public string Target { get; set; } = string.Empty;

    /// <summary>
    /// Expected outcome
    /// </summary>
    public string ExpectedOutcome { get; set; } = string.Empty;

    /// <summary>
    /// Success probability
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal SuccessProbability { get; set; }

    /// <summary>
    /// Risk factors
    /// </summary>
    public List<string> RiskFactors { get; set; } = new();

    /// <summary>
    /// Benefits of this approach
    /// </summary>
    public List<string> Benefits { get; set; } = new();
}

/// <summary>
/// Targeting strategy
/// </summary>
public class TargetingStrategy
{
    /// <summary>
    /// Primary target description
    /// </summary>
    public string PrimaryTarget { get; set; } = string.Empty;

    /// <summary>
    /// Target area size appropriate for skill level
    /// </summary>
    public TargetAreaSize TargetSize { get; set; } = new();

    /// <summary>
    /// Backup targets
    /// </summary>
    public List<BackupTarget> BackupTargets { get; set; } = new();

    /// <summary>
    /// Aiming points and alignment
    /// </summary>
    public AimingGuidance AimingGuidance { get; set; } = new();

    /// <summary>
    /// Visual landmarks for targeting
    /// </summary>
    public List<VisualLandmark> VisualLandmarks { get; set; } = new();
}

/// <summary>
/// Risk management advice
/// </summary>
public class RiskManagementAdvice
{
    /// <summary>
    /// Overall risk level
    /// </summary>
    public string RiskLevel { get; set; } = "moderate";

    /// <summary>
    /// Primary risks identified
    /// </summary>
    public List<IdentifiedRisk> PrimaryRisks { get; set; } = new();

    /// <summary>
    /// Risk mitigation strategies
    /// </summary>
    public List<RiskMitigationStrategy> MitigationStrategies { get; set; } = new();

    /// <summary>
    /// Contingency plans
    /// </summary>
    public List<ContingencyPlan> ContingencyPlans { get; set; } = new();

    /// <summary>
    /// Risk vs reward analysis
    /// </summary>
    public RiskRewardAnalysis RiskRewardAnalysis { get; set; } = new();
}

/// <summary>
/// Mental game advice
/// </summary>
public class MentalGameAdvice
{
    /// <summary>
    /// Pre-shot routine recommendations
    /// </summary>
    public PreShotRoutineAdvice PreShotRoutine { get; set; } = new();

    /// <summary>
    /// Visualization techniques
    /// </summary>
    public List<VisualizationTechnique> VisualizationTechniques { get; set; } = new();

    /// <summary>
    /// Focus cues
    /// </summary>
    public List<FocusCue> FocusCues { get; set; } = new();

    /// <summary>
    /// Confidence building techniques
    /// </summary>
    public List<ConfidenceTechnique> ConfidenceTechniques { get; set; } = new();

    /// <summary>
    /// Pressure management
    /// </summary>
    public PressureManagementAdvice? PressureManagement { get; set; }
}

/// <summary>
/// Shot sequence planning
/// </summary>
public class ShotSequencePlanning
{
    /// <summary>
    /// Current shot in sequence
    /// </summary>
    public int CurrentShotNumber { get; set; }

    /// <summary>
    /// Planned shot sequence
    /// </summary>
    public List<PlannedShot> PlannedSequence { get; set; } = new();

    /// <summary>
    /// Optimal strategy for hole completion
    /// </summary>
    public string OptimalStrategy { get; set; } = string.Empty;

    /// <summary>
    /// Decision points in sequence
    /// </summary>
    public List<DecisionPoint> DecisionPoints { get; set; } = new();
}

/// <summary>
/// Wind analysis
/// </summary>
public class WindAnalysis
{
    /// <summary>
    /// Wind speed in mph
    /// </summary>
    public decimal WindSpeedMph { get; set; }

    /// <summary>
    /// Wind direction
    /// </summary>
    public string WindDirection { get; set; } = string.Empty;

    /// <summary>
    /// Relative wind direction (headwind, tailwind, crosswind)
    /// </summary>
    public string RelativeWindDirection { get; set; } = string.Empty;

    /// <summary>
    /// Wind impact on shot
    /// </summary>
    public WindImpact ImpactAssessment { get; set; } = new();

    /// <summary>
    /// Recommended adjustments
    /// </summary>
    public List<WindAdjustment> Adjustments { get; set; } = new();
}

/// <summary>
/// Distance factor affecting calculation
/// </summary>
public class DistanceFactor
{
    /// <summary>
    /// Factor name
    /// </summary>
    public string Factor { get; set; } = string.Empty;

    /// <summary>
    /// Impact on distance (+/- yards)
    /// </summary>
    public decimal ImpactYards { get; set; }

    /// <summary>
    /// Confidence in this factor
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal Confidence { get; set; }

    /// <summary>
    /// Description of factor influence
    /// </summary>
    public string Description { get; set; } = string.Empty;
}

/// <summary>
/// Playing conditions assessment
/// </summary>
public class PlayingConditions
{
    /// <summary>
    /// Weather conditions
    /// </summary>
    public WeatherContext? Weather { get; set; }

    /// <summary>
    /// Course conditions
    /// </summary>
    public CourseConditions? CourseConditions { get; set; }

    /// <summary>
    /// Time of day factors
    /// </summary>
    public TimeOfDayFactors? TimeFactors { get; set; }

    /// <summary>
    /// Overall conditions impact
    /// </summary>
    public ConditionsImpact OverallImpact { get; set; } = new();
}

// Additional supporting model classes would continue here...
// For brevity, I'm including the core models but not all 50+ supporting classes

/// <summary>
/// Basic implementations for the remaining model classes
/// </summary>

public class TemperatureEffects
{
    public decimal TemperatureFahrenheit { get; set; }
    public decimal DistanceEffect { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class GroundConditions
{
    public string Firmness { get; set; } = "normal";
    public string Moisture { get; set; } = "normal";
    public decimal BounceRollFactor { get; set; } = 1.0m;
}

public class ElevationFactors
{
    public decimal ElevationChangeYards { get; set; }
    public decimal DistanceAdjustment { get; set; }
    public string SlopeDirection { get; set; } = string.Empty;
}

public class VisibilityFactors
{
    public string LightingConditions { get; set; } = "good";
    public decimal VisibilityScore { get; set; } = 1.0m;
    public List<string> VisibilityIssues { get; set; } = new();
}

public class EnvironmentalAdaptation
{
    public string AdaptationType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}

public class ConfidenceFactors
{
    public decimal SkillLevelFactor { get; set; }
    public decimal ConditionsFactor { get; set; }
    public decimal ShotDifficultyFactor { get; set; }
    public decimal ExperienceFactor { get; set; }
}

public class ConfidenceConcern
{
    public string ConcernArea { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal ImpactOnConfidence { get; set; }
}

public class ConfidenceBuilder
{
    public string TechniqueName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal ConfidenceBoost { get; set; }
}

public class SkillAppropriatenessScore
{
    public bool IsAppropriate { get; set; } = true;
    public string AppropriatenessLevel { get; set; } = "appropriate";
    public decimal SkillMatchScore { get; set; }
}

public class SkillDevelopmentOpportunity
{
    public string SkillArea { get; set; } = string.Empty;
    public string LearningOpportunity { get; set; } = string.Empty;
    public string PracticeRecommendation { get; set; } = string.Empty;
}

public class AccuracyPrediction
{
    public decimal PredictedAccuracyRadius { get; set; }
    public decimal TargetHitProbability { get; set; }
}

public class DistancePrediction
{
    public decimal ExpectedCarryYards { get; set; }
    public decimal ExpectedTotalYards { get; set; }
    public decimal DistanceVariability { get; set; }
}

public class MissPattern
{
    public string MissDirection { get; set; } = string.Empty;
    public decimal Probability { get; set; }
    public string Cause { get; set; } = string.Empty;
}

public class SuccessScenario
{
    public string Scenario { get; set; } = string.Empty;
    public decimal Probability { get; set; }
    public string Outcome { get; set; } = string.Empty;
}

public class BallFlightCharacteristics
{
    public string TrajectoryHeight { get; set; } = "normal";
    public string BallFlight { get; set; } = "straight";
    public decimal SpinRate { get; set; }
}

public class TargetAreaSize
{
    public decimal WidthYards { get; set; }
    public decimal DepthYards { get; set; }
    public string SizeCategory { get; set; } = "medium";
}

public class BackupTarget
{
    public string TargetName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal SuccessProbability { get; set; }
}

public class AimingGuidance
{
    public string AimingPoint { get; set; } = string.Empty;
    public string AlignmentTips { get; set; } = string.Empty;
    public List<string> AimingCues { get; set; } = new();
}

public class VisualLandmark
{
    public string LandmarkName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string HowToUse { get; set; } = string.Empty;
}

public class IdentifiedRisk
{
    public string RiskName { get; set; } = string.Empty;
    public decimal Probability { get; set; }
    public string PotentialImpact { get; set; } = string.Empty;
}

public class RiskMitigationStrategy
{
    public string StrategyName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal EffectivenessScore { get; set; }
}

public class ContingencyPlan
{
    public string PlanName { get; set; } = string.Empty;
    public string Trigger { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
}

public class RiskRewardAnalysis
{
    public string Analysis { get; set; } = string.Empty;
    public decimal RiskScore { get; set; }
    public decimal RewardScore { get; set; }
    public string Recommendation { get; set; } = string.Empty;
}

public class PreShotRoutineAdvice
{
    public List<RoutineStep> RecommendedSteps { get; set; } = new();
    public TimeSpan OptimalDuration { get; set; }
    public string SkillCustomization { get; set; } = string.Empty;
}

public class VisualizationTechnique
{
    public string TechniqueName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string WhenToUse { get; set; } = string.Empty;
}

public class FocusCue
{
    public string CueName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
}

public class ConfidenceTechnique
{
    public string TechniqueName { get; set; } = string.Empty;
    public string Application { get; set; } = string.Empty;
    public string Benefit { get; set; } = string.Empty;
}

public class PlannedShot
{
    public int ShotNumber { get; set; }
    public string Club { get; set; } = string.Empty;
    public string Target { get; set; } = string.Empty;
    public string Strategy { get; set; } = string.Empty;
}

public class DecisionPoint
{
    public string DecisionName { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public string RecommendedOption { get; set; } = string.Empty;
}

public class WindImpact
{
    public string ImpactLevel { get; set; } = "moderate";
    public decimal DistanceEffect { get; set; }
    public decimal DirectionEffect { get; set; }
}

public class WindAdjustment
{
    public string AdjustmentType { get; set; } = string.Empty;
    public string Recommendation { get; set; } = string.Empty;
    public decimal ExpectedImprovement { get; set; }
}


public class TimeOfDayFactors
{
    public TimeSpan TimeOfDay { get; set; }
    public string LightingQuality { get; set; } = "good";
    public List<string> ConsiderationsForTime { get; set; } = new();
}

public class ConditionsImpact
{
    public decimal OverallImpactScore { get; set; }
    public string Description { get; set; } = string.Empty;
    public List<string> KeyFactors { get; set; } = new();
}

/// <summary>
/// Pressure management advice
/// </summary>
public class PressureManagementAdvice
{
    /// <summary>
    /// Pressure level assessment
    /// </summary>
    public string PressureLevel { get; set; } = "moderate";

    /// <summary>
    /// Breathing techniques
    /// </summary>
    public List<string> BreathingTechniques { get; set; } = new();

    /// <summary>
    /// Mental cues for pressure situations
    /// </summary>
    public List<string> MentalCues { get; set; } = new();

    /// <summary>
    /// Physical tension release techniques
    /// </summary>
    public List<string> TensionReleaseTechniques { get; set; } = new();

    /// <summary>
    /// Focus strategies under pressure
    /// </summary>
    public string FocusStrategy { get; set; } = string.Empty;

    /// <summary>
    /// Confidence building under pressure
    /// </summary>
    public List<string> ConfidenceBuilders { get; set; } = new();
}

