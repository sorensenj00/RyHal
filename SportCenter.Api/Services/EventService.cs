using SportCenter.Api.Data;

namespace SportCenter.Api.Services;
using SportCenter.Api.Models;
using SportCenter.Api.DTOs;

public class EventService
{
    private readonly AppDbContext _context;
    
    public EventService(AppDbContext context) => _context = context;
    
    public async Task<EventResponseDto> CreateAsync(CreateEventDto dto)
    {
        var newEvent = new Event
        {
            Name = dto.Name,
            Description = dto.Description,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Category = dto.Category,
            LocationId = dto.LocationId
        };
    
        _context.Events.Add(newEvent);
        await _context.SaveChangesAsync();
    
        return new EventResponseDto(newEvent.Id, newEvent.Name, newEvent.Description ?? "", 
                                    newEvent.StartTime, newEvent.EndTime, newEvent.Category.ToString());
    }
    
    public async Task<List<Event>> GetAllAsync() => await _context.Events.ToListAsync();
    
    
}