using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using caddie.portal.dal.Models.Rounds;

namespace caddie.portal.dal.Context.Configuration;

public class LocationConfiguration : IEntityTypeConfiguration<Location>
{
    public void Configure(EntityTypeBuilder<Location> builder)
    {
        builder.ToTable("locations", t => {
            t.HasCheckConstraint("CK_Location_HeadingDegrees", "heading_degrees >= 0 AND heading_degrees < 360");
            t.HasCheckConstraint("CK_Location_CurrentHoleDetected", "current_hole_detected >= 1 AND current_hole_detected <= 18");
            t.HasCheckConstraint("CK_Location_PositionOnHole", "position_on_hole IN ('tee', 'fairway', 'rough', 'green', 'hazard', 'unknown')");
        });

        builder.HasKey(l => l.Id);

        builder.Property(l => l.UserId)
            .IsRequired();

        builder.Property(l => l.Latitude)
            .IsRequired()
            .HasColumnType("decimal(10,7)");

        builder.Property(l => l.Longitude)
            .IsRequired()
            .HasColumnType("decimal(10,7)");

        builder.Property(l => l.AltitudeMeters)
            .HasColumnType("decimal(6,2)");

        builder.Property(l => l.AccuracyMeters)
            .HasColumnType("decimal(6,2)");

        builder.Property(l => l.HeadingDegrees)
            .HasColumnType("decimal(5,2)");

        builder.Property(l => l.SpeedMps)
            .HasColumnType("decimal(5,2)");

        builder.Property(l => l.CurrentHoleDetected);

        builder.Property(l => l.DistanceToTeeMeters)
            .HasColumnType("decimal(6,2)");

        builder.Property(l => l.DistanceToPinMeters)
            .HasColumnType("decimal(6,2)");

        builder.Property(l => l.PositionOnHole)
            .HasMaxLength(20);

        builder.Property(l => l.MovementSpeedMps)
            .HasColumnType("decimal(4,2)");

        builder.Property(l => l.CourseBoundaryStatus)
            .HasDefaultValue(false);

        builder.Property(l => l.LastShotLocation)
            .HasColumnType("geometry(Point, 4326)");

        builder.Property(l => l.Timestamp)
            .IsRequired();

        // Indexes
        builder.HasIndex(l => l.UserId)
            .HasDatabaseName("idx_locations_user_id");

        builder.HasIndex(l => l.RoundId)
            .HasDatabaseName("idx_locations_round_id");

        builder.HasIndex(l => l.CourseId)
            .HasDatabaseName("idx_locations_course_id");

        builder.HasIndex(l => l.Timestamp)
            .HasDatabaseName("idx_locations_timestamp");

        builder.HasIndex(l => l.CurrentHoleDetected)
            .HasDatabaseName("idx_locations_current_hole_detected");

        builder.HasIndex(l => l.DistanceToTeeMeters)
            .HasDatabaseName("idx_locations_distance_to_tee");

        builder.HasIndex(l => l.DistanceToPinMeters)
            .HasDatabaseName("idx_locations_distance_to_pin");

        builder.HasIndex(l => l.PositionOnHole)
            .HasDatabaseName("idx_locations_position_on_hole");

        builder.HasIndex(l => l.CourseBoundaryStatus)
            .HasDatabaseName("idx_locations_course_boundary_status");

        builder.HasIndex(l => l.LastShotLocation)
            .HasDatabaseName("idx_locations_last_shot_location")
            .HasMethod("GIST");

        builder.HasIndex(l => new { l.RoundId, l.Timestamp })
            .HasDatabaseName("idx_locations_round_timestamp");

        // Relationships
        builder.HasOne(l => l.User)
            .WithMany(u => u.Locations)
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(l => l.Round)
            .WithMany(r => r.Locations)
            .HasForeignKey(l => l.RoundId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(l => l.Course)
            .WithMany(c => c.Locations)
            .HasForeignKey(l => l.CourseId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(l => l.ClubRecommendations)
            .WithOne(cr => cr.Location)
            .HasForeignKey(cr => cr.LocationId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}