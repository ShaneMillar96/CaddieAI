using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NetTopologySuite;
using caddie.portal.dal.Models.Users;
using caddie.portal.dal.Models.Courses;
using caddie.portal.dal.Models.Rounds;
using caddie.portal.dal.Models.AI;
using caddie.portal.dal.Context.Configuration;
using caddie.portal.dal.Context.Extensions;

namespace caddie.portal.dal.Context;

public class CaddieAIDbContext : DbContext
{
    public CaddieAIDbContext(DbContextOptions<CaddieAIDbContext> options) : base(options)
    {
    }

    // DbSets for all entities
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
    public DbSet<UserSession> UserSessions { get; set; } = null!;
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; } = null!;
    public DbSet<Course> Courses { get; set; } = null!;
    public DbSet<Hole> Holes { get; set; } = null!;
    public DbSet<Round> Rounds { get; set; } = null!;
    public DbSet<Location> Locations { get; set; } = null!;
    public DbSet<ChatSession> ChatSessions { get; set; } = null!;
    public DbSet<ChatMessage> ChatMessages { get; set; } = null!;
    public DbSet<ClubRecommendation> ClubRecommendations { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure PostgreSQL-specific features
        modelBuilder.HasPostgresExtension("postgis");
        modelBuilder.HasPostgresExtension("uuid-ossp");

        // Configure enums
        modelBuilder.ConfigurePostgresEnums();

        // Apply entity configurations
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new RefreshTokenConfiguration());
        modelBuilder.ApplyConfiguration(new UserSessionConfiguration());
        modelBuilder.ApplyConfiguration(new PasswordResetTokenConfiguration());
        modelBuilder.ApplyConfiguration(new CourseConfiguration());
        modelBuilder.ApplyConfiguration(new HoleConfiguration());
        modelBuilder.ApplyConfiguration(new RoundConfiguration());
        modelBuilder.ApplyConfiguration(new LocationConfiguration());
        modelBuilder.ApplyConfiguration(new ChatSessionConfiguration());
        modelBuilder.ApplyConfiguration(new ChatMessageConfiguration());
        modelBuilder.ApplyConfiguration(new ClubRecommendationConfiguration());

        // Configure common properties
        modelBuilder.ConfigureCommonProperties();
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            // Default configuration - should be overridden by DI
            optionsBuilder.UseNpgsql("Host=localhost;Database=caddieai_dev;Username=caddieai_user;Password=caddieai_password", 
                options => options.UseNetTopologySuite());
        }
    }
}