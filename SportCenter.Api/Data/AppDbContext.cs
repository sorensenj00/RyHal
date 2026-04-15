namespace SportCenter.Api.Data;

using Microsoft.EntityFrameworkCore;
using SportCenter.Api.Models;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Event> Events { get; set; }
    public DbSet<EventSeries> EventSeries { get; set; }
    public DbSet<Location> Locations { get; set; }
    public DbSet<EventLocation> EventLocations { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure EventSeries ownership of RecurrenceRule
        modelBuilder.Entity<EventSeries>()
            .OwnsOne(s => s.Rule, rule =>
            {
                rule.Property(r => r.Frequency).HasColumnName("Frequency");
                rule.Property(r => r.EndDate).HasColumnName("EndDate");
            });

        // Configure EventLocation relationships
        modelBuilder.Entity<EventLocation>()
            .HasKey(el => el.Id);

        modelBuilder.Entity<EventLocation>()
            .HasOne(el => el.Event)
            .WithMany(e => e.EventLocations)
            .HasForeignKey(el => el.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<EventLocation>()
            .HasOne(el => el.Location)
            .WithMany()
            .HasForeignKey(el => el.LocationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}