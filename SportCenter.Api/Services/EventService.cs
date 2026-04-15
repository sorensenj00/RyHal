using SportCenter.Api.Data;
using SportCenter.Api.Models;
using SportCenter.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace SportCenter.Api.Services;

public class EventService
{
    private readonly AppDbContext? _context;
    private static readonly List<Event> _testEvents = new();
    private static readonly List<EventSeries> _testSeries = new();

    public EventService(AppDbContext context)
    {
        _context = context;
    }

    // Validation helper for non-draft events
    private static void ValidateNonDraftLocations(List<LocationBookingDto> locations, bool isDraft)
    {
        if (!isDraft)
        {
            if (locations == null || locations.Count == 0)
                throw new ArgumentException("Der skal være mindst én lokation for ikke-kladde events.");

            foreach (var loc in locations)
            {
                if (loc.LocationId == null)
                    throw new ArgumentException("Lokation-ID er påkrævet for ikke-kladde events.");
                if (loc.StartTime == null || loc.EndTime == null)
                    throw new ArgumentException("Start- og sluttid er påkrævet for ikke-kladde events.");
                if (loc.StartTime >= loc.EndTime)
                    throw new ArgumentException($"Lokation {loc.LocationId} har ugyldige tidsintervaller (Start skal være før Slut).");
            }
        }
        else
        {
            // For drafts, validate that if any time/location is provided, both must be present
            foreach (var loc in locations)
            {
                if (loc.LocationId.HasValue != loc.StartTime.HasValue || loc.LocationId.HasValue != loc.EndTime.HasValue)
                {
                    throw new ArgumentException("Hvis en lokation angives, skal både LocationId, StartTime og EndTime være udfyldt.");
                }
            }
        }
    }

    public async Task<EventResponseDto> CreateAsync(CreateEventDto dto)
    {
        ValidateNonDraftLocations(dto.Locations, dto.IsDraft);

        // Enkeltstående Event
        if (!dto.IsRecurring || dto.RecurrenceFrequency == null || dto.RecurrenceEndDate == null)
        {
            var newEvent = new Event(
                dto.Name,
                dto.Description,
                ToUtc(dto.StartTime),
                ToUtc(dto.EndTime),
                dto.Category,
                dto.TemplateId,
                null,
                0
            )
            {
                IsDraft = dto.IsDraft
            };

            foreach (var loc in dto.Locations)
            {
                newEvent.EventLocations.Add(new EventLocation
                {
                    LocationId = loc.LocationId,
                    StartTime = ToUtc(loc.StartTime),
                    EndTime = ToUtc(loc.EndTime)
                });
            }

            _context.Events.Add(newEvent);
            await _context.SaveChangesAsync();

            var locationDtos = newEvent.EventLocations
                .Select(el => new LocationBookingDto(el.LocationId, el.StartTime, el.EndTime))
                .ToList();

            return new EventResponseDto(
                newEvent.Id,
                newEvent.Name,
                newEvent.Description ?? "",
                newEvent.StartTime,
                newEvent.EndTime,
                newEvent.Category.ToString(),
                newEvent.SeriesId,
                newEvent.IsModifiedFromSeries,
                newEvent.IsCancelled,
                newEvent.IsDraft,
                locationDtos,
                newEvent.TemplateId
            );
        }
        else // Gentagende event (Event Series)
        {
            var frequency = Enum.Parse<RecurrenceFrequency>(dto.RecurrenceFrequency, true);
            var rule = new RecurrenceRule(frequency, dto.RecurrenceEndDate.Value);

            // Brug første lokation som standard lokation for serien (hvis nogen)
            int seriesLocationId = dto.Locations.FirstOrDefault()?.LocationId ?? 0;

            var series = new EventSeries(
                dto.Name,
                dto.Description,
                dto.Category,
                rule,
                seriesLocationId,
                dto.TemplateId,
                dto.CreatedBy
            );

            _context.Set<EventSeries>().Add(series);
            await _context.SaveChangesAsync(); // Generér series.Id

            // For drafts, use dummy dates; otherwise use actual schedule
            var baseStart = dto.StartTime ?? DateTime.Now;
            var baseEnd = dto.EndTime ?? baseStart.AddHours(1);
            var occurrences = rule.GenerateOccurrences(baseStart);
            var duration = baseEnd - baseStart;

            foreach (var date in occurrences)
            {
                var eventInstance = new Event(
                    dto.Name,
                    dto.Description,
                    dto.IsDraft ? null : ToUtc(date),
                    dto.IsDraft ? null : ToUtc(date.Add(duration)),
                    dto.Category,
                    dto.TemplateId,
                    series.Id,
                    0
                )
                {
                    IsDraft = dto.IsDraft
                };

                // Tilføj lokationer for hver forekomst, juster datoer til forekomstdato
                foreach (var loc in dto.Locations)
                {
                    if (dto.IsDraft)
                    {
                        // For kladder beholder vi de angivede tidspunkter (som kan være null)
                        eventInstance.EventLocations.Add(new EventLocation
                        {
                            LocationId = loc.LocationId,
                            StartTime = loc.StartTime,
                            EndTime = loc.EndTime
                        });
                    }
                    else
                    {
                        var occDate = date.Date;
                        var locStart = ToUtc(occDate + (loc.StartTime?.TimeOfDay ?? TimeSpan.Zero));
                        var locEnd = ToUtc(occDate + (loc.EndTime?.TimeOfDay ?? TimeSpan.Zero));

                        eventInstance.EventLocations.Add(new EventLocation
                        {
                            LocationId = loc.LocationId,
                            StartTime = locStart,
                            EndTime = locEnd
                        });
                    }
                }

                series.Events.Add(eventInstance);
                _context.Events.Add(eventInstance);
            }

            await _context.SaveChangesAsync();

            var firstOccurrence = series.Events.First();
            var locationDtos = firstOccurrence.EventLocations
                .Select(el => new LocationBookingDto(el.LocationId, el.StartTime, el.EndTime))
                .ToList();

            return new EventResponseDto(
                firstOccurrence.Id,
                firstOccurrence.Name,
                firstOccurrence.Description ?? "",
                firstOccurrence.StartTime,
                firstOccurrence.EndTime,
                firstOccurrence.Category.ToString(),
                firstOccurrence.SeriesId,
                firstOccurrence.IsModifiedFromSeries,
                firstOccurrence.IsCancelled,
                firstOccurrence.IsDraft,
                locationDtos,
                firstOccurrence.TemplateId
            );
        }
    }

