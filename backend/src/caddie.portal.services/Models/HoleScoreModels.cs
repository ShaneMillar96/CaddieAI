namespace caddie.portal.services.Models;

/// <summary>
/// HoleScore service model for business logic layer
/// </summary>
public class HoleScoreModel
{
    public int Id { get; set; }
    public int RoundId { get; set; }
    public int HoleId { get; set; }
    public int HoleNumber { get; set; }
    public int? Score { get; set; }
    public int? Putts { get; set; }
    public bool? FairwayHit { get; set; }
    public bool? GreenInRegulation { get; set; }
    public bool? UpAndDown { get; set; }
    public bool? SandSave { get; set; }
    public int? PenaltyStrokes { get; set; }
    public int? DistanceToPinYards { get; set; }
    public string? ClubUsed { get; set; }
    public string? LiePosition { get; set; }
    public string? ShotNotes { get; set; }
    public string? PerformanceNotes { get; set; }
    public string? Notes { get; set; }
    public Dictionary<string, object>? HoleMetadata { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Associated hole information
    public HoleModel? Hole { get; set; }
    
    // Calculated properties
    public int? ScoreToPar => Score.HasValue && Hole?.Par != null ? Score.Value - Hole.Par : null;
    public bool IsComplete => Score.HasValue;
    public string PerformanceSummary => GeneratePerformanceSummary();

    private string GeneratePerformanceSummary()
    {
        if (!Score.HasValue) return "Not scored";

        var summary = new List<string>();
        var scoreToPar = ScoreToPar;

        if (scoreToPar <= -3) summary.Add("Albatross!");
        else if (scoreToPar == -2) summary.Add("Eagle!");
        else if (scoreToPar == -1) summary.Add("Birdie");
        else if (scoreToPar == 0) summary.Add("Par");
        else if (scoreToPar == 1) summary.Add("Bogey");
        else if (scoreToPar == 2) summary.Add("Double Bogey");
        else if (scoreToPar >= 3) summary.Add($"+{scoreToPar}");

        if (FairwayHit == true) summary.Add("Fairway");
        if (GreenInRegulation == true) summary.Add("GIR");
        if (UpAndDown == true) summary.Add("Up & Down");
        if (SandSave == true) summary.Add("Sand Save");

        return summary.Any() ? string.Join(", ", summary) : "Scored";
    }
}

/// <summary>
/// Create HoleScore model for service layer
/// </summary>
public class CreateHoleScoreModel
{
    public int HoleNumber { get; set; }
    public int? Score { get; set; }
    public int? Putts { get; set; }
    public bool? FairwayHit { get; set; }
    public bool? GreenInRegulation { get; set; }
    public bool? UpAndDown { get; set; }
    public bool? SandSave { get; set; }
    public int? PenaltyStrokes { get; set; }
    public int? DistanceToPinYards { get; set; }
    public string? ClubUsed { get; set; }
    public string? LiePosition { get; set; }
    public string? ShotNotes { get; set; }
    public string? PerformanceNotes { get; set; }
    public string? Notes { get; set; }
    public Dictionary<string, object>? HoleMetadata { get; set; }
}

/// <summary>
/// Update HoleScore model for service layer
/// </summary>
public class UpdateHoleScoreModel
{
    public int? Score { get; set; }
    public int? Putts { get; set; }
    public bool? FairwayHit { get; set; }
    public bool? GreenInRegulation { get; set; }
    public bool? UpAndDown { get; set; }
    public bool? SandSave { get; set; }
    public int? PenaltyStrokes { get; set; }
    public int? DistanceToPinYards { get; set; }
    public string? ClubUsed { get; set; }
    public string? LiePosition { get; set; }
    public string? ShotNotes { get; set; }
    public string? PerformanceNotes { get; set; }
    public string? Notes { get; set; }
    public Dictionary<string, object>? HoleMetadata { get; set; }
}

/// <summary>
/// HoleScore summary model for round analysis
/// </summary>
public class HoleScoreSummaryModel
{
    public int RoundId { get; set; }
    public int TotalHolesScored { get; set; }
    public int? TotalScore { get; set; }
    public int? TotalPutts { get; set; }
    public int? FairwaysHit { get; set; }
    public int? GreensInRegulation { get; set; }
    public int? UpAndDowns { get; set; }
    public int? SandSaves { get; set; }
    public int? TotalPenaltyStrokes { get; set; }
    public double? AverageScore { get; set; }
    public double? AveragePutts { get; set; }
    public double? FairwayPercentage { get; set; }
    public double? GirPercentage { get; set; }
    public List<HoleScoreModel> HoleScores { get; set; } = new();
    
    // Performance analysis
    public int BirdiesOrBetter { get; set; }
    public int Pars { get; set; }
    public int BoreysOrWorse { get; set; }
    public int ScoreToPar { get; set; }
    
    /// <summary>
    /// Calculates summary statistics from hole scores
    /// </summary>
    public static HoleScoreSummaryModel FromHoleScores(int roundId, IEnumerable<HoleScoreModel> holeScores)
    {
        var scores = holeScores.ToList();
        var scoredHoles = scores.Where(h => h.IsComplete).ToList();
        
        var summary = new HoleScoreSummaryModel
        {
            RoundId = roundId,
            TotalHolesScored = scoredHoles.Count,
            HoleScores = scores
        };
        
        if (scoredHoles.Any())
        {
            summary.TotalScore = scoredHoles.Sum(h => h.Score);
            summary.TotalPutts = scoredHoles.Where(h => h.Putts.HasValue).Sum(h => h.Putts);
            summary.FairwaysHit = scoredHoles.Count(h => h.FairwayHit == true);
            summary.GreensInRegulation = scoredHoles.Count(h => h.GreenInRegulation == true);
            summary.UpAndDowns = scoredHoles.Count(h => h.UpAndDown == true);
            summary.SandSaves = scoredHoles.Count(h => h.SandSave == true);
            summary.TotalPenaltyStrokes = scoredHoles.Where(h => h.PenaltyStrokes.HasValue).Sum(h => h.PenaltyStrokes);
            
            summary.AverageScore = scoredHoles.Average(h => h.Score ?? 0);
            var puttScores = scoredHoles.Where(h => h.Putts.HasValue).ToList();
            if (puttScores.Any())
            {
                summary.AveragePutts = puttScores.Average(h => h.Putts ?? 0);
            }
            
            // Calculate percentages for relevant holes
            var drivingHoles = scoredHoles.Where(h => h.Hole?.Par > 3).ToList();
            if (drivingHoles.Any())
            {
                summary.FairwayPercentage = (double)summary.FairwaysHit / drivingHoles.Count * 100;
            }
            
            summary.GirPercentage = (double)summary.GreensInRegulation / scoredHoles.Count * 100;
            
            // Performance analysis
            summary.BirdiesOrBetter = scoredHoles.Count(h => h.ScoreToPar <= -1);
            summary.Pars = scoredHoles.Count(h => h.ScoreToPar == 0);
            summary.BoreysOrWorse = scoredHoles.Count(h => h.ScoreToPar >= 1);
            summary.ScoreToPar = scoredHoles.Where(h => h.ScoreToPar.HasValue).Sum(h => h.ScoreToPar ?? 0);
        }
        
        return summary;
    }
}