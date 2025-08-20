using System.ComponentModel.DataAnnotations;

namespace caddie.portal.services.Models;

/// <summary>
/// Skill-based club recommendation with reasoning
/// </summary>
public class SkillBasedClubRecommendation
{
    /// <summary>
    /// Primary club recommendation
    /// </summary>
    public string RecommendedClub { get; set; } = string.Empty;

    /// <summary>
    /// Alternative club options
    /// </summary>
    public List<string> AlternativeClubs { get; set; } = new();

    /// <summary>
    /// Reasoning tailored to user's skill level
    /// </summary>
    public string SkillBasedReasoning { get; set; } = string.Empty;

    /// <summary>
    /// Confidence in recommendation (0.0 - 1.0)
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal Confidence { get; set; }

    /// <summary>
    /// Skill level adjustments made to the recommendation
    /// </summary>
    public List<SkillAdjustment> SkillAdjustments { get; set; } = new();

    /// <summary>
    /// Conservative vs aggressive options based on skill level
    /// </summary>
    public PlayingStyleRecommendation PlayingStyleRec { get; set; } = new();

    /// <summary>
    /// Technical tips specific to the recommended club and skill level
    /// </summary>
    public List<string> TechnicalTips { get; set; } = new();
}

/// <summary>
/// Strategic advice tailored to user skill level
/// </summary>
public class SkillBasedStrategicAdvice
{
    /// <summary>
    /// Primary strategic recommendation
    /// </summary>
    public string PrimaryAdvice { get; set; } = string.Empty;

    /// <summary>
    /// Target area recommendation based on skill level
    /// </summary>
    public TargetRecommendation TargetRecommendation { get; set; } = new();

    /// <summary>
    /// Risk assessment appropriate for skill level
    /// </summary>
    public SkillBasedRiskAssessment RiskAssessment { get; set; } = new();

    /// <summary>
    /// Course management strategy
    /// </summary>
    public CourseManagementStrategy Strategy { get; set; } = new();

    /// <summary>
    /// Mental approach recommendations
    /// </summary>
    public MentalApproachAdvice MentalApproach { get; set; } = new();

    /// <summary>
    /// Skill development opportunities in this situation
    /// </summary>
    public List<string> LearningOpportunities { get; set; } = new();
}

/// <summary>
/// Course management advice based on skill level
/// </summary>
public class CourseManagementAdvice
{
    /// <summary>
    /// Overall course management strategy
    /// </summary>
    public string Strategy { get; set; } = string.Empty;

    /// <summary>
    /// Recommended target areas
    /// </summary>
    public List<TargetArea> TargetAreas { get; set; } = new();

    /// <summary>
    /// Areas to avoid
    /// </summary>
    public List<HazardAvoidance> AvoidanceAreas { get; set; } = new();

    /// <summary>
    /// Layup recommendations for skill level
    /// </summary>
    public LayupRecommendation? LayupRec { get; set; }

    /// <summary>
    /// Percentage play vs aggressive play advice
    /// </summary>
    public PlayingStyleAdvice PlayingStyle { get; set; } = new();

    /// <summary>
    /// Hole-specific strategic considerations
    /// </summary>
    public List<string> HoleSpecificTips { get; set; } = new();
}

/// <summary>
/// Skill tips and fundamentals
/// </summary>
public class SkillTips
{
    /// <summary>
    /// Fundamental technique tips
    /// </summary>
    public List<TechniqueTip> TechniqueTips { get; set; } = new();

    /// <summary>
    /// Mental game advice
    /// </summary>
    public List<string> MentalGameTips { get; set; } = new();

    /// <summary>
    /// Practice recommendations
    /// </summary>
    public List<string> PracticeRecommendations { get; set; } = new();

    /// <summary>
    /// Common mistakes to avoid for this skill level
    /// </summary>
    public List<string> CommonMistakes { get; set; } = new();

