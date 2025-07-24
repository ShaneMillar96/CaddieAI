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

    public virtual DbSet<FlywaySchemaHistory> FlywaySchemaHistories { get; set; }

    public virtual DbSet<Hole> Holes { get; set; }

    public virtual DbSet<Location> Locations { get; set; }

    public virtual DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<Round> Rounds { get; set; }

    public virtual DbSet<RoundStatus> RoundStatuses { get; set; }

    public virtual DbSet<SkillLevel> SkillLevels { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserSession> UserSessions { get; set; }

    public virtual DbSet<UserStatus> UserStatuses { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseNpgsql("Host=localhost;Database=caddieai_dev;Username=caddieai_user;Password=caddieai_password", x => x.UseNetTopologySuite());
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .HasPostgresEnum("chat_session_status", new[] { "active", "paused", "completed", "archived" })
            .HasPostgresEnum("course_difficulty", new[] { "easy", "moderate", "difficult", "championship" })
            .HasPostgresEnum("hole_type", new[] { "par3", "par4", "par5" })
            .HasPostgresEnum("message_type", new[] { "user_message", "ai_response", "system_message", "error_message" })
            .HasPostgresEnum("round_status", new[] { "not_started", "in_progress", "paused", "completed", "abandoned" })
            .HasPostgresEnum("token_type", new[] { "refresh", "email_verification", "password_reset" })
            .HasPostgresEnum("weather_condition", new[] { "sunny", "cloudy", "overcast", "light_rain", "heavy_rain", "windy", "stormy" })
            .HasPostgresExtension("fuzzystrmatch")
            .HasPostgresExtension("postgis")
            .HasPostgresExtension("postgis_raster")
            .HasPostgresExtension("uuid-ossp")
            .HasPostgresExtension("tiger", "postgis_tiger_geocoder")
            .HasPostgresExtension("topology", "postgis_topology");

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("chatmessages_pkey");

            entity.ToTable("chatmessages", tb => tb.HasComment("ChatGPT conversation messages with token tracking"));

            entity.HasIndex(e => e.OpenaiRole, "idx_chat_messages_openai_role");

            entity.HasIndex(e => e.SessionId, "idx_chat_messages_session_id");

            entity.HasIndex(e => new { e.SessionId, e.Timestamp }, "idx_chat_messages_session_timestamp");

            entity.HasIndex(e => e.Timestamp, "idx_chat_messages_timestamp");

            entity.HasIndex(e => e.TokensConsumed, "idx_chat_messages_tokens_consumed");

            entity.HasIndex(e => e.UserId, "idx_chat_messages_user_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ContextData)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasComment("Additional context data for this message")
                .HasColumnType("jsonb")
                .HasColumnName("context_data");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.MessageContent)
                .HasComment("Message content (text)")
                .HasColumnName("message_content");
            entity.Property(e => e.OpenaiModelUsed)
                .HasMaxLength(50)
                .HasComment("OpenAI model used for this specific message")
                .HasColumnName("openai_model_used");
            entity.Property(e => e.OpenaiRole)
                .HasMaxLength(20)
                .HasDefaultValueSql("'user'::character varying")
                .HasComment("OpenAI role (user, assistant, system)")
                .HasColumnName("openai_role");
            entity.Property(e => e.SessionId).HasColumnName("session_id");
            entity.Property(e => e.Timestamp)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("timestamp");
            entity.Property(e => e.TokensConsumed)
                .HasComment("Number of tokens used by OpenAI for this message")
                .HasColumnName("tokens_consumed");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Session).WithMany(p => p.ChatMessages)
                .HasForeignKey(d => d.SessionId)
                .HasConstraintName("chatmessages_session_id_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.ChatMessages)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("chatmessages_user_id_fkey");
        });

        modelBuilder.Entity<ChatSession>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("chatsessions_pkey");

            entity.ToTable("chatsessions", tb => tb.HasComment("OpenAI ChatGPT conversation sessions with AI caddie personality"));

            entity.HasIndex(e => e.ContextData, "idx_chat_sessions_context_data").HasMethod("gin");

            entity.HasIndex(e => e.CourseId, "idx_chat_sessions_course_id");

            entity.HasIndex(e => e.LastMessageAt, "idx_chat_sessions_last_message_at");

            entity.HasIndex(e => e.OpenaiModel, "idx_chat_sessions_openai_model");

            entity.HasIndex(e => e.RoundId, "idx_chat_sessions_round_id");

            entity.HasIndex(e => e.UserId, "idx_chat_sessions_user_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ContextData)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasComment("Conversation context including recent topics, user preferences, and game state")
                .HasColumnType("jsonb")
                .HasColumnName("context_data");
            entity.Property(e => e.CourseId).HasColumnName("course_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.LastMessageAt).HasColumnName("last_message_at");
            entity.Property(e => e.MaxTokens)
                .HasDefaultValue(500)
                .HasComment("Token limit management for cost control")
                .HasColumnName("max_tokens");
            entity.Property(e => e.OpenaiModel)
                .HasMaxLength(50)
                .HasDefaultValueSql("'gpt-3.5-turbo'::character varying")
                .HasComment("OpenAI model used for this session (gpt-3.5-turbo, gpt-4)")
                .HasColumnName("openai_model");
            entity.Property(e => e.RoundId).HasColumnName("round_id");
            entity.Property(e => e.SessionMetadata)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("session_metadata");
            entity.Property(e => e.SessionName)
                .HasMaxLength(255)
                .HasColumnName("session_name");
            entity.Property(e => e.SystemPrompt)
                .HasComment("System prompt defining AI caddie personality and context")
                .HasColumnName("system_prompt");
            entity.Property(e => e.Temperature)
                .HasPrecision(3, 2)
                .HasDefaultValueSql("0.7")
                .HasComment("OpenAI temperature setting for response creativity")
                .HasColumnName("temperature");
            entity.Property(e => e.TotalMessages)
                .HasDefaultValue(0)
                .HasComment("Total number of messages in this session")
                .HasColumnName("total_messages");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Course).WithMany(p => p.ChatSessions)
                .HasForeignKey(d => d.CourseId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("chatsessions_course_id_fkey");

            entity.HasOne(d => d.Round).WithMany(p => p.ChatSessions)
                .HasForeignKey(d => d.RoundId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("chatsessions_round_id_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.ChatSessions)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("chatsessions_user_id_fkey");
        });

        modelBuilder.Entity<ClubRecommendation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("clubrecommendations_pkey");

            entity.ToTable("clubrecommendations", tb => tb.HasComment("Simplified AI-generated club recommendations via OpenAI ChatGPT"));

            entity.HasIndex(e => e.ConfidenceScore, "idx_club_recommendations_confidence_score");

            entity.HasIndex(e => e.ContextUsed, "idx_club_recommendations_context_used").HasMethod("gin");

            entity.HasIndex(e => e.HoleId, "idx_club_recommendations_hole_id");

            entity.HasIndex(e => e.LocationId, "idx_club_recommendations_location_id");

            entity.HasIndex(e => e.RecommendedClub, "idx_club_recommendations_recommended_club");

            entity.HasIndex(e => e.RoundId, "idx_club_recommendations_round_id");

            entity.HasIndex(e => e.UserId, "idx_club_recommendations_user_id");

            entity.HasIndex(e => e.WasAccepted, "idx_club_recommendations_was_accepted");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ActualClubUsed)
                .HasMaxLength(50)
                .HasComment("Club actually used by player (for learning)")
                .HasColumnName("actual_club_used");
            entity.Property(e => e.ConfidenceScore)
                .HasPrecision(3, 2)
                .HasComment("Numerical confidence score (0-1)")
                .HasColumnName("confidence_score");
            entity.Property(e => e.ContextUsed)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasComment("Context data used for the recommendation")
                .HasColumnType("jsonb")
                .HasColumnName("context_used");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.DistanceToTarget)
                .HasPrecision(6, 2)
                .HasComment("Distance to target in meters")
                .HasColumnName("distance_to_target");
            entity.Property(e => e.HoleId).HasColumnName("hole_id");
            entity.Property(e => e.LocationId).HasColumnName("location_id");
            entity.Property(e => e.OpenaiReasoning)
                .HasComment("OpenAI-generated reasoning for the recommendation")
                .HasColumnName("openai_reasoning");
            entity.Property(e => e.RecommendationMetadata)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("recommendation_metadata");
            entity.Property(e => e.RecommendedClub)
                .HasMaxLength(50)
                .HasComment("Primary club recommendation")
                .HasColumnName("recommended_club");
            entity.Property(e => e.RoundId).HasColumnName("round_id");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.WasAccepted)
                .HasComment("Whether user accepted the recommendation")
                .HasColumnName("was_accepted");

            entity.HasOne(d => d.Hole).WithMany(p => p.ClubRecommendations)
                .HasForeignKey(d => d.HoleId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("clubrecommendations_hole_id_fkey");

            entity.HasOne(d => d.Location).WithMany(p => p.ClubRecommendations)
                .HasForeignKey(d => d.LocationId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("clubrecommendations_location_id_fkey");

            entity.HasOne(d => d.Round).WithMany(p => p.ClubRecommendations)
                .HasForeignKey(d => d.RoundId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("clubrecommendations_round_id_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.ClubRecommendations)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("clubrecommendations_user_id_fkey");
        });

        modelBuilder.Entity<Course>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("courses_pkey");

            entity.ToTable("courses", tb => tb.HasComment("Golf course information with geospatial data and metadata"));

            entity.HasIndex(e => e.Amenities, "idx_courses_amenities").HasMethod("gin");

            entity.HasIndex(e => e.Boundary, "idx_courses_boundary").HasMethod("gist");

            entity.HasIndex(e => e.IsActive, "idx_courses_is_active");

            entity.HasIndex(e => e.Location, "idx_courses_location").HasMethod("gist");

            entity.HasIndex(e => e.Name, "idx_courses_name");

            entity.HasIndex(e => e.ParTotal, "idx_courses_par_total");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Address).HasColumnName("address");
            entity.Property(e => e.Amenities)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasComment("Available amenities and facilities")
                .HasColumnType("jsonb")
                .HasColumnName("amenities");
            entity.Property(e => e.Boundary)
                .HasComment("Course boundary polygon for geofencing")
                .HasColumnType("geometry(Polygon,4326)")
                .HasColumnName("boundary");
            entity.Property(e => e.City)
                .HasMaxLength(100)
                .HasColumnName("city");
            entity.Property(e => e.Country)
                .HasMaxLength(100)
                .HasColumnName("country");
            entity.Property(e => e.CourseMetadata)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("course_metadata");
            entity.Property(e => e.CourseRating)
                .HasPrecision(3, 1)
                .HasComment("USGA course rating for scratch golfer")
                .HasColumnName("course_rating");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .HasColumnName("email");
            entity.Property(e => e.GreenFeeRange)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasComment("Pricing information stored as JSON")
                .HasColumnType("jsonb")
                .HasColumnName("green_fee_range");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.Location)
                .HasComment("Primary course location point (clubhouse/pro shop)")
                .HasColumnType("geometry(Point,4326)")
                .HasColumnName("location");
            entity.Property(e => e.Name)
                .HasMaxLength(200)
                .HasColumnName("name");
            entity.Property(e => e.ParTotal).HasColumnName("par_total");
            entity.Property(e => e.Phone)
                .HasMaxLength(20)
                .HasColumnName("phone");
            entity.Property(e => e.SlopeRating)
                .HasComment("USGA slope rating (55-155 range)")
                .HasColumnName("slope_rating");
            entity.Property(e => e.State)
                .HasMaxLength(50)
                .HasColumnName("state");
            entity.Property(e => e.Timezone)
                .HasMaxLength(50)
                .HasDefaultValueSql("'UTC'::character varying")
                .HasColumnName("timezone");
            entity.Property(e => e.TotalHoles)
                .HasDefaultValue(18)
                .HasColumnName("total_holes");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");
            entity.Property(e => e.Website)
                .HasMaxLength(255)
                .HasColumnName("website");
            entity.Property(e => e.YardageTotal).HasColumnName("yardage_total");
        });

        modelBuilder.Entity<FlywaySchemaHistory>(entity =>
        {
            entity.HasKey(e => e.InstalledRank).HasName("flyway_schema_history_pk");

            entity.ToTable("flyway_schema_history");

            entity.HasIndex(e => e.Success, "flyway_schema_history_s_idx");

            entity.Property(e => e.InstalledRank)
                .ValueGeneratedNever()
                .HasColumnName("installed_rank");
            entity.Property(e => e.Checksum).HasColumnName("checksum");
            entity.Property(e => e.Description)
                .HasMaxLength(200)
                .HasColumnName("description");
            entity.Property(e => e.ExecutionTime).HasColumnName("execution_time");
            entity.Property(e => e.InstalledBy)
                .HasMaxLength(100)
                .HasColumnName("installed_by");
            entity.Property(e => e.InstalledOn)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("installed_on");
            entity.Property(e => e.Script)
                .HasMaxLength(1000)
                .HasColumnName("script");
            entity.Property(e => e.Success).HasColumnName("success");
            entity.Property(e => e.Type)
                .HasMaxLength(20)
                .HasColumnName("type");
            entity.Property(e => e.Version)
                .HasMaxLength(50)
                .HasColumnName("version");
        });

        modelBuilder.Entity<Hole>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("holes_pkey");

            entity.ToTable("holes", tb => tb.HasComment("Individual hole information with enhanced data and playing tips"));

            entity.HasIndex(e => new { e.CourseId, e.HoleNumber }, "holes_course_id_hole_number_key").IsUnique();

            entity.HasIndex(e => e.CourseId, "idx_holes_course_id");

            entity.HasIndex(e => e.FairwayCenterLine, "idx_holes_fairway_center_line").HasMethod("gist");

            entity.HasIndex(e => e.HoleLayout, "idx_holes_hole_layout").HasMethod("gist");

            entity.HasIndex(e => e.HoleNumber, "idx_holes_hole_number");

            entity.HasIndex(e => e.LadiesPar, "idx_holes_ladies_par");

            entity.HasIndex(e => e.Par, "idx_holes_par");

            entity.HasIndex(e => e.PinLocation, "idx_holes_pin_location").HasMethod("gist");

            entity.HasIndex(e => e.SimpleHazards, "idx_holes_simple_hazards").HasMethod("gin");

            entity.HasIndex(e => e.StrokeIndex, "idx_holes_stroke_index");

            entity.HasIndex(e => e.TeeLocation, "idx_holes_tee_location").HasMethod("gist");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CourseId).HasColumnName("course_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.FairwayCenterLine)
                .HasComment("Optimal playing line from tee to green")
                .HasColumnType("geometry(LineString,4326)")
                .HasColumnName("fairway_center_line");
            entity.Property(e => e.HoleDescription).HasColumnName("hole_description");
            entity.Property(e => e.HoleLayout)
                .HasComment("Complete hole boundary including fairway, rough, and green")
                .HasColumnType("geometry(Polygon,4326)")
                .HasColumnName("hole_layout");
            entity.Property(e => e.HoleMetadata)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("hole_metadata");
            entity.Property(e => e.HoleNumber).HasColumnName("hole_number");
            entity.Property(e => e.HoleTips)
                .HasComment("Official playing tips and strategy advice for the hole")
                .HasColumnName("hole_tips");
            entity.Property(e => e.LadiesPar)
                .HasComment("Par for ladies tees")
                .HasColumnName("ladies_par");
            entity.Property(e => e.LadiesStrokeIndex)
                .HasComment("Ladies tee difficulty ranking (1-18)")
                .HasColumnName("ladies_stroke_index");
            entity.Property(e => e.LadiesYardage)
                .HasComment("Yardage from ladies tees")
                .HasColumnName("ladies_yardage");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.Par).HasColumnName("par");
            entity.Property(e => e.PinLocation)
                .HasComment("Green/pin location point")
                .HasColumnType("geometry(Point,4326)")
                .HasColumnName("pin_location");
            entity.Property(e => e.PlayingTips)
                .HasComment("Additional strategic advice for playing the hole")
                .HasColumnName("playing_tips");
            entity.Property(e => e.SimpleHazards)
                .HasDefaultValueSql("'[]'::jsonb")
                .HasComment("Simplified hazard information stored as JSON array")
                .HasColumnType("jsonb")
                .HasColumnName("simple_hazards");
            entity.Property(e => e.StrokeIndex)
                .HasComment("Hole difficulty ranking (1-18) for handicap calculations")
                .HasColumnName("stroke_index");
            entity.Property(e => e.TeeLocation)
                .HasComment("Tee box center point")
                .HasColumnType("geometry(Point,4326)")
                .HasColumnName("tee_location");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");
            entity.Property(e => e.YardageBlack).HasColumnName("yardage_black");
            entity.Property(e => e.YardageBlue).HasColumnName("yardage_blue");
            entity.Property(e => e.YardageRed).HasColumnName("yardage_red");
            entity.Property(e => e.YardageWhite).HasColumnName("yardage_white");

            entity.HasOne(d => d.Course).WithMany(p => p.Holes)
                .HasForeignKey(d => d.CourseId)
                .HasConstraintName("holes_course_id_fkey");
        });

        modelBuilder.Entity<Location>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("locations_pkey");

            entity.ToTable("locations", tb => tb.HasComment("Enhanced real-time GPS tracking with distance calculations and course position awareness"));

            entity.HasIndex(e => e.CourseBoundaryStatus, "idx_locations_course_boundary_status");

            entity.HasIndex(e => e.CourseId, "idx_locations_course_id");

            entity.HasIndex(e => e.CurrentHoleDetected, "idx_locations_current_hole_detected");

            entity.HasIndex(e => e.DistanceToPinMeters, "idx_locations_distance_to_pin");

            entity.HasIndex(e => e.DistanceToTeeMeters, "idx_locations_distance_to_tee");

            entity.HasIndex(e => e.LastShotLocation, "idx_locations_last_shot_location").HasMethod("gist");

            entity.HasIndex(e => e.PositionOnHole, "idx_locations_position_on_hole");

            entity.HasIndex(e => e.RoundId, "idx_locations_round_id");

            entity.HasIndex(e => new { e.RoundId, e.Timestamp }, "idx_locations_round_timestamp");

            entity.HasIndex(e => e.Timestamp, "idx_locations_timestamp");

            entity.HasIndex(e => e.UserId, "idx_locations_user_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AccuracyMeters)
                .HasPrecision(6, 2)
                .HasComment("GPS accuracy in meters")
                .HasColumnName("accuracy_meters");
            entity.Property(e => e.AltitudeMeters)
                .HasPrecision(6, 2)
                .HasColumnName("altitude_meters");
            entity.Property(e => e.CourseBoundaryStatus)
                .HasDefaultValue(false)
                .HasComment("Whether player is currently within course boundaries")
                .HasColumnName("course_boundary_status");
            entity.Property(e => e.CourseId).HasColumnName("course_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CurrentHoleDetected)
                .HasComment("Auto-detected current hole based on GPS position")
                .HasColumnName("current_hole_detected");
            entity.Property(e => e.DistanceToPinMeters)
                .HasPrecision(6, 2)
                .HasComment("Real-time calculated distance to current hole pin")
                .HasColumnName("distance_to_pin_meters");
            entity.Property(e => e.DistanceToTeeMeters)
                .HasPrecision(6, 2)
                .HasComment("Real-time calculated distance to current hole tee")
                .HasColumnName("distance_to_tee_meters");
            entity.Property(e => e.HeadingDegrees)
                .HasPrecision(5, 2)
                .HasColumnName("heading_degrees");
            entity.Property(e => e.LastShotLocation)
                .HasComment("Previous shot position for context")
                .HasColumnType("geometry(Point,4326)")
                .HasColumnName("last_shot_location");
            entity.Property(e => e.Latitude)
                .HasPrecision(10, 7)
                .HasComment("GPS latitude coordinate")
                .HasColumnName("latitude");
            entity.Property(e => e.Longitude)
                .HasPrecision(10, 7)
                .HasComment("GPS longitude coordinate")
                .HasColumnName("longitude");
            entity.Property(e => e.MovementSpeedMps)
                .HasPrecision(4, 2)
                .HasComment("Player movement speed in meters per second")
                .HasColumnName("movement_speed_mps");
            entity.Property(e => e.PositionOnHole)
                .HasMaxLength(20)
                .HasComment("Current position on hole (tee, fairway, rough, green, hazard)")
                .HasColumnName("position_on_hole");
            entity.Property(e => e.RoundId).HasColumnName("round_id");
            entity.Property(e => e.SpeedMps)
                .HasPrecision(5, 2)
                .HasColumnName("speed_mps");
            entity.Property(e => e.Timestamp)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasComment("When the location was recorded")
                .HasColumnName("timestamp");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Course).WithMany(p => p.Locations)
                .HasForeignKey(d => d.CourseId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("locations_course_id_fkey");

            entity.HasOne(d => d.Round).WithMany(p => p.Locations)
                .HasForeignKey(d => d.RoundId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("locations_round_id_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.Locations)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("locations_user_id_fkey");
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("passwordresettokens_pkey");

            entity.ToTable("passwordresettokens", tb => tb.HasComment("Password reset tokens for secure password recovery"));

            entity.HasIndex(e => e.ExpiresAt, "idx_password_reset_tokens_expires_at");

            entity.HasIndex(e => e.IsUsed, "idx_password_reset_tokens_is_used");

            entity.HasIndex(e => e.Token, "idx_password_reset_tokens_token");

            entity.HasIndex(e => e.UserId, "idx_password_reset_tokens_user_id");

            entity.HasIndex(e => e.Token, "passwordresettokens_token_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
            entity.Property(e => e.IsUsed)
                .HasDefaultValue(false)
                .HasColumnName("is_used");
            entity.Property(e => e.Token)
                .HasMaxLength(255)
                .HasColumnName("token");
            entity.Property(e => e.UsedAt).HasColumnName("used_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.PasswordResetTokens)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("passwordresettokens_user_id_fkey");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("refreshtokens_pkey");

            entity.ToTable("refreshtokens", tb => tb.HasComment("JWT refresh tokens for maintaining user sessions"));

            entity.HasIndex(e => e.ExpiresAt, "idx_refresh_tokens_expires_at");

            entity.HasIndex(e => e.IsRevoked, "idx_refresh_tokens_is_revoked");

            entity.HasIndex(e => e.Token, "idx_refresh_tokens_token");

            entity.HasIndex(e => e.UserId, "idx_refresh_tokens_user_id");

            entity.HasIndex(e => e.Token, "refreshtokens_token_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.DeviceInfo)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasComment("Device information stored as JSON (device type, OS, etc.)")
                .HasColumnType("jsonb")
                .HasColumnName("device_info");
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
            entity.Property(e => e.IpAddress)
                .HasComment("IP address where token was issued")
                .HasColumnName("ip_address");
            entity.Property(e => e.IsRevoked)
                .HasDefaultValue(false)
                .HasComment("Flag indicating if token has been revoked")
                .HasColumnName("is_revoked");
            entity.Property(e => e.RevokedAt).HasColumnName("revoked_at");
            entity.Property(e => e.Token)
                .HasMaxLength(255)
                .HasColumnName("token");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.RefreshTokens)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("refreshtokens_user_id_fkey");
        });

        modelBuilder.Entity<Round>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("rounds_pkey");

            entity.ToTable("rounds", tb => tb.HasComment("Individual golf round tracking with status and performance metrics"));

            entity.HasIndex(e => e.CourseId, "idx_rounds_course_id");

            entity.HasIndex(e => e.CurrentHole, "idx_rounds_current_hole");

            entity.HasIndex(e => e.RoundDate, "idx_rounds_round_date");

            entity.HasIndex(e => new { e.UserId, e.RoundDate }, "idx_rounds_user_date");

            entity.HasIndex(e => e.UserId, "idx_rounds_user_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CourseId).HasColumnName("course_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.CurrentHole)
                .HasComment("Current hole being played (1-18)")
                .HasColumnName("current_hole");
            entity.Property(e => e.EndTime).HasColumnName("end_time");
            entity.Property(e => e.FairwaysHit)
                .HasDefaultValue(0)
                .HasComment("Number of fairways hit in regulation")
                .HasColumnName("fairways_hit");
            entity.Property(e => e.GreensInRegulation)
                .HasDefaultValue(0)
                .HasComment("Number of greens reached in regulation strokes")
                .HasColumnName("greens_in_regulation");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.RoundDate).HasColumnName("round_date");
            entity.Property(e => e.RoundMetadata)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasComment("Additional round information and settings")
                .HasColumnType("jsonb")
                .HasColumnName("round_metadata");
            entity.Property(e => e.StartTime).HasColumnName("start_time");
            entity.Property(e => e.TemperatureCelsius)
                .HasPrecision(4, 1)
                .HasColumnName("temperature_celsius");
            entity.Property(e => e.TotalPutts).HasColumnName("total_putts");
            entity.Property(e => e.TotalScore).HasColumnName("total_score");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.WindSpeedKmh)
                .HasPrecision(4, 1)
                .HasColumnName("wind_speed_kmh");
            entity.Property(e => e.StatusId).HasColumnName("status_id");

            entity.HasOne(d => d.Course).WithMany(p => p.Rounds)
                .HasForeignKey(d => d.CourseId)
                .HasConstraintName("rounds_course_id_fkey");

            entity.HasOne(d => d.Status).WithMany(p => p.Rounds)
                .HasForeignKey(d => d.StatusId)
                .HasConstraintName("fk_rounds_status");

            entity.HasOne(d => d.User).WithMany(p => p.Rounds)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("rounds_user_id_fkey");
        });

        modelBuilder.Entity<RoundStatus>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("roundstatuses_pkey");

            entity.ToTable("roundstatuses");

            entity.HasIndex(e => e.Name, "idx_round_statuses_name");

            entity.HasIndex(e => e.Name, "roundstatuses_name_key").IsUnique();

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Description)
                .HasMaxLength(255)
                .HasColumnName("description");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
        });

        modelBuilder.Entity<SkillLevel>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("skilllevels_pkey");

            entity.ToTable("skilllevels");

            entity.HasIndex(e => e.Name, "idx_skill_levels_name");

            entity.HasIndex(e => e.Name, "skilllevels_name_key").IsUnique();

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Description)
                .HasMaxLength(255)
                .HasColumnName("description");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("users_pkey");

            entity.ToTable("users", tb => tb.HasComment("Core user information including golf-specific data and preferences"));

            entity.HasIndex(e => e.Email, "idx_users_email");

            entity.HasIndex(e => e.EmailVerificationToken, "idx_users_email_verification_token");

            entity.HasIndex(e => e.EmailVerified, "idx_users_email_verified");

            entity.HasIndex(e => e.FailedLoginAttempts, "idx_users_failed_login_attempts");

            entity.HasIndex(e => e.Handicap, "idx_users_handicap");

            entity.HasIndex(e => e.LockedUntil, "idx_users_locked_until");

            entity.HasIndex(e => e.PasswordResetToken, "idx_users_password_reset_token");

            entity.HasIndex(e => e.PlayingStyle, "idx_users_playing_style").HasMethod("gin");

            entity.HasIndex(e => e.Preferences, "idx_users_preferences").HasMethod("gin");

            entity.HasIndex(e => e.SkillLevelId, "idx_users_skill_level_id");

            entity.HasIndex(e => e.StatusId, "idx_users_status_id");

            entity.HasIndex(e => e.TwoFactorEnabled, "idx_users_two_factor_enabled");

            entity.HasIndex(e => e.Email, "users_email_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .HasColumnName("email");
            entity.Property(e => e.EmailVerificationExpires).HasColumnName("email_verification_expires");
            entity.Property(e => e.EmailVerificationToken)
                .HasMaxLength(255)
                .HasColumnName("email_verification_token");
            entity.Property(e => e.EmailVerified)
                .HasDefaultValue(false)
                .HasComment("Flag indicating if email address has been verified")
                .HasColumnName("email_verified");
            entity.Property(e => e.FailedLoginAttempts)
                .HasDefaultValue(0)
                .HasComment("Counter for failed login attempts (for account locking)")
                .HasColumnName("failed_login_attempts");
            entity.Property(e => e.FirstName)
                .HasMaxLength(100)
                .HasColumnName("first_name");
            entity.Property(e => e.Handicap)
                .HasPrecision(4, 1)
                .HasComment("Golf handicap index, typically between -10 and 54")
                .HasColumnName("handicap");
            entity.Property(e => e.LastLoginAt).HasColumnName("last_login_at");
            entity.Property(e => e.LastName)
                .HasMaxLength(100)
                .HasColumnName("last_name");
            entity.Property(e => e.LockedUntil)
                .HasComment("Timestamp until which account is locked due to failed attempts")
                .HasColumnName("locked_until");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .HasColumnName("password_hash");
            entity.Property(e => e.PasswordResetExpires).HasColumnName("password_reset_expires");
            entity.Property(e => e.PasswordResetToken)
                .HasMaxLength(255)
                .HasColumnName("password_reset_token");
            entity.Property(e => e.PlayingStyle)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasComment("Playing style characteristics stored as JSON (aggressive, conservative, etc.)")
                .HasColumnType("jsonb")
                .HasColumnName("playing_style");
            entity.Property(e => e.Preferences)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasComment("User preferences stored as JSON (club preferences, notifications, etc.)")
                .HasColumnType("jsonb")
                .HasColumnName("preferences");
            entity.Property(e => e.SkillLevelId)
                .HasDefaultValue(1)
                .HasColumnName("skill_level_id");
            entity.Property(e => e.StatusId)
                .HasDefaultValue(1)
                .HasColumnName("status_id");
            entity.Property(e => e.TwoFactorEnabled)
                .HasDefaultValue(false)
                .HasComment("Flag indicating if 2FA is enabled for the user")
                .HasColumnName("two_factor_enabled");
            entity.Property(e => e.TwoFactorSecret)
                .HasMaxLength(255)
                .HasColumnName("two_factor_secret");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.SkillLevel).WithMany(p => p.Users)
                .HasForeignKey(d => d.SkillLevelId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_users_skill_level");

            entity.HasOne(d => d.Status).WithMany(p => p.Users)
                .HasForeignKey(d => d.StatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_users_status");
        });

        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("usersessions_pkey");

            entity.ToTable("usersessions", tb => tb.HasComment("Active user sessions for tracking and management"));

            entity.HasIndex(e => e.ExpiresAt, "idx_user_sessions_expires_at");

            entity.HasIndex(e => e.IsActive, "idx_user_sessions_is_active");

            entity.HasIndex(e => e.LastActivity, "idx_user_sessions_last_activity");

            entity.HasIndex(e => e.SessionToken, "idx_user_sessions_session_token");

            entity.HasIndex(e => e.UserId, "idx_user_sessions_user_id");

            entity.HasIndex(e => e.SessionToken, "usersessions_session_token_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnName("created_at");
            entity.Property(e => e.DeviceInfo)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasComment("Device information stored as JSON")
                .HasColumnType("jsonb")
                .HasColumnName("device_info");
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
            entity.Property(e => e.IpAddress).HasColumnName("ip_address");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.LastActivity)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasComment("Last activity timestamp for session management")
                .HasColumnName("last_activity");
            entity.Property(e => e.SessionToken)
                .HasMaxLength(255)
                .HasColumnName("session_token");
            entity.Property(e => e.UserAgent)
                .HasComment("User agent string from the request")
                .HasColumnName("user_agent");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.UserSessions)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("usersessions_user_id_fkey");
        });

        modelBuilder.Entity<UserStatus>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("userstatuses_pkey");

            entity.ToTable("userstatuses");

            entity.HasIndex(e => e.Name, "idx_user_statuses_name");

            entity.HasIndex(e => e.Name, "userstatuses_name_key").IsUnique();

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Description)
                .HasMaxLength(255)
                .HasColumnName("description");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
