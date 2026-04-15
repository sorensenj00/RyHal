using SportCenter.Api.Models;
using SportCenter.Api.Services;
using SportCenter.Api.DTOs;
using SportCenter.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
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
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AllowReactDev");

// Map controllers
app.MapControllers();

// Testing EventService in-memory CRUD
var eventService = app.Services.GetRequiredService<EventService>();

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

app.Run();