    /// <summary>
    /// Progressive skill development suggestions
    /// </summary>
    public SkillDevelopmentPath? DevelopmentPath { get; set; }
}

/// <summary>
/// Skill appropriateness assessment
/// </summary>
public class SkillAppropriatenessAssessment
{
    /// <summary>
    /// Whether the shot is appropriate for user's skill level
    /// </summary>
    public bool IsAppropriate { get; set; }

    /// <summary>
    /// Appropriateness level (too_easy, appropriate, challenging, too_difficult)
    /// </summary>
    public string AppropriatenessLevel { get; set; } = "appropriate";

    /// <summary>
    /// Recommended skill level for this shot
    /// </summary>
    public string RecommendedSkillLevel { get; set; } = string.Empty;

    /// <summary>
    /// Alternative approaches for user's skill level
    /// </summary>
    public List<SkillAlternative> SkillAlternatives { get; set; } = new();

    /// <summary>
    /// Skills needed to execute this shot successfully
    /// </summary>
    public List<RequiredSkill> RequiredSkills { get; set; } = new();

    /// <summary>
    /// Confidence building suggestions
    /// </summary>
    public List<string> ConfidenceBuildingTips { get; set; } = new();
}

/// <summary>
/// Skill adjustment made to recommendation
/// </summary>
public class SkillAdjustment
{
    /// <summary>
    /// Type of adjustment (club_selection, target_area, strategy)
    /// </summary>
    public string AdjustmentType { get; set; } = string.Empty;

    /// <summary>
    /// Original recommendation
    /// </summary>
    public string Original { get; set; } = string.Empty;

    /// <summary>
    /// Adjusted recommendation
    /// </summary>
    public string Adjusted { get; set; } = string.Empty;

    /// <summary>
    /// Reason for adjustment
    /// </summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Skill level that triggered the adjustment
    /// </summary>
    public string SkillLevel { get; set; } = string.Empty;
}

/// <summary>
/// Playing style recommendation (conservative vs aggressive)
/// </summary>
public class PlayingStyleRecommendation
{
    /// <summary>
    /// Recommended playing style for this shot
    /// </summary>
    public string RecommendedStyle { get; set; } = "balanced";

    /// <summary>
    /// Conservative option
    /// </summary>
    public PlayingOption ConservativeOption { get; set; } = new();

    /// <summary>
    /// Aggressive option
    /// </summary>
    public PlayingOption AggressiveOption { get; set; } = new();

    /// <summary>
    /// Recommended option based on skill level
    /// </summary>
    public string RecommendedOption { get; set; } = "conservative";

    /// <summary>
    /// Reasoning for style recommendation
    /// </summary>
    public string Reasoning { get; set; } = string.Empty;
}

/// <summary>
/// Playing option (conservative or aggressive)
/// </summary>
public class PlayingOption
{
    /// <summary>
    /// Club recommendation for this option
    /// </summary>
    public string Club { get; set; } = string.Empty;

    /// <summary>
    /// Target area for this option
    /// </summary>
    public string Target { get; set; } = string.Empty;

    /// <summary>
    /// Expected outcome
    /// </summary>
    public string ExpectedOutcome { get; set; } = string.Empty;

    /// <summary>
    /// Risk level (low, moderate, high)
    /// </summary>
    public string RiskLevel { get; set; } = "moderate";

    /// <summary>
    /// Success probability for user's skill level
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal SuccessProbability { get; set; }
}

/// <summary>
/// Target recommendation based on skill level
/// </summary>
public class TargetRecommendation
{
    /// <summary>
    /// Primary target description
    /// </summary>
    public string PrimaryTarget { get; set; } = string.Empty;

    /// <summary>
    /// Target area size appropriate for skill level
    /// </summary>
    public TargetSize TargetSize { get; set; } = new();

    /// <summary>
    /// Backup targets if primary is missed
    /// </summary>
    public List<string> BackupTargets { get; set; } = new();

