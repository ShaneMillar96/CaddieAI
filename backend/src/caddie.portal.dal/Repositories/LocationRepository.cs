using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NetTopologySuite.Geometries;
using caddie.portal.dal.Context;
using caddie.portal.dal.Models;
using caddie.portal.dal.Repositories.Interfaces;
using Location = caddie.portal.dal.Models.Location;

namespace caddie.portal.dal.Repositories;

public class LocationRepository : ILocationRepository
{
    private readonly CaddieAIDbContext _context;
    private readonly ILogger<LocationRepository> _logger;

    public LocationRepository(CaddieAIDbContext context, ILogger<LocationRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region Basic CRUD Operations

    public async Task<Location?> GetByIdAsync(int id)
    {
        try
        {
            return await _context.Locations
                .FirstOrDefaultAsync(l => l.Id == id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting location by ID {LocationId}", id);
            throw;
        }
    }

    public async Task<Location?> GetByIdWithDetailsAsync(int id)
    {
        try
        {
            return await _context.Locations
                .Include(l => l.User)
                .Include(l => l.Round)
                .Include(l => l.Course)
                .FirstOrDefaultAsync(l => l.Id == id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting location with details by ID {LocationId}", id);
            throw;
        }
    }

    public async Task<IEnumerable<Location>> GetByUserIdAsync(int userId)
    {
        try
        {
            return await _context.Locations
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.Timestamp)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting locations by user ID {UserId}", userId);
            throw;
        }
    }

    public async Task<IEnumerable<Location>> GetByRoundIdAsync(int roundId)
    {
        try
        {
            return await _context.Locations
                .Where(l => l.RoundId == roundId)
                .OrderBy(l => l.Timestamp)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting locations by round ID {RoundId}", roundId);
            throw;
        }
    }

    public async Task<IEnumerable<Location>> GetByRoundIdSinceAsync(int roundId, DateTime since)
    {
        try
        {
            return await _context.Locations
                .Where(l => l.RoundId == roundId && l.Timestamp >= since)
                .OrderBy(l => l.Timestamp)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting locations by round ID {RoundId} since {Since}", roundId, since);
            throw;
        }
    }

    public async Task<IEnumerable<Location>> GetByCourseIdAsync(int courseId)
    {
        try
        {
            return await _context.Locations
                .Where(l => l.CourseId == courseId)
                .OrderByDescending(l => l.Timestamp)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting locations by course ID {CourseId}", courseId);
            throw;
        }
    }

    public async Task<Location> CreateAsync(Location location)
    {
        try
        {
            location.CreatedAt = DateTime.UtcNow;
            location.UpdatedAt = DateTime.UtcNow;
            location.Timestamp ??= DateTime.UtcNow;

            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Location created successfully with ID {LocationId}", location.Id);
            return location;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating location for user {UserId}", location.UserId);
            throw;
        }
    }

    public async Task<Location> UpdateAsync(Location location)
    {
        try
        {
            location.UpdatedAt = DateTime.UtcNow;
            _context.Locations.Update(location);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Location updated successfully with ID {LocationId}", location.Id);
            return location;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating location {LocationId}", location.Id);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        try
        {
            var location = await _context.Locations.FindAsync(id);
            if (location == null)
                return false;

            _context.Locations.Remove(location);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Location deleted successfully with ID {LocationId}", id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting location {LocationId}", id);
            throw;
        }
    }

    public async Task<bool> ExistsAsync(int id)
    {
        try
        {
            return await _context.Locations.AnyAsync(l => l.Id == id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if location exists {LocationId}", id);
            throw;
        }
    }

    #endregion

    #region Location Tracking Queries

    public async Task<Location?> GetLatestLocationByUserIdAsync(int userId)
    {
        try
        {
            return await _context.Locations
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.Timestamp)
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting latest location for user {UserId}", userId);
            throw;
        }
    }

    public async Task<Location?> GetLatestLocationByRoundIdAsync(int roundId)
    {
        try
        {
            return await _context.Locations
                .Where(l => l.RoundId == roundId)
                .OrderByDescending(l => l.Timestamp)
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting latest location for round {RoundId}", roundId);
            throw;
        }
    }

    public async Task<IEnumerable<Location>> GetLocationHistoryAsync(int userId, DateTime startTime, DateTime endTime)
    {
        try
        {
            return await _context.Locations
                .Where(l => l.UserId == userId && 
                           l.Timestamp >= startTime && 
                           l.Timestamp <= endTime)
                .OrderBy(l => l.Timestamp)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting location history for user {UserId}", userId);
            throw;
        }
    }

    public async Task<IEnumerable<Location>> GetRoundLocationHistoryAsync(int roundId)
    {
        try
        {
            return await _context.Locations
                .Where(l => l.RoundId == roundId)
                .OrderBy(l => l.Timestamp)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting round location history for round {RoundId}", roundId);
            throw;
        }
    }

    public async Task<IEnumerable<Location>> GetLocationsByTimeRangeAsync(int userId, DateTime startTime, DateTime endTime)
    {
        try
        {
            return await _context.Locations
                .Where(l => l.UserId == userId && 
                           l.Timestamp >= startTime && 
                           l.Timestamp <= endTime)
                .OrderBy(l => l.Timestamp)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting locations by time range for user {UserId}", userId);
            throw;
        }
    }

    #endregion

    #region Geospatial Distance Calculations

    public async Task<decimal?> CalculateDistanceToTeeAsync(int userId, int courseId, int holeNumber)
    {
        try
        {
            var latestLocation = await GetLatestLocationByUserIdAsync(userId);
            if (latestLocation == null)
                return null;

            return await CalculateDistanceFromPointAsync(
                latestLocation.Latitude, 
                latestLocation.Longitude, 
                courseId, 
                holeNumber, 
                "tee");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating distance to tee for user {UserId}", userId);
            throw;
        }
    }

    public async Task<decimal?> CalculateDistanceToPinAsync(int userId, int courseId, int holeNumber)
    {
        try
        {
            var latestLocation = await GetLatestLocationByUserIdAsync(userId);
            if (latestLocation == null)
                return null;

            return await CalculateDistanceFromPointAsync(
                latestLocation.Latitude, 
                latestLocation.Longitude, 
                courseId, 
                holeNumber, 
                "pin");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating distance to pin for user {UserId}", userId);
            throw;
        }
    }

    public async Task<decimal?> CalculateDistanceBetweenLocationsAsync(int locationId1, int locationId2)
    {
        try
        {
            var location1 = await GetByIdAsync(locationId1);
            var location2 = await GetByIdAsync(locationId2);

            if (location1 == null || location2 == null)
                return null;

            // Use PostGIS ST_Distance function for accurate distance calculation
            var distance = await _context.Database
                .SqlQueryRaw<decimal>(
                    @"SELECT ST_Distance(
                        ST_Transform(ST_SetSRID(ST_MakePoint({0}, {1}), 4326), 3857),
                        ST_Transform(ST_SetSRID(ST_MakePoint({2}, {3}), 4326), 3857)
                    ) as Value",
                    location1.Longitude, location1.Latitude,
                    location2.Longitude, location2.Latitude)
                .FirstOrDefaultAsync();

            return distance;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating distance between locations {LocationId1} and {LocationId2}", 
                locationId1, locationId2);
            throw;
        }
    }

