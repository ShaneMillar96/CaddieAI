using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using caddie.portal.dal.Models;

namespace caddie.portal.dal.Context;

public partial class CaddieAIDbContext : DbContext
{
    public CaddieAIDbContext()
    {
    }

    public CaddieAIDbContext(DbContextOptions<CaddieAIDbContext> options)
        : base(options)
    {
    }


    public virtual DbSet<Course> Courses { get; set; }

    public virtual DbSet<Hole> Holes { get; set; }

    public virtual DbSet<HoleScore> HoleScores { get; set; }

    public virtual DbSet<Location> Locations { get; set; }

    public virtual DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<Round> Rounds { get; set; }

    public virtual DbSet<RoundStatus> RoundStatuses { get; set; }

    public virtual DbSet<SkillLevel> SkillLevels { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserSession> UserSessions { get; set; }

    public virtual DbSet<UserStatus> UserStatuses { get; set; }

    public virtual DbSet<UserCourse> UserCourses { get; set; }

    public virtual DbSet<SwingAnalysis> SwingAnalyses { get; set; }

    public virtual DbSet<GarminDevice> GarminDevices { get; set; }



    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // Configuration is now handled through dependency injection in Program.cs
        // This method is kept empty to prevent hardcoded connection strings
        // Connection string configuration is managed through environment variables and appsettings.json
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configure PostgreSQL-specific enums (simplified)
        modelBuilder
            .HasPostgresEnum("course_difficulty", new[] { "easy", "moderate", "difficult", "championship" })
            .HasPostgresEnum("hole_type", new[] { "par3", "par4", "par5" })
            .HasPostgresEnum("token_type", new[] { "refresh", "email_verification", "password_reset" });

        // Configure PostgreSQL extensions
        modelBuilder
            .HasPostgresExtension("fuzzystrmatch")
            .HasPostgresExtension("postgis")
            .HasPostgresExtension("postgis_raster")
            .HasPostgresExtension("uuid-ossp")
            .HasPostgresExtension("tiger", "postgis_tiger_geocoder")
            .HasPostgresExtension("topology", "postgis_topology");

        // All entity configuration is now handled via Data Annotations on model classes
        // This significantly improves code maintainability and self-documentation

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