    /// <summary>
    /// Visual alignment tips
    /// </summary>
    public List<string> AlignmentTips { get; set; } = new();

    /// <summary>
    /// Skill-appropriate aiming strategy
    /// </summary>
    public string AimingStrategy { get; set; } = string.Empty;
}

/// <summary>
/// Target size recommendation
/// </summary>
public class TargetSize
{
    /// <summary>
    /// Width of target area in yards
    /// </summary>
    public decimal WidthYards { get; set; }

    /// <summary>
    /// Depth of target area in yards
    /// </summary>
    public decimal DepthYards { get; set; }

    /// <summary>
    /// Target size description (small, medium, large, very_large)
    /// </summary>
    public string SizeDescription { get; set; } = "medium";

    /// <summary>
    /// Why this target size is appropriate
    /// </summary>
    public string Reasoning { get; set; } = string.Empty;
}

/// <summary>
/// Skill-based risk assessment
/// </summary>
public class SkillBasedRiskAssessment
{
    /// <summary>
    /// Risk level appropriate for skill level
    /// </summary>
    public string RiskLevel { get; set; } = "moderate";

    /// <summary>
    /// Potential negative outcomes
    /// </summary>
    public List<RiskFactor> RiskFactors { get; set; } = new();

    /// <summary>
    /// Risk mitigation strategies for this skill level
    /// </summary>
    public List<string> MitigationStrategies { get; set; } = new();

    /// <summary>
    /// Reward potential if shot is successful
    /// </summary>
    public string RewardPotential { get; set; } = string.Empty;

    /// <summary>
    /// Risk vs reward analysis
    /// </summary>
    public string RiskRewardAnalysis { get; set; } = string.Empty;
}

/// <summary>
/// Risk factor with skill-based assessment
/// </summary>
public class RiskFactor
{
    /// <summary>
    /// Risk name (hazard, distance, conditions)
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Severity for this skill level (1-5)
    /// </summary>
    [Range(1, 5)]
    public int Severity { get; set; }

    /// <summary>
    /// Probability of this risk occurring
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal Probability { get; set; }

    /// <summary>
    /// Impact if risk occurs
    /// </summary>
    public string Impact { get; set; } = string.Empty;

    /// <summary>
    /// Skill-appropriate avoidance strategy
    /// </summary>
    public string AvoidanceStrategy { get; set; } = string.Empty;
}

/// <summary>
/// Course management strategy
/// </summary>
public class CourseManagementStrategy
{
    /// <summary>
    /// Overall strategy name
    /// </summary>
    public string StrategyName { get; set; } = string.Empty;

    /// <summary>
    /// Strategy description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Key strategic principles
    /// </summary>
    public List<string> KeyPrinciples { get; set; } = new();

    /// <summary>
    /// Shot sequence recommendations
    /// </summary>
    public List<ShotSequence> ShotSequence { get; set; } = new();

    /// <summary>
    /// Success metrics for this strategy
    /// </summary>
    public string SuccessMetrics { get; set; } = string.Empty;
}

/// <summary>
/// Shot sequence recommendation
/// </summary>
public class ShotSequence
{
    /// <summary>
    /// Shot number in sequence
    /// </summary>
    public int ShotNumber { get; set; }

    /// <summary>
    /// Recommended club
    /// </summary>
    public string Club { get; set; } = string.Empty;

    /// <summary>
    /// Target area
    /// </summary>
    public string Target { get; set; } = string.Empty;

    /// <summary>
    /// Strategic intent
    /// </summary>
    public string Intent { get; set; } = string.Empty;

    /// <summary>
    /// Setup for next shot
    /// </summary>
    public string NextShotSetup { get; set; } = string.Empty;
}

/// <summary>
/// Mental approach advice
/// </summary>
public class MentalApproachAdvice
{
    /// <summary>
    /// Pre-shot routine recommendations
    /// </summary>
    public PreShotRoutine PreShotRoutine { get; set; } = new();

