using SportCenter.Api.Data;

namespace SportCenter.Api.Services;
using SportCenter.Api.Models;
using SportCenter.Api.DTOs;
using Microsoft.EntityFrameworkCore;

public class EventService
{
    private readonly AppDbContext _context;
    private static readonly List<Event> _testEvents = new();
    
    private static readonly List<EventSeries> _testSeries = new();

    public EventService(AppDbContext context) => _context = context;
    
    public async Task<EventResponseDto> CreateAsync(CreateEventDto dto)
    {
        // Enkeltstående Event
        if (!dto.IsRecurring || dto.RecurrenceFrequency == null || dto.RecurrenceEndDate == null)
        {
            var newEvent = new Event(
                dto.Name,
                dto.Description,
                dto.StartTime,
                dto.EndTime,
                dto.Category,
                dto.LocationId,
                dto.TemplateId,
                null
            );
        
            _context.Events.Add(newEvent);
            await _context.SaveChangesAsync();
        
            return new EventResponseDto(
                newEvent.Id, newEvent.Name, newEvent.Description ?? "", newEvent.StartTime, newEvent.EndTime, 
                newEvent.Category.ToString(), newEvent.SeriesId, newEvent.IsModifiedFromSeries, newEvent.IsCancelled, 
                newEvent.LocationId, newEvent.TemplateId
            );
        }
        else
        {
            // Gentagende event (Event Series)
            var frequency = Enum.Parse<RecurrenceFrequency>(dto.RecurrenceFrequency, true);
            var rule = new RecurrenceRule(frequency, dto.RecurrenceEndDate.Value);
            
            var series = new EventSeries(
                dto.Name, dto.Description, dto.Category, rule, dto.LocationId, dto.TemplateId, dto.CreatedBy
            );
            _context.Set<EventSeries>().Add(series); // Husk at EventSeries DbSet skal eksistere, antager det for EF Core
            
            var occurrences = rule.GenerateOccurrences(dto.StartTime);
            var duration = dto.EndTime - dto.StartTime;

            foreach (var date in occurrences)
            {
                var eventInstance = new Event(
                    dto.Name, dto.Description, date, date.Add(duration), dto.Category, 
                    dto.LocationId, dto.TemplateId, series.Id
                );
                series.Events.Add(eventInstance); // Knytter eventet til EF Core Collection
                _context.Events.Add(eventInstance);
            }

            await _context.SaveChangesAsync();

            var firstOcccurence = series.Events.First();

            return new EventResponseDto(
                firstOcccurence.Id, firstOcccurence.Name, firstOcccurence.Description ?? "", firstOcccurence.StartTime, firstOcccurence.EndTime, 
                firstOcccurence.Category.ToString(), firstOcccurence.SeriesId, firstOcccurence.IsModifiedFromSeries, firstOcccurence.IsCancelled, 
                firstOcccurence.LocationId, firstOcccurence.TemplateId
            );
        }
    }

    public async Task<List<Event>> GetAllAsync() => await _context.Events.ToListAsync();

    // In-memory CRUD for testing (no DTOs, no database)
    public async Task<Event> CreateEventAsync(
        string name, 
        string? description, 
        DateTime startTime, 
        DateTime endTime, 
        EventCategory category, 
        int locationId, 
        int? templateId,
        string createdBy,
        bool isRecurring = false,
        string? recurrenceFrequency = null,
        DateTime? recurrenceEndDate = null) 
    {
        if (!isRecurring || recurrenceFrequency == null || recurrenceEndDate == null)
        {
            var newEvent = new Event(name, description, startTime, endTime, category, locationId, templateId, null);
            newEvent.Id = _testEvents.Count > 0 ? _testEvents.Max(e => e.Id) + 1 : 1;
            _testEvents.Add(newEvent);
            return await Task.FromResult(newEvent);
        }
        else
        {
            var frequency = Enum.Parse<RecurrenceFrequency>(recurrenceFrequency, true);
            var rule = new RecurrenceRule(frequency, recurrenceEndDate.Value);
            
            var series = new EventSeries(name, description, category, rule, locationId, templateId, createdBy);
            series.Id = _testSeries.Count > 0 ? _testSeries.Max(s => s.Id) + 1 : 1;
            _testSeries.Add(series);

            var occurrences = rule.GenerateOccurrences(startTime);
            var duration = endTime - startTime;
            Event? firstEvent = null;

            foreach (var date in occurrences)
            {
                var eventInstance = new Event(name, description, date, date.Add(duration), category, locationId, templateId, series.Id);
                eventInstance.Id = _testEvents.Count > 0 ? _testEvents.Max(e => e.Id) + 1 : 1;
                
                _testEvents.Add(eventInstance);
                series.Events.Add(eventInstance);

                if (firstEvent == null) firstEvent = eventInstance;
            }

            return await Task.FromResult(firstEvent!);
        }
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