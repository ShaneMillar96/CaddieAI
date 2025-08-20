using Microsoft.Extensions.Logging;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;
using caddie.portal.services.Constants;

namespace caddie.portal.services.Services;

/// <summary>
/// Service for intelligent shot type detection based on golf context
/// </summary>
public class ShotTypeDetectionService : IShotTypeDetectionService
{
    private readonly ILogger<ShotTypeDetectionService> _logger;

    public ShotTypeDetectionService(ILogger<ShotTypeDetectionService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Detect shot type based on current golf context and location
    /// </summary>
    public async Task<ShotTypeDetectionResult> DetectShotTypeAsync(ShotTypeContext context)
    {
        try
        {
            _logger.LogInformation("Detecting shot type for hole {CurrentHole}", context.CurrentHole);

            var result = new ShotTypeDetectionResult
            {
                DetectedAt = DateTime.UtcNow
            };

            // Calculate distance to pin
            var distanceToPinYards = context.ShotContext?.DistanceToPinYards ?? 
                CalculateDistanceToPin(context.CurrentLocation, context.GolfContext.CurrentHole);

            // Analyze position on hole
            var positionAnalysis = context.GolfContext.CurrentHole != null 
                ? await AnalyzePositionAsync(
                    context.CurrentLocation, 
                    context.GolfContext.CurrentHole, 
                    distanceToPinYards)
                : new PositionAnalysis { Position = "unknown", Confidence = 0.5m };

            result.PositionAnalysis = positionAnalysis;

            // Create distance factors
            result.DistanceFactors = new DistanceFactors
            {
                DistanceToPinYards = distanceToPinYards,
                DistanceFromTeeYards = CalculateDistanceFromTee(context),
                EffectiveDistanceYards = AdjustForConditions(distanceToPinYards, context.ShotContext?.Weather)
            };

            // Determine shot type based on multiple factors
            result.ShotType = DeterminePrimaryShotType(distanceToPinYards, positionAnalysis, context);
            result.Confidence = CalculateDetectionConfidence(result.ShotType, distanceToPinYards, positionAnalysis);
            result.Reasoning = GenerateDetectionReasoning(result.ShotType, distanceToPinYards, positionAnalysis, context);

            // Generate alternative shot types
            result.Alternatives = GenerateAlternativeShotTypes(result.ShotType, distanceToPinYards, positionAnalysis);

            // Identify influencing factors
            result.InfluencingFactors = IdentifyInfluencingFactors(distanceToPinYards, positionAnalysis, context);

            _logger.LogInformation("Shot type detected: {ShotType} with confidence {Confidence}", 
                result.ShotType, result.Confidence);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error detecting shot type");
            
            // Return fallback general shot
            return new ShotTypeDetectionResult
            {
                ShotType = ShotTypes.GeneralShot,
                Confidence = 0.5m,
                Reasoning = "Error occurred during detection, defaulting to general shot",
                DetectedAt = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Analyze position on hole based on location and distance
    /// </summary>
    public async Task<PositionAnalysis> AnalyzePositionAsync(
        LocationContext currentLocation, 
        HoleContext holeContext, 
        decimal distanceToPinYards)
    {
        var position = new PositionAnalysis
        {
            Confidence = 0.7m // Default confidence
        };

        // Determine position based on distance and hole context
        if (distanceToPinYards <= 5)
        {
            position.Position = PositionTypes.Green;
            position.Confidence = 0.9m;
            position.StrategicAssessment = "On or very near the green";
        }
        else if (distanceToPinYards <= 30)
        {
            position.Position = PositionTypes.FringeApron;
            position.Confidence = 0.8m;
            position.StrategicAssessment = "Short game area around the green";
        }
        else if (distanceToPinYards <= 100)
        {
            position.Position = PositionTypes.Fairway;
            position.Confidence = 0.7m;
            position.StrategicAssessment = "Approach shot range";
        }
        else if (holeContext?.HoleNumber <= 18 && distanceToPinYards >= (holeContext.Yardage ?? 400) * 0.8m)
        {
            position.Position = PositionTypes.TeeBox;
            position.Confidence = 0.85m;
            position.StrategicAssessment = "Near tee box position";
        }
        else
        {
            position.Position = PositionTypes.Fairway;
            position.Confidence = 0.6m;
            position.StrategicAssessment = "Middle distance fairway position";
        }

        // Add lie characteristics
        position.LieInfo = GenerateLieCharacteristics(position.Position);

        return await Task.FromResult(position);
    }

    /// <summary>
    /// Determine shot difficulty based on context
    /// </summary>
    public async Task<ShotDifficultyAssessment> AssessShotDifficultyAsync(
        string shotType, 
        GolfContext context, 
        string userSkillLevel)
    {
        var assessment = new ShotDifficultyAssessment();

        // Base difficulty by shot type
        var baseDifficulty = GetBaseShotTypeDifficulty(shotType);
        assessment.DifficultyLevel = baseDifficulty;

        // Adjust for user skill level
        assessment.SkillLevelMatch = AssessSkillLevelMatch(shotType, baseDifficulty, userSkillLevel);
        assessment.SuccessProbability = CalculateSuccessProbability(baseDifficulty, userSkillLevel);

        // Add difficulty factors
        assessment.DifficultyFactors = await GenerateDifficultyFactors(shotType, context);

        // Set difficulty category
        assessment.DifficultyCategory = assessment.DifficultyLevel switch
        {
            <= 3 => "easy",
            <= 5 => "moderate", 
            <= 7 => "challenging",
            _ => "very_difficult"
        };

        // Generate risk assessment
        assessment.RiskAssessment = GenerateRiskAssessment(shotType, assessment.DifficultyLevel, context);

        return assessment;
    }

    /// <summary>
    /// Get typical distance ranges for different shot types
    /// </summary>
    public ShotDistanceRange GetShotDistanceRange(string shotType)
    {
        return shotType switch
        {
            ShotTypes.Drive => new ShotDistanceRange
            {
                ShotType = shotType,
                MinDistanceYards = 200,
                MaxDistanceYards = 400,
                Description = "Long distance tee shots",
                Characteristics = new List<string> { "Power", "Distance", "Accuracy important" }
            },
            ShotTypes.TeeShotPar3 => new ShotDistanceRange
            {
                ShotType = shotType,
                MinDistanceYards = 100,
                MaxDistanceYards = 250,
                Description = "Tee shots on par 3 holes",
                Characteristics = new List<string> { "Accuracy crucial", "Target the green", "Club selection key" }
            },
            ShotTypes.ApproachShot => new ShotDistanceRange
            {
                ShotType = shotType,
                MinDistanceYards = 80,
                MaxDistanceYards = 200,
                Description = "Mid-distance approach to green",
                Characteristics = new List<string> { "Precision", "Green targeting", "Spin control" }
            },
            ShotTypes.ChipShot => new ShotDistanceRange
            {
                ShotType = shotType,
                MinDistanceYards = 5,
                MaxDistanceYards = 40,
                Description = "Short shots around the green",
                Characteristics = new List<string> { "Low trajectory", "Roll control", "Precision" }
            },
            ShotTypes.PitchShot => new ShotDistanceRange
            {
                ShotType = shotType,
                MinDistanceYards = 20,
                MaxDistanceYards = 80,
                Description = "High, soft shots to green",
                Characteristics = new List<string> { "High trajectory", "Soft landing", "Spin" }
            },
            ShotTypes.BunkerShot => new ShotDistanceRange
            {
                ShotType = shotType,
                MinDistanceYards = 10,
                MaxDistanceYards = 60,
                Description = "Shots from sand bunkers",
                Characteristics = new List<string> { "Sand technique", "High trajectory", "Escape focus" }
            },
            ShotTypes.Putt => new ShotDistanceRange
            {
                ShotType = shotType,
                MinDistanceYards = 0,
                MaxDistanceYards = 20,
                Description = "Shots on the green",
                Characteristics = new List<string> { "Rolling ball", "Green reading", "Distance control" }
            },
            _ => new ShotDistanceRange
            {
                ShotType = shotType,
                MinDistanceYards = 0,
                MaxDistanceYards = 400,
                Description = "General golf shot",
                Characteristics = new List<string> { "Varies by situation" }
            }
        };
    }

    #region Private Helper Methods

    private decimal CalculateDistanceToPin(LocationContext location, HoleContext? hole)
    {
        // Simplified distance calculation - in real implementation would use precise GPS
        // For now, estimate based on hole yardage if available
        if (hole?.Yardage.HasValue == true)
        {
            // Assume player is roughly in middle of hole for initial calculation
            return (decimal)(hole.Yardage.Value * 0.5);
        }
        
        return 150m; // Default assumption
    }

    private decimal? CalculateDistanceFromTee(ShotTypeContext context)
    {
        if (context.GolfContext.CurrentHole?.Yardage.HasValue == true)
        {
            var totalYardage = context.GolfContext.CurrentHole.Yardage.Value;
            var distanceToPin = context.ShotContext?.DistanceToPinYards ?? 150m;
            return (decimal)(totalYardage) - distanceToPin;
        }
        
        return null;
    }

    private decimal AdjustForConditions(decimal distance, WeatherContext? weather)
    {
        var adjustedDistance = distance;
        
        if (weather != null)
        {
            // Adjust for wind (simplified)
            if (weather.WindSpeed.HasValue && weather.WindSpeed > 10)
            {
                adjustedDistance *= 1.05m; // Add 5% for windy conditions
            }
            
            // Adjust for temperature (simplified)
            if (weather.Temperature.HasValue)
            {
                if (weather.Temperature < 50) adjustedDistance *= 1.02m; // Cold air is denser
                if (weather.Temperature > 85) adjustedDistance *= 0.98m; // Hot air is thinner
            }
        }
        
        return adjustedDistance;
    }

    private string DeterminePrimaryShotType(decimal distanceYards, PositionAnalysis position, ShotTypeContext context)
    {
        // Primary logic for shot type detection
        
        // Putting distance
        if (distanceYards <= 5 && position.Position == PositionTypes.Green)
        {
            return ShotTypes.Putt;
        }
        
        // Chip shot range
        if (distanceYards <= 30 && 
            (position.Position == PositionTypes.FringeApron || position.Position == PositionTypes.Green))
        {
            return ShotTypes.ChipShot;
        }
        
        // Pitch shot range
        if (distanceYards > 30 && distanceYards <= 80)
        {
            return ShotTypes.PitchShot;
        }
        
        // Bunker shot
        if (position.Position == PositionTypes.Bunker)
        {
            return ShotTypes.BunkerShot;
        }
        
        // Tee shots
        if (position.Position == PositionTypes.TeeBox)
        {
            var hole = context.GolfContext.CurrentHole;
            if (hole?.Par == 3)
            {
                return ShotTypes.TeeShotPar3;
            }
            return ShotTypes.Drive;
        }
        
        // Approach shots
        if (distanceYards > 80 && distanceYards <= 200)
        {
            return ShotTypes.ApproachShot;
        }
        
        // Recovery or layup for difficult positions
        if (position.Position == PositionTypes.Trees || position.Position == PositionTypes.Rough)
        {
            return distanceYards > 150 ? ShotTypes.LayupShot : ShotTypes.RecoveryShot;
        }
        
        // Default to general shot
        return ShotTypes.GeneralShot;
    }

    private decimal CalculateDetectionConfidence(string shotType, decimal distance, PositionAnalysis position)
    {
        var baseConfidence = 0.7m;
        
        // Increase confidence for clear scenarios
        if ((shotType == ShotTypes.Putt && distance <= 5) ||
            (shotType == ShotTypes.ChipShot && distance <= 30) ||
            (shotType == ShotTypes.BunkerShot && position.Position == PositionTypes.Bunker))
        {
            baseConfidence = 0.9m;
        }
        
        // Adjust based on position confidence
        return Math.Min(baseConfidence + (position.Confidence - 0.7m), 1.0m);
    }

    private string GenerateDetectionReasoning(
        string shotType, 
        decimal distance, 
        PositionAnalysis position, 
        ShotTypeContext context)
    {
        var reasons = new List<string>();
        
        reasons.Add($"Distance to pin: {distance:F0} yards");
        reasons.Add($"Position: {position.Position}");
        
        if (context.GolfContext.CurrentHole != null)
        {
            reasons.Add($"Hole {context.GolfContext.CurrentHole.HoleNumber} (Par {context.GolfContext.CurrentHole.Par})");
        }
        
        var specificReason = shotType switch
        {
            ShotTypes.Putt => "On or very near the green",
            ShotTypes.ChipShot => "Short distance around green area",
            ShotTypes.PitchShot => "Mid-short distance requiring high trajectory",
            ShotTypes.ApproachShot => "Mid-distance approach to green",
            ShotTypes.Drive => "Tee shot on par 4/5 hole",
            ShotTypes.TeeShotPar3 => "Tee shot on par 3 hole",
            ShotTypes.BunkerShot => "Ball in sand bunker",
            _ => "General golf situation"
        };
        
        reasons.Add(specificReason);
        
        return string.Join(". ", reasons);
    }

    private List<AlternativeShotType> GenerateAlternativeShotTypes(
        string primaryShotType, 
        decimal distance, 
        PositionAnalysis position)
    {
        var alternatives = new List<AlternativeShotType>();
        
        // Add alternatives based on distance ranges that overlap
        if (distance >= 20 && distance <= 40 && primaryShotType != ShotTypes.ChipShot)
        {
            alternatives.Add(new AlternativeShotType
            {
                ShotType = ShotTypes.ChipShot,
                Probability = 0.3m,
                Reason = "Distance range overlap for short game"
            });
        }
        
        if (distance >= 60 && distance <= 100 && primaryShotType != ShotTypes.PitchShot)
        {
            alternatives.Add(new AlternativeShotType
            {
                ShotType = ShotTypes.PitchShot,
                Probability = 0.25m,
                Reason = "Could be played as pitch shot"
            });
        }
        
        // Always include general shot as fallback
        if (primaryShotType != ShotTypes.GeneralShot)
        {
            alternatives.Add(new AlternativeShotType
            {
                ShotType = ShotTypes.GeneralShot,
                Probability = 0.15m,
                Reason = "General shot approach possible"
            });
        }
        
        return alternatives;
    }

    private List<string> IdentifyInfluencingFactors(
        decimal distance, 
        PositionAnalysis position, 
        ShotTypeContext context)
    {
        var factors = new List<string>
        {
            $"Distance: {distance:F0} yards",
            $"Position: {position.Position}"
        };
        
        if (context.GolfContext.CurrentHole != null)
        {
            factors.Add($"Hole par: {context.GolfContext.CurrentHole.Par}");
        }
        
        if (context.ShotContext?.Weather != null)
        {
            var weather = context.ShotContext.Weather;
            if (weather.WindSpeed > 10)
            {
                factors.Add($"Wind: {weather.WindSpeed} mph {weather.WindDirection}");
            }
        }
        
        if (position.LieInfo?.Quality != "good")
        {
            factors.Add($"Lie quality: {position.LieInfo?.Quality}");
        }
        
        return factors;
    }

    private LieCharacteristics GenerateLieCharacteristics(string position)
    {
        return position switch
        {
            PositionTypes.TeeBox => new LieCharacteristics
            {
                Quality = "excellent",
                Surface = "tee",
                GrassCondition = "perfect"
            },
            PositionTypes.Fairway => new LieCharacteristics
            {
                Quality = "good",
                Surface = "fairway grass",
                GrassCondition = "good"
            },
            PositionTypes.Green => new LieCharacteristics
            {
                Quality = "excellent",
                Surface = "putting green",
                GrassCondition = "perfect"
            },
            PositionTypes.Rough => new LieCharacteristics
            {
                Quality = "fair",
                Surface = "rough grass",
                GrassCondition = "thick"
            },
            PositionTypes.Bunker => new LieCharacteristics
            {
                Quality = "poor",
                Surface = "sand",
                GrassCondition = "none"
            },
            _ => new LieCharacteristics
            {
                Quality = "fair",
                Surface = "grass",
                GrassCondition = "average"
            }
        };
    }

    private int GetBaseShotTypeDifficulty(string shotType)
    {
        return shotType switch
        {
            ShotTypes.Putt => 3,
            ShotTypes.ChipShot => 4,
            ShotTypes.TeeShotPar3 => 5,
            ShotTypes.PitchShot => 5,
            ShotTypes.ApproachShot => 6,
            ShotTypes.Drive => 6,
            ShotTypes.BunkerShot => 7,
            ShotTypes.RecoveryShot => 8,
            ShotTypes.LayupShot => 4,
            _ => 5
        };
    }

    private string AssessSkillLevelMatch(string shotType, int difficulty, string skillLevel)
    {
        var skillDifficulty = skillLevel.ToLower() switch
        {
            "beginner" => 3,
            "intermediate" => 6,
            "advanced" => 8,
            "professional" => 10,
            _ => 5
        };

        return difficulty switch
        {
            _ when difficulty <= skillDifficulty - 2 => "easy",
            _ when difficulty <= skillDifficulty + 1 => "appropriate",
            _ when difficulty <= skillDifficulty + 3 => "challenging",
            _ => "very_difficult"
        };
    }

    private decimal CalculateSuccessProbability(int difficulty, string skillLevel)
    {
        var skillMultiplier = skillLevel.ToLower() switch
        {
            "beginner" => 0.6m,
            "intermediate" => 0.75m,
            "advanced" => 0.85m,
            "professional" => 0.95m,
            _ => 0.7m
        };

        var baseProbability = difficulty switch
        {
            <= 3 => 0.85m,
            <= 5 => 0.7m,
            <= 7 => 0.55m,
            <= 9 => 0.4m,
            _ => 0.25m
        };

        return Math.Min(baseProbability * skillMultiplier, 0.95m);
    }

    private async Task<List<DifficultyFactor>> GenerateDifficultyFactors(string shotType, GolfContext context)
    {
        var factors = new List<DifficultyFactor>();

        // Distance factor
        if (context.Location?.DistanceToPinMeters > 150)
        {
            factors.Add(new DifficultyFactor
            {
                Factor = "Distance",
                Severity = 3,
                Description = "Long distance shot requires power and accuracy"
            });
        }

        // Weather factors
        if (context.Weather?.WindSpeed > 15)
        {
            factors.Add(new DifficultyFactor
            {
                Factor = "Wind",
                Severity = 4,
                Description = "Strong wind affects ball flight significantly"
            });
        }

        return await Task.FromResult(factors);
    }

    private RiskAssessment GenerateRiskAssessment(string shotType, int difficulty, GolfContext context)
    {
        var risk = new RiskAssessment();

        risk.RiskLevel = difficulty switch
        {
            <= 3 => "low",
            <= 5 => "moderate",
            <= 7 => "high", 
            _ => "very_high"
        };

        // Add potential penalties based on shot type
        risk.PotentialPenalties = shotType switch
        {
            ShotTypes.BunkerShot => new List<string> { "Staying in bunker", "Flying over green" },
            ShotTypes.Drive => new List<string> { "Out of bounds", "Water hazard", "Deep rough" },
            ShotTypes.RecoveryShot => new List<string> { "Worse position", "Penalty strokes" },
            _ => new List<string> { "Miss target", "Poor position" }
        };

        return risk;
    }

    #endregion
}