    /// <summary>
    /// Confidence building techniques
    /// </summary>
    public List<string> ConfidenceTechniques { get; set; } = new();

    /// <summary>
    /// Focus points for this shot
    /// </summary>
    public List<string> FocusPoints { get; set; } = new();

    /// <summary>
    /// Pressure management advice
    /// </summary>
    public PressureManagement? PressureManagement { get; set; }

    /// <summary>
    /// Visualization techniques
    /// </summary>
    public List<string> VisualizationTechniques { get; set; } = new();
}

/// <summary>
/// Pre-shot routine recommendation
/// </summary>
public class PreShotRoutine
{
    /// <summary>
    /// Routine steps in order
    /// </summary>
    public List<RoutineStep> Steps { get; set; } = new();

    /// <summary>
    /// Recommended timing for routine
    /// </summary>
    public TimeSpan RecommendedDuration { get; set; }

    /// <summary>
    /// Key checkpoints
    /// </summary>
    public List<string> KeyCheckpoints { get; set; } = new();

    /// <summary>
    /// Customization for skill level
    /// </summary>
    public string SkillCustomization { get; set; } = string.Empty;
}

/// <summary>
/// Pre-shot routine step
/// </summary>
public class RoutineStep
{
    /// <summary>
    /// Step number
    /// </summary>
    public int StepNumber { get; set; }

    /// <summary>
    /// Step description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Recommended duration for this step
    /// </summary>
    public TimeSpan Duration { get; set; }

    /// <summary>
    /// Key points for this step
    /// </summary>
    public List<string> KeyPoints { get; set; } = new();
}

/// <summary>
/// Pressure management advice
/// </summary>
public class PressureManagement
{
    /// <summary>
    /// Pressure level assessment (low, moderate, high)
    /// </summary>
    public string PressureLevel { get; set; } = "moderate";

    /// <summary>
    /// Breathing techniques
    /// </summary>
    public List<string> BreathingTechniques { get; set; } = new();

    /// <summary>
    /// Mental cues to manage pressure
    /// </summary>
    public List<string> MentalCues { get; set; } = new();

    /// <summary>
    /// Physical tension release techniques
    /// </summary>
    public List<string> TensionReleaseTechniques { get; set; } = new();
}

/// <summary>
/// Target area recommendation
/// </summary>
public class TargetArea
{
    /// <summary>
    /// Area name/description
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Priority level (primary, secondary, fallback)
    /// </summary>
    public string Priority { get; set; } = "primary";

    /// <summary>
    /// Success probability for user's skill level
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal SuccessProbability { get; set; }

    /// <summary>
    /// Strategic advantage of targeting this area
    /// </summary>
    public string StrategicAdvantage { get; set; } = string.Empty;

    /// <summary>
    /// Visual landmarks for aiming
    /// </summary>
    public List<string> VisualLandmarks { get; set; } = new();
}

/// <summary>
/// Hazard avoidance recommendation
/// </summary>
public class HazardAvoidance
{
    /// <summary>
    /// Hazard name/type
    /// </summary>
    public string HazardName { get; set; } = string.Empty;

    /// <summary>
    /// Avoidance strategy
    /// </summary>
    public string AvoidanceStrategy { get; set; } = string.Empty;

    /// <summary>
    /// Safety margin required for skill level
    /// </summary>
    public decimal SafetyMarginYards { get; set; }

    /// <summary>
    /// Penalty if hazard is encountered
    /// </summary>
    public string PenaltyDescription { get; set; } = string.Empty;

    /// <summary>
    /// Recovery options if hazard is hit
    /// </summary>
    public List<string> RecoveryOptions { get; set; } = new();
}

/// <summary>
/// Layup recommendation
/// </summary>
public class LayupRecommendation
{
    /// <summary>
    /// Whether layup is recommended for this skill level
    /// </summary>
    public bool IsRecommended { get; set; }

