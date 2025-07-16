using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using caddie.portal.dal.Models.AI;

namespace caddie.portal.dal.Context.Configuration;

public class ClubRecommendationConfiguration : IEntityTypeConfiguration<ClubRecommendation>
{
    public void Configure(EntityTypeBuilder<ClubRecommendation> builder)
    {
        builder.ToTable("club_recommendations", t => t.HasCheckConstraint("CK_ClubRecommendation_ConfidenceScore", "confidence_score >= 0 AND confidence_score <= 1"));

        builder.HasKey(cr => cr.Id);

        builder.Property(cr => cr.UserId)
            .IsRequired();

        builder.Property(cr => cr.RecommendedClub)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(cr => cr.ConfidenceScore)
            .HasColumnType("decimal(3,2)");

        builder.Property(cr => cr.DistanceToTarget)
            .HasColumnType("decimal(6,2)");

        builder.Property(cr => cr.ContextUsed)
            .HasColumnType("jsonb");

        builder.Property(cr => cr.ActualClubUsed)
            .HasMaxLength(50);

        builder.Property(cr => cr.RecommendationMetadata)
            .HasColumnType("jsonb");

        // Indexes
        builder.HasIndex(cr => cr.UserId)
            .HasDatabaseName("idx_club_recommendations_user_id");

        builder.HasIndex(cr => cr.RoundId)
            .HasDatabaseName("idx_club_recommendations_round_id");

        builder.HasIndex(cr => cr.HoleId)
            .HasDatabaseName("idx_club_recommendations_hole_id");

        builder.HasIndex(cr => cr.LocationId)
            .HasDatabaseName("idx_club_recommendations_location_id");

        builder.HasIndex(cr => cr.RecommendedClub)
            .HasDatabaseName("idx_club_recommendations_recommended_club");

        builder.HasIndex(cr => cr.ConfidenceScore)
            .HasDatabaseName("idx_club_recommendations_confidence_score");

        builder.HasIndex(cr => cr.WasAccepted)
            .HasDatabaseName("idx_club_recommendations_was_accepted");

        builder.HasIndex(cr => cr.ContextUsed)
            .HasDatabaseName("idx_club_recommendations_context_used")
            .HasMethod("GIN");

        // Relationships
        builder.HasOne(cr => cr.User)
            .WithMany(u => u.ClubRecommendations)
            .HasForeignKey(cr => cr.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cr => cr.Round)
            .WithMany(r => r.ClubRecommendations)
            .HasForeignKey(cr => cr.RoundId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cr => cr.Hole)
            .WithMany(h => h.ClubRecommendations)
            .HasForeignKey(cr => cr.HoleId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(cr => cr.Location)
            .WithMany(l => l.ClubRecommendations)
            .HasForeignKey(cr => cr.LocationId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}