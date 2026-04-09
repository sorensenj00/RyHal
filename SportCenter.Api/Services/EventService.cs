using SportCenter.Api.Data;

namespace SportCenter.Api.Services;
using SportCenter.Api.Models;
using SportCenter.Api.DTOs;
using Microsoft.EntityFrameworkCore;

public class EventService
{
    private readonly AppDbContext _context;
    private static readonly List<Event> _testEvents = new();
    
    public EventService(AppDbContext context) => _context = context;
    
    public async Task<EventResponseDto> CreateAsync(CreateEventDto dto)
    {
        var newEvent = new Event(
            0,
            dto.Name,
            dto.Description,
            dto.StartTime,
            dto.EndTime,
            dto.Category,
            dto.IsRecurring,
            dto.LocationId,
            null,
            dto.TemplateId
        );
    
        _context.Events.Add(newEvent);
        await _context.SaveChangesAsync();
    
        return new EventResponseDto(
            newEvent.Id, 
            newEvent.Name, 
            newEvent.Description ?? "", 
            newEvent.StartTime, 
            newEvent.EndTime, 
            newEvent.Category.ToString(),
            newEvent.IsRecurring,
            newEvent.LocationId,
            newEvent.TemplateId
        );
    }
    
    public async Task<List<Event>> GetAllAsync() => await _context.Events.ToListAsync();

    // In-memory CRUD for testing (no DTOs, no database)
    public async Task<Event> CreateEventAsync(
        int id, 
        string name, 
        string? description, 
        DateTime startTime, 
        DateTime endTime, 
        EventCategory category, 
        bool isRecurring, 
        int locationId, 
        int? templateId) 
    {
        var newEvent = new Event(
            id, 
            name, 
            description, 
            startTime, 
            endTime, 
            category, 
            isRecurring, 
            locationId, 
            null, 
            templateId
        );

        _testEvents.Add(newEvent);
        return await Task.FromResult(newEvent);
    }

    public async Task<List<Event>> GetTestEventsAsync() 
    {
        return await Task.FromResult(_testEvents);
    }

    public async Task<Event?> GetEventByIdAsync(int id) 
    {
        return await Task.FromResult(_testEvents.FirstOrDefault(e => e.Id == id));
    }

    public async Task UpdateEventAsync(Event updatedEvent) 
    {
        var existing = _testEvents.FirstOrDefault(e => e.Id == updatedEvent.Id);
        if (existing != null) 
        {
            _testEvents.Remove(existing);
            _testEvents.Add(updatedEvent);
        }
        await Task.CompletedTask;
    }

    public async Task DeleteEventAsync(int id) 
    {
        var existing = _testEvents.FirstOrDefault(e => e.Id == id);
        if (existing != null) 
        {
            _testEvents.Remove(existing);
        }
        await Task.CompletedTask;
    }
    
    
}