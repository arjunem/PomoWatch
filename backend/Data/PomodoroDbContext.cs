using Microsoft.EntityFrameworkCore;
using PomodoroAPI.Models;

namespace PomodoroAPI.Data;

public class PomodoroDbContext : DbContext
{
    public PomodoroDbContext(DbContextOptions<PomodoroDbContext> options) : base(options)
    {
    }

    public DbSet<Session> Sessions { get; set; }
    public DbSet<Settings> Settings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Session entity
        modelBuilder.Entity<Session>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.Property(e => e.DurationMinutes).HasDefaultValue(25);
            
            // Configure DateTime properties to store as UTC
            entity.Property(e => e.StartTime).HasConversion(
                v => v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            entity.Property(e => e.EndTime).HasConversion(
                v => v.HasValue ? v.Value.ToUniversalTime() : (DateTime?)null,
                v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : null);
            entity.Property(e => e.CreatedAt).HasConversion(
                v => v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            entity.Property(e => e.UpdatedAt).HasConversion(
                v => v.HasValue ? v.Value.ToUniversalTime() : (DateTime?)null,
                v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : null);
            entity.Property(e => e.DeletedAt).HasConversion(
                v => v.HasValue ? v.Value.ToUniversalTime() : (DateTime?)null,
                v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : null);
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
        });

        // Configure Settings entity
        modelBuilder.Entity<Settings>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Key).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Value).IsRequired();
            
            // Configure DateTime properties to store as UTC
            entity.Property(e => e.CreatedAt).HasConversion(
                v => v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            entity.Property(e => e.UpdatedAt).HasConversion(
                v => v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            
            // Ensure unique keys
            entity.HasIndex(e => e.Key).IsUnique();
        });
    }
}

