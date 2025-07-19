using Xunit;
using caddie.portal.dal.Repositories.Interfaces;

namespace caddie.portal.services.tests;

public class LocationRepositoryTests
{
    [Fact]
    public void LocationRepository_Interface_Should_Exist()
    {
        // This test simply verifies that the interface compiles and has the expected methods
        var interfaceType = typeof(ILocationRepository);
        
        Assert.NotNull(interfaceType);
        Assert.True(interfaceType.IsInterface);
        
        // Verify some key methods exist
        var methods = interfaceType.GetMethods();
        Assert.Contains(methods, m => m.Name == "CreateAsync");
        Assert.Contains(methods, m => m.Name == "GetByIdAsync");
        Assert.Contains(methods, m => m.Name == "CalculateDistanceToTeeAsync");
        Assert.Contains(methods, m => m.Name == "IsWithinCourseBoundaryAsync");
    }

    [Fact]
    public void LocationRepository_Interface_Should_Have_PostGIS_Methods()
    {
        // Verify PostGIS-specific geospatial methods are defined
        var interfaceType = typeof(ILocationRepository);
        var methods = interfaceType.GetMethods();
        
        Assert.Contains(methods, m => m.Name == "CalculateDistanceToPinAsync");
        Assert.Contains(methods, m => m.Name == "DetectCurrentHoleAsync");
        Assert.Contains(methods, m => m.Name == "DetectPositionOnHoleAsync");
        Assert.Contains(methods, m => m.Name == "GetLocationsWithinRadiusAsync");
    }
}