    public async Task<decimal?> CalculateDistanceFromPointAsync(decimal latitude, decimal longitude, int courseId, int holeNumber, string targetType)
    {
        try
        {
            string targetColumnPrefix = targetType.ToLower() switch
            {
                "tee" => "tee",
                "pin" => "pin",
                "flag" => "pin",
                _ => "tee"
            };

            // Get hole information with target position
            var hole = await _context.Holes
                .Where(h => h.CourseId == courseId && h.HoleNumber == holeNumber)
                .FirstOrDefaultAsync();

            if (hole?.TeeLocation == null)
                return null;

            Point targetLocation = targetColumnPrefix == "pin" && hole.PinLocation != null 
                ? hole.PinLocation 
                : hole.TeeLocation;

            // Use PostGIS ST_Distance function for accurate distance calculation
            var distance = await _context.Database
                .SqlQueryRaw<decimal>(
                    @"SELECT ST_Distance(
                        ST_Transform(ST_SetSRID(ST_MakePoint({0}, {1}), 4326), 3857),
                        ST_Transform(ST_GeomFromWKB({2}, 4326), 3857)
                    ) as Value",
                    longitude, latitude, targetLocation.AsBinary())
                .FirstOrDefaultAsync();

            return distance;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating distance from point to {TargetType} for hole {HoleNumber}", 
                targetType, holeNumber);
            throw;
        }
    }

    #endregion

    #region Course Boundary Detection

    public async Task<bool> IsWithinCourseBoundaryAsync(decimal latitude, decimal longitude, int courseId)
    {
        try
        {
            var course = await _context.Courses
                .Where(c => c.Id == courseId)
                .FirstOrDefaultAsync();

            if (course?.Boundary == null)
            {
                // If no boundary is defined, check if within a reasonable distance of course center
                if (course?.Location != null)
                {
                    var distance = await _context.Database
                        .SqlQueryRaw<decimal>(
                            @"SELECT ST_Distance(
                                ST_Transform(ST_SetSRID(ST_MakePoint({0}, {1}), 4326), 3857),
                                ST_Transform(ST_GeomFromWKB({2}, 4326), 3857)
                            ) as Value",
                            longitude, latitude, course.Location.AsBinary())
                        .FirstOrDefaultAsync();

                    // Consider within boundary if within 2km of course center
                    return distance <= 2000;
                }
                return false;
            }

            // Use PostGIS ST_Within function for boundary checking
            var isWithin = await _context.Database
                .SqlQueryRaw<bool>(
                    @"SELECT ST_Within(
                        ST_SetSRID(ST_MakePoint({0}, {1}), 4326),
                        ST_GeomFromWKB({2}, 4326)
                    ) as Value",
                    longitude, latitude, course.Boundary.AsBinary())
                .FirstOrDefaultAsync();

            return isWithin;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking course boundary for course {CourseId}", courseId);
            throw;
        }
    }

    public async Task<int?> DetectCurrentHoleAsync(decimal latitude, decimal longitude, int courseId)
    {
        try
        {
            // Find the closest hole tee to determine current hole
            var closestHole = await _context.Database
                .SqlQueryRaw<int>(
                    @"SELECT h.hole_number
                      FROM Holes h 
                      WHERE h.course_id = {0} AND h.tee_location IS NOT NULL
                      ORDER BY ST_Distance(
                          ST_Transform(ST_SetSRID(ST_MakePoint({1}, {2}), 4326), 3857),
                          ST_Transform(h.tee_location, 3857)
                      ) ASC
                      LIMIT 1",
                    courseId, longitude, latitude)
                .FirstOrDefaultAsync();

            return closestHole == 0 ? null : closestHole;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error detecting current hole for course {CourseId}", courseId);
            throw;
        }
    }

    public async Task<string?> DetectPositionOnHoleAsync(decimal latitude, decimal longitude, int courseId, int holeNumber)
    {
        try
        {
            var hole = await _context.Holes
                .Where(h => h.CourseId == courseId && h.HoleNumber == holeNumber)
                .FirstOrDefaultAsync();

            if (hole == null) return "unknown";

            // Check if within the overall hole layout
            if (hole.HoleLayout != null)
            {
                var isWithinHole = await _context.Database
                    .SqlQueryRaw<bool>(
                        @"SELECT ST_Within(
                            ST_SetSRID(ST_MakePoint({0}, {1}), 4326),
                            ST_GeomFromWKB({2}, 4326)
                        ) as Value",
                        longitude, latitude, hole.HoleLayout.AsBinary())
                    .FirstOrDefaultAsync();

                if (!isWithinHole)
                    return "rough"; // Outside hole layout = rough
            }

            // Determine position based on proximity to key features
            // (currentPoint variable is not actually used, removing for now)

            // Check if close to tee (within 30 meters)
            if (hole.TeeLocation != null)
            {
                var distanceToTee = await _context.Database
                    .SqlQueryRaw<decimal>(
                        @"SELECT ST_Distance(
                            ST_Transform(ST_SetSRID(ST_MakePoint({0}, {1}), 4326), 3857),
                            ST_Transform(ST_GeomFromWKB({2}, 4326), 3857)
                        ) as Value",
                        longitude, latitude, hole.TeeLocation.AsBinary())
                    .FirstOrDefaultAsync();

                if (distanceToTee <= 30) // Within 30 meters of tee
                    return "tee";
            }

            // Check if close to pin/green (within 20 meters)
            if (hole.PinLocation != null)
            {
                var distanceToPin = await _context.Database
                    .SqlQueryRaw<decimal>(
                        @"SELECT ST_Distance(
                            ST_Transform(ST_SetSRID(ST_MakePoint({0}, {1}), 4326), 3857),
                            ST_Transform(ST_GeomFromWKB({2}, 4326), 3857)
                        ) as Value",
                        longitude, latitude, hole.PinLocation.AsBinary())
                    .FirstOrDefaultAsync();

                if (distanceToPin <= 20) // Within 20 meters of pin
                    return "green";
            }

            // Check if close to fairway center line (within 30 meters = fairway)
            if (hole.FairwayCenterLine != null)
            {
                var distanceToFairway = await _context.Database
                    .SqlQueryRaw<decimal>(
                        @"SELECT ST_Distance(
                            ST_Transform(ST_SetSRID(ST_MakePoint({0}, {1}), 4326), 3857),
                            ST_Transform(ST_GeomFromWKB({2}, 4326), 3857)
                        ) as Value",
                        longitude, latitude, hole.FairwayCenterLine.AsBinary())
                    .FirstOrDefaultAsync();

                if (distanceToFairway <= 30) // Within 30 meters of fairway center
                    return "fairway";
            }

            // Check for hazards based on SimpleHazards JSON data
            if (!string.IsNullOrEmpty(hole.SimpleHazards))
            {
                // For now, return rough - could parse JSON for specific hazard locations
                // This would require more complex logic to parse hazard coordinates
            }

            return "rough"; // Default to rough if not clearly in other areas
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error detecting position on hole {HoleNumber} for course {CourseId}", 
                holeNumber, courseId);
            throw;
        }
    }

    #endregion

    #region Proximity and Spatial Queries

    public async Task<IEnumerable<Location>> GetLocationsWithinRadiusAsync(decimal latitude, decimal longitude, decimal radiusMeters)
    {
        try
        {
            return await _context.Locations
                .FromSqlRaw(
                    @"SELECT * FROM Locations 
                      WHERE ST_DWithin(
                          ST_Transform(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326), 3857),
                          ST_Transform(ST_SetSRID(ST_MakePoint({1}, {0}), 4326), 3857),
                          {2}
                      )",
                    latitude, longitude, radiusMeters)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting locations within radius");
            throw;
        }
    }

    public async Task<IEnumerable<Location>> GetNearbyLocationsAsync(int locationId, decimal radiusMeters)
    {
        try
        {
            var location = await GetByIdAsync(locationId);
            if (location == null) return Enumerable.Empty<Location>();

            return await GetLocationsWithinRadiusAsync(location.Latitude, location.Longitude, radiusMeters);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting nearby locations for location {LocationId}", locationId);
            throw;
        }
    }

    public async Task<bool> IsNearLocationAsync(decimal latitude, decimal longitude, decimal targetLatitude, decimal targetLongitude, decimal thresholdMeters)
    {
        try
        {
            var distance = await _context.Database
                .SqlQueryRaw<decimal>(
                    @"SELECT ST_Distance(
                        ST_Transform(ST_SetSRID(ST_MakePoint({0}, {1}), 4326), 3857),
                        ST_Transform(ST_SetSRID(ST_MakePoint({2}, {3}), 4326), 3857)
                    ) as Value",
                    longitude, latitude, targetLongitude, targetLatitude)
                .FirstOrDefaultAsync();

            return distance <= thresholdMeters;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if near location");
            throw;
        }
    }

    #endregion

    #region Shot Tracking and Analysis

    public async Task<Location?> GetLastShotLocationAsync(int userId, int roundId)
    {
        try
        {
            return await _context.Locations
                .Where(l => l.UserId == userId && l.RoundId == roundId && l.LastShotLocation != null)
                .OrderByDescending(l => l.Timestamp)
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting last shot location for user {UserId} round {RoundId}", 
                userId, roundId);
            throw;
        }
    }

    public async Task<decimal?> CalculateLastShotDistanceAsync(int userId, int roundId)
    {
        try
        {
            var currentLocation = await _context.Locations
                .Where(l => l.UserId == userId && l.RoundId == roundId)
                .OrderByDescending(l => l.Timestamp)
                .FirstOrDefaultAsync();

            if (currentLocation?.LastShotLocation == null)
                return null;

            var distance = await _context.Database
                .SqlQueryRaw<decimal>(
                    @"SELECT ST_Distance(
                        ST_Transform(ST_SetSRID(ST_MakePoint({0}, {1}), 4326), 3857),
                        ST_Transform(ST_GeomFromWKB({2}, 4326), 3857)
                    ) as Value",
                    currentLocation.Longitude, currentLocation.Latitude, 
                    currentLocation.LastShotLocation.AsBinary())
                .FirstOrDefaultAsync();

            return distance;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating last shot distance for user {UserId} round {RoundId}", 
                userId, roundId);
            throw;
        }
    }

    public async Task<IEnumerable<Location>> GetShotSequenceAsync(int roundId, int holeNumber)
    {
        try
        {
            return await _context.Locations
                .Where(l => l.RoundId == roundId && l.CurrentHoleDetected == holeNumber)
                .OrderBy(l => l.Timestamp)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting shot sequence for round {RoundId} hole {HoleNumber}", 
                roundId, holeNumber);
            throw;
        }
    }

    #endregion

    #region Real-time Updates

    public async Task<Location> UpdateLocationWithCalculationsAsync(Location location)
    {
        try
        {
            // Update distance calculations if course and hole are available
            if (location.CourseId.HasValue && location.CurrentHoleDetected.HasValue)
            {
                location.DistanceToTeeMeters = await CalculateDistanceFromPointAsync(
                    location.Latitude, location.Longitude, 
                    location.CourseId.Value, location.CurrentHoleDetected.Value, "tee");

                location.DistanceToPinMeters = await CalculateDistanceFromPointAsync(
                    location.Latitude, location.Longitude, 
                    location.CourseId.Value, location.CurrentHoleDetected.Value, "pin");

                location.PositionOnHole = await DetectPositionOnHoleAsync(
                    location.Latitude, location.Longitude, 
                    location.CourseId.Value, location.CurrentHoleDetected.Value);

                location.CourseBoundaryStatus = await IsWithinCourseBoundaryAsync(
                    location.Latitude, location.Longitude, location.CourseId.Value);
            }

            return await UpdateAsync(location);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating location with calculations {LocationId}", location.Id);
            throw;
        }
    }

    public async Task<bool> UpdateCourseBoundaryStatusAsync(int locationId, bool isWithinBoundary)
    {
        try
        {
            var location = await GetByIdAsync(locationId);
            if (location == null) return false;

            location.CourseBoundaryStatus = isWithinBoundary;
            await UpdateAsync(location);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating course boundary status for location {LocationId}", locationId);
            throw;
        }
    }

    public async Task<bool> UpdateDistanceCalculationsAsync(int locationId, decimal? distanceToTee, decimal? distanceToPin)
    {
        try
        {
            var location = await GetByIdAsync(locationId);
            if (location == null) return false;

            location.DistanceToTeeMeters = distanceToTee;
            location.DistanceToPinMeters = distanceToPin;
            await UpdateAsync(location);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating distance calculations for location {LocationId}", locationId);
            throw;
        }
    }

    #endregion

    #region Statistics and Analytics

    public async Task<object?> GetLocationStatisticsAsync(int userId, DateTime? startDate = null, DateTime? endDate = null)
    {
        try
        {
            var query = _context.Locations.Where(l => l.UserId == userId);

            if (startDate.HasValue)
                query = query.Where(l => l.Timestamp >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(l => l.Timestamp <= endDate.Value);

            var stats = await query
                .GroupBy(l => 1)
                .Select(g => new
                {
                    TotalLocations = g.Count(),
                    AverageAccuracy = g.Where(l => l.AccuracyMeters.HasValue).Average(l => l.AccuracyMeters),
                    TotalDistance = g.Where(l => l.DistanceToTeeMeters.HasValue).Sum(l => l.DistanceToTeeMeters),
                    AverageSpeed = g.Where(l => l.MovementSpeedMps.HasValue).Average(l => l.MovementSpeedMps),
                    TimeSpan = g.Max(l => l.Timestamp) - g.Min(l => l.Timestamp),
                    CoursesVisited = g.Select(l => l.CourseId).Distinct().Count()
                })
                .FirstOrDefaultAsync();

            return stats;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting location statistics for user {UserId}", userId);
            throw;
        }
    }

    public async Task<IEnumerable<object>> GetHolePositionAnalysisAsync(int userId, int courseId, int holeNumber)
    {
        try
        {
            return await _context.Locations
                .Where(l => l.UserId == userId && 
                           l.CourseId == courseId && 
                           l.CurrentHoleDetected == holeNumber)
                .GroupBy(l => l.PositionOnHole)
                .Select(g => new
                {
                    Position = g.Key,
                    Count = g.Count(),
                    AverageDistanceToPin = g.Where(l => l.DistanceToPinMeters.HasValue).Average(l => l.DistanceToPinMeters),
                    MinDistanceToPin = g.Where(l => l.DistanceToPinMeters.HasValue).Min(l => l.DistanceToPinMeters),
                    MaxDistanceToPin = g.Where(l => l.DistanceToPinMeters.HasValue).Max(l => l.DistanceToPinMeters)
                })
                .ToListAsync<object>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting hole position analysis for user {UserId}", userId);
            throw;
        }
    }

    public async Task<decimal?> GetAverageDistanceToTargetAsync(int userId, int courseId, int holeNumber, string targetType)
    {
        try
        {
            var locations = await _context.Locations
                .Where(l => l.UserId == userId && 
                           l.CourseId == courseId && 
                           l.CurrentHoleDetected == holeNumber)
                .ToListAsync();

            if (!locations.Any()) return null;

            var distances = targetType.ToLower() switch
            {
                "pin" => locations.Where(l => l.DistanceToPinMeters.HasValue).Select(l => l.DistanceToPinMeters!.Value),
                "tee" => locations.Where(l => l.DistanceToTeeMeters.HasValue).Select(l => l.DistanceToTeeMeters!.Value),
                _ => Enumerable.Empty<decimal>()
            };

            return distances.Any() ? distances.Average() : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting average distance to {TargetType} for user {UserId}", 
                targetType, userId);
            throw;
        }
    }

    #endregion

    #region Pagination and Filtering

    public async Task<IEnumerable<Location>> GetPaginatedAsync(int page, int pageSize, int? userId = null, int? roundId = null, int? courseId = null)
    {
        try
        {
            var query = _context.Locations.AsQueryable();

            if (userId.HasValue)
                query = query.Where(l => l.UserId == userId.Value);

            if (roundId.HasValue)
                query = query.Where(l => l.RoundId == roundId.Value);

            if (courseId.HasValue)
                query = query.Where(l => l.CourseId == courseId.Value);

            return await query
                .OrderByDescending(l => l.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paginated locations");
            throw;
        }
    }

    public async Task<int> GetTotalCountAsync(int? userId = null, int? roundId = null, int? courseId = null)
    {
        try
        {
            var query = _context.Locations.AsQueryable();

            if (userId.HasValue)
                query = query.Where(l => l.UserId == userId.Value);

            if (roundId.HasValue)
                query = query.Where(l => l.RoundId == roundId.Value);

            if (courseId.HasValue)
                query = query.Where(l => l.CourseId == courseId.Value);

            return await query.CountAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting total location count");
            throw;
        }
    }

    #endregion
}