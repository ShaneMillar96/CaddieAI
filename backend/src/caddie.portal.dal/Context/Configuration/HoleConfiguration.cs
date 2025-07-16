using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using caddie.portal.dal.Models.Courses;

namespace caddie.portal.dal.Context.Configuration;

public class HoleConfiguration : IEntityTypeConfiguration<Hole>
{
    public void Configure(EntityTypeBuilder<Hole> builder)
    {
        builder.ToTable("holes", t => {
            t.HasCheckConstraint("CK_Hole_HoleNumber", "hole_number >= 1 AND hole_number <= 18");
            t.HasCheckConstraint("CK_Hole_Par", "par >= 3 AND par <= 5");
            t.HasCheckConstraint("CK_Hole_YardageBlack", "yardage_black > 0");
            t.HasCheckConstraint("CK_Hole_YardageBlue", "yardage_blue > 0");
            t.HasCheckConstraint("CK_Hole_YardageWhite", "yardage_white > 0");
            t.HasCheckConstraint("CK_Hole_YardageRed", "yardage_red > 0");
            t.HasCheckConstraint("CK_Hole_StrokeIndex", "stroke_index >= 1 AND stroke_index <= 18");
            t.HasCheckConstraint("CK_Hole_LadiesYardage", "ladies_yardage > 0");
            t.HasCheckConstraint("CK_Hole_LadiesPar", "ladies_par >= 3 AND ladies_par <= 5");
            t.HasCheckConstraint("CK_Hole_LadiesStrokeIndex", "ladies_stroke_index >= 1 AND ladies_stroke_index <= 18");
        });

        builder.HasKey(h => h.Id);

        builder.Property(h => h.CourseId)
            .IsRequired();

        builder.Property(h => h.HoleNumber)
            .IsRequired();

        builder.Property(h => h.Name)
            .HasMaxLength(100);

        builder.Property(h => h.Par)
            .IsRequired();

        builder.Property(h => h.HoleType)
            .IsRequired();

        builder.Property(h => h.YardageBlack);

        builder.Property(h => h.YardageBlue);

        builder.Property(h => h.YardageWhite);

        builder.Property(h => h.YardageRed);

        builder.Property(h => h.StrokeIndex);

        builder.Property(h => h.LadiesYardage);

        builder.Property(h => h.LadiesPar);

        builder.Property(h => h.LadiesStrokeIndex);

        builder.Property(h => h.TeeLocation)
            .HasColumnType("geometry(Point, 4326)");

        builder.Property(h => h.PinLocation)
            .HasColumnType("geometry(Point, 4326)");

        builder.Property(h => h.HoleLayout)
            .HasColumnType("geometry(Polygon, 4326)");

        builder.Property(h => h.FairwayCenterLine)
            .HasColumnType("geometry(LineString, 4326)");

        builder.Property(h => h.SimpleHazards)
            .HasColumnType("jsonb");

        builder.Property(h => h.HoleMetadata)
            .HasColumnType("jsonb");

        // Unique constraint
        builder.HasIndex(h => new { h.CourseId, h.HoleNumber })
            .IsUnique()
            .HasDatabaseName("idx_holes_course_hole_unique");

        // Indexes
        builder.HasIndex(h => h.CourseId)
            .HasDatabaseName("idx_holes_course_id");

        builder.HasIndex(h => h.HoleNumber)
            .HasDatabaseName("idx_holes_hole_number");

        builder.HasIndex(h => h.Par)
            .HasDatabaseName("idx_holes_par");

        builder.HasIndex(h => h.HoleType)
            .HasDatabaseName("idx_holes_hole_type");

        builder.HasIndex(h => h.StrokeIndex)
            .HasDatabaseName("idx_holes_stroke_index");

        builder.HasIndex(h => h.LadiesPar)
            .HasDatabaseName("idx_holes_ladies_par");

        builder.HasIndex(h => h.TeeLocation)
            .HasDatabaseName("idx_holes_tee_location")
            .HasMethod("GIST");

        builder.HasIndex(h => h.PinLocation)
            .HasDatabaseName("idx_holes_pin_location")
            .HasMethod("GIST");

        builder.HasIndex(h => h.HoleLayout)
            .HasDatabaseName("idx_holes_hole_layout")
            .HasMethod("GIST");

        builder.HasIndex(h => h.FairwayCenterLine)
            .HasDatabaseName("idx_holes_fairway_center_line")
            .HasMethod("GIST");

        builder.HasIndex(h => h.SimpleHazards)
            .HasDatabaseName("idx_holes_simple_hazards")
            .HasMethod("GIN");

        // Relationships
        builder.HasOne(h => h.Course)
            .WithMany(c => c.Holes)
            .HasForeignKey(h => h.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(h => h.ClubRecommendations)
            .WithOne(cr => cr.Hole)
            .HasForeignKey(cr => cr.HoleId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}