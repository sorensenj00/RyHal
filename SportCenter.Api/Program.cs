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
        // Attempt migrations; if tables already exist, this may throw — that's okay
        db.Database.Migrate();
    }
    Console.WriteLine("[DB] Migrations applied successfully.");
}
catch (Exception ex) when (ex.Message.Contains("already exists") || ex.Message.Contains("42P07"))
{
    Console.WriteLine("[DB] Tables already exist — marking migrations as applied.");
    // Try to insert migration record manually so EF knows it's applied
    try
    {
        using (var scope2 = app.Services.CreateScope())
        {
            var db2 = scope2.ServiceProvider.GetRequiredService<AppDbContext>();
            var conn = db2.Database.GetDbConnection();
            await conn.OpenAsync();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"") 
                VALUES ('20260415084145_InitialCreate', '8.0.10')
                ON CONFLICT (""MigrationId"") DO NOTHING;";
            await cmd.ExecuteNonQueryAsync();
            await conn.CloseAsync();
        }
        Console.WriteLine("[DB] Migration history recorded.");
    }
    catch (Exception ex2)
    {
        Console.WriteLine($"[DB] Could not record migration history: {ex2.Message}");
    }
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

// Use HTTP only in development (no HTTPS redirection)
// app.UseHttpsRedirection(); // Disabled - Kestrel HTTPS config not set

app.UseCors("AllowReactDev");

// Global error handler for API
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        var error = new { message = ex.Message };
        await context.Response.WriteAsJsonAsync(error);
    }
});

// Map controllers
app.MapControllers();

// Testing EventService in-memory CRUD (wrap in scope)
try
{
    using (var testScope = app.Services.CreateScope())
    {
        var eventService = testScope.ServiceProvider.GetRequiredService<EventService>();

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
}
catch (Exception ex)
{
    Console.WriteLine($"[Test] In-memory test skipped: {ex.GetType().Name}: {ex.Message}");
}

app.Run();
