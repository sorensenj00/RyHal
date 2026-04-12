namespace SportCenter.Api.Data;

using Microsoft.EntityFrameworkCore;
using SportCenter.Api.Models; 

public class AppDbContext : DbContext
{
    // Constructoren her er nødvendig for at Dependency Injection virker
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // Her definerer du dine tabeller. 
    // "Events" bliver navnet på tabellen i din SQL-database.
    public DbSet<Event> Events { get; set; }
    
    // Hvis du har andre modeller, tilføjer du dem bare herunder:
    // public DbSet<Category> Categories { get; set; }
}