    // Map Event entity to EventResponseDto
    private static EventResponseDto ToEventResponseDto(Event e)
    {
        return new EventResponseDto(
            e.Id,
            e.Name,
            e.Description ?? "",
            e.StartTime,
            e.EndTime,
            e.Category.ToString(),
            e.SeriesId,
            e.IsModifiedFromSeries,
            e.IsCancelled,
            e.IsDraft,
            e.EventLocations.Select(el => new LocationBookingDto(el.LocationId, el.StartTime, el.EndTime)).ToList(),
            e.TemplateId
        );
    }

    // Convert DateTime? to UTC for PostgreSQL compatibility
    private static DateTime? ToUtc(DateTime? dt)
    {
        if (!dt.HasValue) return null;
        var value = dt.Value;
        // Convert based on current Kind, then mark as UTC
        return value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime();
    }

    private static DateTime ToUtc(DateTime dt)
    {
        // Convert based on current Kind, then mark as UTC
        return dt.Kind == DateTimeKind.Utc ? dt : dt.ToUniversalTime();
    }

    public async Task<List<EventResponseDto>> GetAllAsync()
    {
        var events = await _context.Events
            .Include(e => e.EventLocations)
            .ThenInclude(el => el.Location)
            .ToListAsync();
        return events.Select(ToEventResponseDto).ToList();
    }

    // Get draft events
    public async Task<List<EventResponseDto>> GetDraftEventsAsync()
    {
        var drafts = await _context.Events
            .Include(e => e.EventLocations)
            .ThenInclude(el => el.Location)
            .Where(e => e.IsDraft)
            .ToListAsync();
        return drafts.Select(ToEventResponseDto).ToList();
    }

    // Quick update draft: fill in missing data and mark as non-draft
    public async Task<EventResponseDto> PublishDraftAsync(int eventId, CreateEventDto updateDto)
    {
        var existingEvent = await _context.Events
            .Include(e => e.EventLocations)
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (existingEvent == null)
            throw new KeyNotFoundException($"Event with ID {eventId} not found.");

        if (!existingEvent.IsDraft)
            throw new InvalidOperationException($"Event {eventId} is not a draft and cannot be published this way.");

        // Validate that all required fields are now provided
        if (updateDto.StartTime == null || updateDto.EndTime == null)
            throw new ArgumentException("StartTime og EndTime er påkrævet for at Publicer en kladde.");
        if (updateDto.Locations == null || updateDto.Locations.Count == 0 || !updateDto.Locations.Any(l => l.LocationId.HasValue))
            throw new ArgumentException("Mindst én lokation med tid er påkrævet for at publicer en kladde.");

        // Update event properties
        existingEvent.StartTime = ToUtc(updateDto.StartTime);
        existingEvent.EndTime = ToUtc(updateDto.EndTime);
        existingEvent.IsDraft = false;

        // Clear existing locations and add updated ones
        _context.EventLocations.RemoveRange(existingEvent.EventLocations);
        existingEvent.EventLocations.Clear();

        foreach (var loc in updateDto.Locations)
        {
            existingEvent.EventLocations.Add(new EventLocation
            {
                LocationId = loc.LocationId,
                StartTime = ToUtc(loc.StartTime),
                EndTime = ToUtc(loc.EndTime)
            });
        }

        await _context.SaveChangesAsync();

        var locationDtos = existingEvent.EventLocations
            .Select(el => new LocationBookingDto(el.LocationId, el.StartTime, el.EndTime))
            .ToList();

        return new EventResponseDto(
            existingEvent.Id,
            existingEvent.Name,
            existingEvent.Description ?? "",
            existingEvent.StartTime,
            existingEvent.EndTime,
            existingEvent.Category.ToString(),
            existingEvent.SeriesId,
            existingEvent.IsModifiedFromSeries,
            existingEvent.IsCancelled,
            existingEvent.IsDraft,
            locationDtos,
            existingEvent.TemplateId
        );
    }

