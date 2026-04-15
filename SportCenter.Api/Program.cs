using SportCenter.Api.Models;
using SportCenter.Api.Services;
using SportCenter.Api.DTOs;
using SportCenter.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactDev",
        policy => policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
                        .AllowAnyHeader()
                        .AllowAnyMethod());
});

// Register DbContext and EventService for DI
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("SupabaseConnection")));
builder.Services.AddScoped<EventService>();

var app = builder.Build();

// Apply pending migrations automatically (optional for dev)
// Wrapped in try-catch so app starts even if DB is unreachable
try
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();
    }
    Console.WriteLine("[DB] Migrations applied successfully.");
}
catch (Exception ex)
{
    Console.WriteLine($"[DB Warning] Migrations skipped: {ex.GetType().Name}: {ex.Message}");
    Console.WriteLine("[DB] App will continue without database connection.");
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowReactDev");

// Map controllers
app.MapControllers();

// Testing EventService in-memory CRUD (wrap in scope)
using (var scope = app.Services.CreateScope())
{
    var eventService = scope.ServiceProvider.GetRequiredService<EventService>();

    await eventService.CreateEventAsync(
        "Test Event",
        "Test Description",
        DateTime.Now,
        DateTime.Now.AddHours(1),
        EventCategory.Other,
        new List<LocationBookingDto> { new LocationBookingDto(1, DateTime.Now, DateTime.Now.AddHours(1)) },
        null,
        "System"
    );

    var testEvents = await eventService.GetTestEventsAsync();
    Console.WriteLine($"[Test] Number of events in memory: {testEvents.Count}");
    foreach (var e in testEvents)
    {
        Console.WriteLine($"[Test] Event Name: {e.Name}");
    }
}

app.Run();
