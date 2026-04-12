using SportCenter.Api.Models;
using SportCenter.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Testing EventService in-memory CRUD
var eventService = new EventService(null!); 

await eventService.CreateEventAsync(
    "Test Event", 
    "Test Description", 
    DateTime.Now, 
    DateTime.Now.AddHours(1), 
    EventCategory.Other, 
    1, 
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
