using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace caddie.portal.dal.Models;

/// <summary>
/// HoleScore DAL model representing individual hole performance data
/// </summary>
[Table("hole_scores")]
public class HoleScore
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("round_id")]
    public int RoundId { get; set; }

    [Required]
    [Column("hole_id")]
    public int HoleId { get; set; }

    [Required]
    [Column("hole_number")]
    [Range(1, 18)]
    public int HoleNumber { get; set; }

    [Column("score")]
    [Range(1, 15)]
    public int? Score { get; set; }

    [Column("putts")]
    [Range(0, 10)]
    public int? Putts { get; set; }

    [Column("fairway_hit")]
    public bool? FairwayHit { get; set; }

    [Column("green_in_regulation")]
    public bool? GreenInRegulation { get; set; }

    [Column("up_and_down")]
    public bool? UpAndDown { get; set; }

    [Column("sand_save")]
    public bool? SandSave { get; set; }

    [Column("penalty_strokes")]
    [Range(0, 5)]
    public int? PenaltyStrokes { get; set; }

    [Column("distance_to_pin_yards")]
    [Range(0, 500)]
    public int? DistanceToPinYards { get; set; }

    [Column("club_used")]
    [StringLength(50)]
    public string? ClubUsed { get; set; }

    [Column("lie_position")]
    [StringLength(20)]
    public string? LiePosition { get; set; }

    [Column("shot_notes")]
    public string? ShotNotes { get; set; }

    [Column("performance_notes")]
    public string? PerformanceNotes { get; set; }

    [Column("hole_metadata", TypeName = "jsonb")]
    public string? HoleMetadata { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("RoundId")]
    public virtual Round Round { get; set; } = null!;

    [ForeignKey("HoleId")]
    public virtual Hole Hole { get; set; } = null!;

    // Calculated properties
    [NotMapped]
    public int? ScoreToPar => Score.HasValue && Hole?.Par != null ? Score.Value - Hole.Par : null;

    [NotMapped]
    public bool IsComplete => Score.HasValue;

    [NotMapped]
    public bool IsBirdie => ScoreToPar == -1;

    [NotMapped]
    public bool IsEagle => ScoreToPar == -2;

    [NotMapped]
    public bool IsAlbatross => ScoreToPar <= -3;

    [NotMapped]
    public bool IsPar => ScoreToPar == 0;

    [NotMapped]
    public bool IsBogey => ScoreToPar == 1;

    [NotMapped]
    public bool IsDoubleBogey => ScoreToPar == 2;

    [NotMapped]
    public bool IsTripleBogeyOrWorse => ScoreToPar >= 3;

    /// <summary>
    /// Validates if the hole score data is consistent and valid
    /// </summary>
    public bool IsValid()
    {
        // Basic validation rules
        if (HoleNumber < 1 || HoleNumber > 18) return false;
        if (Score.HasValue && (Score < 1 || Score > 15)) return false;
        if (Putts.HasValue && (Putts < 0 || Putts > 10)) return false;
        if (PenaltyStrokes.HasValue && (PenaltyStrokes < 0 || PenaltyStrokes > 5)) return false;
        if (DistanceToPinYards.HasValue && (DistanceToPinYards < 0 || DistanceToPinYards > 500)) return false;

        // Business logic validation
        if (Score.HasValue && Putts.HasValue && Putts > Score) return false; // More putts than total score
        if (FairwayHit == true && Hole?.Par == 3) return false; // Par 3s don't have fairways to hit
        if (GreenInRegulation == true && !Score.HasValue) return false; // GIR requires a score

        return true;
    }

    /// <summary>
    /// Gets a performance summary for this hole
    /// </summary>
    public string GetPerformanceSummary()
    {
        if (!Score.HasValue) return "Not scored";

        var summary = new List<string>();

        if (IsAlbatross) summary.Add("Albatross!");
        else if (IsEagle) summary.Add("Eagle!");
        else if (IsBirdie) summary.Add("Birdie");
        else if (IsPar) summary.Add("Par");
        else if (IsBogey) summary.Add("Bogey");
        else if (IsDoubleBogey) summary.Add("Double Bogey");
        else if (IsTripleBogeyOrWorse) summary.Add($"+{ScoreToPar}");

        if (FairwayHit == true) summary.Add("Fairway");
        if (GreenInRegulation == true) summary.Add("GIR");
        if (UpAndDown == true) summary.Add("Up & Down");
        if (SandSave == true) summary.Add("Sand Save");

        return summary.Any() ? string.Join(", ", summary) : "Scored";
    }
}