    /// <summary>
    /// Layup target distance
    /// </summary>
    public decimal TargetDistanceYards { get; set; }

    /// <summary>
    /// Recommended layup club
    /// </summary>
    public string RecommendedClub { get; set; } = string.Empty;

    /// <summary>
    /// Layup target area
    /// </summary>
    public string TargetArea { get; set; } = string.Empty;

    /// <summary>
    /// Benefits of laying up
    /// </summary>
    public List<string> Benefits { get; set; } = new();

    /// <summary>
    /// Next shot setup after layup
    /// </summary>
    public string NextShotSetup { get; set; } = string.Empty;
}

/// <summary>
/// Playing style advice (percentage play vs aggressive)
/// </summary>
public class PlayingStyleAdvice
{
    /// <summary>
    /// Recommended playing style for skill level
    /// </summary>
    public string RecommendedStyle { get; set; } = "percentage";

    /// <summary>
    /// Percentage play recommendation
    /// </summary>
    public PercentagePlay PercentagePlay { get; set; } = new();

    /// <summary>
    /// Aggressive play option
    /// </summary>
    public AggressivePlay AggressivePlay { get; set; } = new();

    /// <summary>
    /// When to be conservative vs aggressive
    /// </summary>
    public PlayingStyleGuidance StyleGuidance { get; set; } = new();
}

/// <summary>
/// Percentage play recommendation
/// </summary>
public class PercentagePlay
{
    /// <summary>
    /// Conservative target
    /// </summary>
    public string Target { get; set; } = string.Empty;

    /// <summary>
    /// Expected outcome
    /// </summary>
    public string ExpectedOutcome { get; set; } = string.Empty;

    /// <summary>
    /// Success rate for skill level
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal SuccessRate { get; set; }

    /// <summary>
    /// Benefits of percentage play
    /// </summary>
    public List<string> Benefits { get; set; } = new();
}

/// <summary>
/// Aggressive play option
/// </summary>
public class AggressivePlay
{
    /// <summary>
    /// Aggressive target
    /// </summary>
    public string Target { get; set; } = string.Empty;

    /// <summary>
    /// Potential reward
    /// </summary>
    public string PotentialReward { get; set; } = string.Empty;

    /// <summary>
    /// Risk factors
    /// </summary>
    public List<string> RiskFactors { get; set; } = new();

    /// <summary>
    /// Success rate for skill level
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal SuccessRate { get; set; }

    /// <summary>
    /// When aggressive play might be worthwhile
    /// </summary>
    public string WhenAppropriate { get; set; } = string.Empty;
}

/// <summary>
/// Playing style guidance
/// </summary>
public class PlayingStyleGuidance
{
    /// <summary>
    /// Situations favoring conservative play
    /// </summary>
    public List<string> ConservativeSituations { get; set; } = new();

    /// <summary>
    /// Situations favoring aggressive play
    /// </summary>
    public List<string> AggressiveSituations { get; set; } = new();

    /// <summary>
    /// Skill level considerations
    /// </summary>
    public string SkillLevelConsiderations { get; set; } = string.Empty;

    /// <summary>
    /// Course management philosophy
    /// </summary>
    public string CourseManagementPhilosophy { get; set; } = string.Empty;
}

/// <summary>
/// Technique tip
/// </summary>
public class TechniqueTip
{
    /// <summary>
    /// Technique category (grip, stance, swing, etc.)
    /// </summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Tip description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Why this tip helps
    /// </summary>
    public string Benefit { get; set; } = string.Empty;

    /// <summary>
    /// Common mistake this tip addresses
    /// </summary>
    public string AddressedMistake { get; set; } = string.Empty;

    /// <summary>
    /// Practice drill for this technique
    /// </summary>
    public string? PracticeDrill { get; set; }
}

