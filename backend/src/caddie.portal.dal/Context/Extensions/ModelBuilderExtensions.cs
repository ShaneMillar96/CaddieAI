using Microsoft.EntityFrameworkCore;
using caddie.portal.dal.Models.Users;
using caddie.portal.dal.Models.Courses;
using caddie.portal.dal.Models.Rounds;
using caddie.portal.dal.Models.AI;

namespace caddie.portal.dal.Context.Extensions;

public static class ModelBuilderExtensions
{
    public static void ConfigurePostgresEnums(this ModelBuilder modelBuilder)
    {
        // Configure PostgreSQL enums
        modelBuilder.HasPostgresEnum<UserStatus>();
        modelBuilder.HasPostgresEnum<SkillLevel>();
        modelBuilder.HasPostgresEnum<CourseDifficulty>();
        modelBuilder.HasPostgresEnum<HoleType>();
        modelBuilder.HasPostgresEnum<RoundStatus>();
        modelBuilder.HasPostgresEnum<WeatherCondition>();
        modelBuilder.HasPostgresEnum<MessageType>();
        modelBuilder.HasPostgresEnum<ChatSessionStatus>();
    }

    public static void ConfigureCommonProperties(this ModelBuilder modelBuilder)
    {
        // Configure common properties for all entities
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            // Configure primary key generation
            var primaryKey = entityType.FindPrimaryKey();
            if (primaryKey != null && primaryKey.Properties.Count == 1)
            {
                var keyProperty = primaryKey.Properties[0];
                if (keyProperty.ClrType == typeof(Guid))
                {
                    modelBuilder.Entity(entityType.ClrType)
                        .Property(keyProperty.Name)
                        .HasDefaultValueSql("gen_random_uuid()");
                }
            }

            // Configure timestamps
            if (entityType.ClrType.GetProperty("CreatedAt") != null)
            {
                modelBuilder.Entity(entityType.ClrType)
                    .Property("CreatedAt")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");
            }

            if (entityType.ClrType.GetProperty("UpdatedAt") != null)
            {
                modelBuilder.Entity(entityType.ClrType)
                    .Property("UpdatedAt")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");
            }

            // Configure Timestamp property for entities that have it
            if (entityType.ClrType.GetProperty("Timestamp") != null)
            {
                modelBuilder.Entity(entityType.ClrType)
                    .Property("Timestamp")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");
            }
        }
    }
}