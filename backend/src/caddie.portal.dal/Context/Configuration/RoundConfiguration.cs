using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using caddie.portal.dal.Models.Rounds;

namespace caddie.portal.dal.Context.Configuration;

public class RoundConfiguration : IEntityTypeConfiguration<Round>
{
    public void Configure(EntityTypeBuilder<Round> builder)
    {
        builder.ToTable("rounds", t => {
            t.HasCheckConstraint("CK_Round_CurrentHole", "current_hole >= 1 AND current_hole <= 18");
            t.HasCheckConstraint("CK_Round_FairwaysHit", "fairways_hit >= 0 AND fairways_hit <= 18");
            t.HasCheckConstraint("CK_Round_GreensInRegulation", "greens_in_regulation >= 0 AND greens_in_regulation <= 18");
        });

        builder.HasKey(r => r.Id);

        builder.Property(r => r.UserId)
            .IsRequired();

        builder.Property(r => r.CourseId)
            .IsRequired();

        builder.Property(r => r.RoundDate)
            .IsRequired();

        builder.Property(r => r.CurrentHole);

        builder.Property(r => r.Status)
            .IsRequired()
            .HasDefaultValue(RoundStatus.NotStarted);

        builder.Property(r => r.FairwaysHit)
            .HasDefaultValue(0);

        builder.Property(r => r.GreensInRegulation)
            .HasDefaultValue(0);

        builder.Property(r => r.TemperatureCelsius)
            .HasColumnType("decimal(4,1)");

        builder.Property(r => r.WindSpeedKmh)
            .HasColumnType("decimal(4,1)");

        builder.Property(r => r.RoundMetadata)
            .HasColumnType("jsonb");

        // Indexes
        builder.HasIndex(r => r.UserId)
            .HasDatabaseName("idx_rounds_user_id");

        builder.HasIndex(r => r.CourseId)
            .HasDatabaseName("idx_rounds_course_id");

        builder.HasIndex(r => r.RoundDate)
            .HasDatabaseName("idx_rounds_round_date");

        builder.HasIndex(r => r.Status)
            .HasDatabaseName("idx_rounds_status");

        builder.HasIndex(r => r.CurrentHole)
            .HasDatabaseName("idx_rounds_current_hole");

        builder.HasIndex(r => r.WeatherCondition)
            .HasDatabaseName("idx_rounds_weather_condition");

        builder.HasIndex(r => new { r.UserId, r.RoundDate })
            .HasDatabaseName("idx_rounds_user_date");

        // Relationships
        builder.HasOne(r => r.User)
            .WithMany(u => u.Rounds)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Course)
            .WithMany(c => c.Rounds)
            .HasForeignKey(r => r.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Locations)
            .WithOne(l => l.Round)
            .HasForeignKey(l => l.RoundId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.ChatSessions)
            .WithOne(cs => cs.Round)
            .HasForeignKey(cs => cs.RoundId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.ClubRecommendations)
            .WithOne(cr => cr.Round)
            .HasForeignKey(cr => cr.RoundId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}