/// <summary>
/// Skill development path
/// </summary>
public class SkillDevelopmentPath
{
    /// <summary>
    /// Current skill assessment
    /// </summary>
    public string CurrentSkillLevel { get; set; } = string.Empty;

    /// <summary>
    /// Next skill milestone
    /// </summary>
    public string NextMilestone { get; set; } = string.Empty;

    /// <summary>
    /// Skills to develop for improvement
    /// </summary>
    public List<SkillToImprove> SkillsToImprove { get; set; } = new();

    /// <summary>
    /// Practice plan recommendations
    /// </summary>
    public PracticePlan PracticePlan { get; set; } = new();

    /// <summary>
    /// Estimated timeline for improvement
    /// </summary>
    public string ImprovementTimeline { get; set; } = string.Empty;
}

/// <summary>
/// Skill to improve
/// </summary>
public class SkillToImprove
{
    /// <summary>
    /// Skill name
    /// </summary>
    public string SkillName { get; set; } = string.Empty;

    /// <summary>
    /// Current proficiency (1-10)
    /// </summary>
    [Range(1, 10)]
    public int CurrentProficiency { get; set; }

    /// <summary>
    /// Target proficiency
    /// </summary>
    [Range(1, 10)]
    public int TargetProficiency { get; set; }

    /// <summary>
    /// Improvement priority (high, medium, low)
    /// </summary>
    public string Priority { get; set; } = "medium";

    /// <summary>
    /// Practice exercises
    /// </summary>
    public List<string> PracticeExercises { get; set; } = new();
}

/// <summary>
/// Practice plan
/// </summary>
public class PracticePlan
{
    /// <summary>
    /// Recommended practice frequency
    /// </summary>
    public string Frequency { get; set; } = string.Empty;

    /// <summary>
    /// Practice session duration
    /// </summary>
    public TimeSpan SessionDuration { get; set; }

    /// <summary>
    /// Practice areas to focus on
    /// </summary>
    public List<PracticeArea> PracticeAreas { get; set; } = new();

    /// <summary>
    /// Skill assessment milestones
    /// </summary>
    public List<string> Milestones { get; set; } = new();
}

/// <summary>
/// Practice area
/// </summary>
public class PracticeArea
{
    /// <summary>
    /// Area name (driving range, short game, putting, etc.)
    /// </summary>
    public string AreaName { get; set; } = string.Empty;

    /// <summary>
    /// Time allocation percentage
    /// </summary>
    [Range(0, 100)]
    public int TimePercentage { get; set; }

    /// <summary>
    /// Specific drills for this area
    /// </summary>
    public List<string> Drills { get; set; } = new();

    /// <summary>
    /// Success metrics
    /// </summary>
    public List<string> SuccessMetrics { get; set; } = new();
}

/// <summary>
/// Skill alternative for challenging shots
/// </summary>
public class SkillAlternative
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
    /// Success probability for user's skill level
    /// </summary>
    [Range(0.0, 1.0)]
    public decimal SuccessProbability { get; set; }

    /// <summary>
    /// Benefits of this alternative
    /// </summary>
    public List<string> Benefits { get; set; } = new();

    /// <summary>
    /// Trade-offs compared to original shot
    /// </summary>
    public List<string> TradeOffs { get; set; } = new();
}

/// <summary>
/// Required skill for shot execution
/// </summary>
public class RequiredSkill
{
    /// <summary>
    /// Skill name
    /// </summary>
    public string SkillName { get; set; } = string.Empty;

    /// <summary>
    /// Required proficiency level (1-10)
    /// </summary>
    [Range(1, 10)]
    public int RequiredProficiency { get; set; }

    /// <summary>
    /// Importance for shot success (critical, important, helpful)
    /// </summary>
    public string Importance { get; set; } = "important";

    /// <summary>
    /// How to develop this skill
    /// </summary>
    public string DevelopmentSuggestion { get; set; } = string.Empty;
}