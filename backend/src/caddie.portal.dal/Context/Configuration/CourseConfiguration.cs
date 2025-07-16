using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using caddie.portal.dal.Models.Courses;

namespace caddie.portal.dal.Context.Configuration;

public class CourseConfiguration : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> builder)
    {
        builder.ToTable("courses", t => {
            t.HasCheckConstraint("CK_Course_ParTotal", "par_total >= 54 AND par_total <= 90");
            t.HasCheckConstraint("CK_Course_TotalHoles", "total_holes IN (9, 18, 27, 36)");
            t.HasCheckConstraint("CK_Course_YardageTotal", "yardage_total > 0");
            t.HasCheckConstraint("CK_Course_CourseRating", "course_rating >= 60 AND course_rating <= 80");
            t.HasCheckConstraint("CK_Course_SlopeRating", "slope_rating >= 55 AND slope_rating <= 155");
        });

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.City)
            .HasMaxLength(100);

        builder.Property(c => c.State)
            .HasMaxLength(50);

        builder.Property(c => c.Country)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.Phone)
            .HasMaxLength(20);

        builder.Property(c => c.Website)
            .HasMaxLength(255);

        builder.Property(c => c.Email)
            .HasMaxLength(255);

        builder.Property(c => c.ParTotal)
            .IsRequired();

        builder.Property(c => c.TotalHoles)
            .IsRequired()
            .HasDefaultValue(18);

        builder.Property(c => c.YardageTotal);

        builder.Property(c => c.CourseRating)
            .HasColumnType("decimal(3,1)");

        builder.Property(c => c.SlopeRating);

        builder.Property(c => c.Difficulty)
            .IsRequired()
            .HasDefaultValue(CourseDifficulty.Moderate);

        builder.Property(c => c.Location)
            .HasColumnType("geometry(Point, 4326)");

        builder.Property(c => c.Boundary)
            .HasColumnType("geometry(Polygon, 4326)");

        builder.Property(c => c.Timezone)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("UTC");

        builder.Property(c => c.GreenFeeRange)
            .HasColumnType("jsonb");

        builder.Property(c => c.Amenities)
            .HasColumnType("jsonb");

        builder.Property(c => c.CourseMetadata)
            .HasColumnType("jsonb");

        builder.Property(c => c.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        // Indexes
        builder.HasIndex(c => c.Name)
            .HasDatabaseName("idx_courses_name");

        builder.HasIndex(c => c.Location)
            .HasDatabaseName("idx_courses_location")
            .HasMethod("GIST");

        builder.HasIndex(c => c.Boundary)
            .HasDatabaseName("idx_courses_boundary")
            .HasMethod("GIST");

        builder.HasIndex(c => c.Difficulty)
            .HasDatabaseName("idx_courses_difficulty");

        builder.HasIndex(c => c.ParTotal)
            .HasDatabaseName("idx_courses_par_total");

        builder.HasIndex(c => c.IsActive)
            .HasDatabaseName("idx_courses_is_active");

        builder.HasIndex(c => c.Amenities)
            .HasDatabaseName("idx_courses_amenities")
            .HasMethod("GIN");

        // Relationships
        builder.HasMany(c => c.Holes)
            .WithOne(h => h.Course)
            .HasForeignKey(h => h.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.Rounds)
            .WithOne(r => r.Course)
            .HasForeignKey(r => r.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.ChatSessions)
            .WithOne(cs => cs.Course)
            .HasForeignKey(cs => cs.CourseId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(c => c.Locations)
            .WithOne(l => l.Course)
            .HasForeignKey(l => l.CourseId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}