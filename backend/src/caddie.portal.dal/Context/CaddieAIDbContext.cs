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

    public virtual DbSet<ChatMessage> ChatMessages { get; set; }

    public virtual DbSet<ChatSession> ChatSessions { get; set; }

    public virtual DbSet<ClubRecommendation> ClubRecommendations { get; set; }

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

    public virtual DbSet<AIConversation> AIConversations { get; set; }

    public virtual DbSet<HoleCompletionCommentary> HoleCompletionCommentaries { get; set; }

    public virtual DbSet<LocationHistory> LocationHistories { get; set; }

    public virtual DbSet<ShotEvent> ShotEvents { get; set; }

    public virtual DbSet<ShotPlacement> ShotPlacements { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseNpgsql("Host=localhost;Database=caddieai_dev;Username=caddieai_user;Password=caddieai_password", x => x.UseNetTopologySuite());
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configure PostgreSQL-specific enums
        modelBuilder
            .HasPostgresEnum("chat_session_status", new[] { "active", "paused", "completed", "archived" })
            .HasPostgresEnum("course_difficulty", new[] { "easy", "moderate", "difficult", "championship" })
            .HasPostgresEnum("hole_type", new[] { "par3", "par4", "par5" })
            .HasPostgresEnum("message_type", new[] { "user_message", "ai_response", "system_message", "error_message" })
            .HasPostgresEnum("round_status", new[] { "not_started", "in_progress", "paused", "completed", "abandoned" })
            .HasPostgresEnum("token_type", new[] { "refresh", "email_verification", "password_reset" })
            .HasPostgresEnum("weather_condition", new[] { "sunny", "cloudy", "overcast", "light_rain", "heavy_rain", "windy", "stormy" });

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