    // In-memory CRUD for testing (no DTOs, no database)
    public async Task<Event> CreateEventAsync(
        string name,
        string? description,
        DateTime? startTime,
        DateTime? endTime,
        EventCategory category,
        List<LocationBookingDto> locations,
        int? templateId,
        string createdBy,
        bool isRecurring = false,
        string? recurrenceFrequency = null,
        DateTime? recurrenceEndDate = null,
        bool isDraft = false)
    {
        // For non-draft, validate
        if (!isDraft)
        {
            if (locations == null || locations.Count == 0)
                throw new ArgumentException("Der skal være mindst én lokation.");
            foreach (var loc in locations)
            {
                if (loc.LocationId == null) throw new ArgumentException("LocationId påkrævet.");
                if (loc.StartTime == null || loc.EndTime == null) throw new ArgumentException("Start/End påkrævet.");
                if (loc.StartTime >= loc.EndTime) throw new ArgumentException("StartTime skal være før EndTime.");
            }
        }
        else
        {
            foreach (var loc in locations)
            {
                if (loc.LocationId.HasValue != loc.StartTime.HasValue || loc.LocationId.HasValue != loc.EndTime.HasValue)
                {
                    throw new ArgumentException("Hvis en lokation angives, skal både LocationId, StartTime og EndTime være udfyldt.");
                }
            }
        }

        if (!isRecurring || recurrenceFrequency == null || recurrenceEndDate == null)
        {
            var newId = _testEvents.Count > 0 ? _testEvents.Max(e => e.Id) + 1 : 1;
            var newEvent = new Event(
                name,
                description,
                startTime,
                endTime,
                category,
                templateId,
                null,
                newId
            )
            {
                IsDraft = isDraft
            };

            foreach (var loc in locations)
            {
                newEvent.EventLocations.Add(new EventLocation
                {
                    LocationId = loc.LocationId,
                    StartTime = loc.StartTime,
                    EndTime = loc.EndTime
                });
            }

            _testEvents.Add(newEvent);
            return await Task.FromResult(newEvent);
        }
        else
        {
            var frequency = Enum.Parse<RecurrenceFrequency>(recurrenceFrequency, true);
            var rule = new RecurrenceRule(frequency, recurrenceEndDate.Value);

            int? seriesLocationId = locations.FirstOrDefault()?.LocationId;

            var seriesId = _testSeries.Count > 0 ? _testSeries.Max(s => s.Id) + 1 : 1;
            var series = new EventSeries(
                name,
                description,
                category,
                rule,
                seriesLocationId ?? 0,
                templateId,
                createdBy
            );
            series.Id = seriesId;
            _testSeries.Add(series);

            var baseStart = startTime ?? DateTime.Now;
            var occs = rule.GenerateOccurrences(baseStart);
            var duration = (endTime ?? baseStart) - baseStart;
            Event? firstEvent = null;

            foreach (var date in occs)
            {
                var eventId = _testEvents.Count > 0 ? _testEvents.Max(e => e.Id) + 1 : 1;
                var eventInstance = new Event(
                    name,
                    description,
                    isDraft ? null : date,
                    isDraft ? null : date.Add(duration),
                    category,
                    templateId,
                    seriesId,
                    eventId
                )
                {
                    IsDraft = isDraft
                };

                foreach (var loc in locations)
                {
                    if (isDraft)
                    {
                        eventInstance.EventLocations.Add(new EventLocation
                        {
                            LocationId = loc.LocationId,
                            StartTime = loc.StartTime,
                            EndTime = loc.EndTime
                        });
                    }
                    else
                    {
                        var occDate = date.Date;
                        var locStart = ToUtc(occDate + (loc.StartTime?.TimeOfDay ?? TimeSpan.Zero));
                        var locEnd = ToUtc(occDate + (loc.EndTime?.TimeOfDay ?? TimeSpan.Zero));

                        eventInstance.EventLocations.Add(new EventLocation
                        {
                            LocationId = loc.LocationId,
                            StartTime = locStart,
                            EndTime = locEnd
                        });
                    }
                }

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
