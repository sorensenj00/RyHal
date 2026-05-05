using SportCenter.Api.Data;
using SportCenter.Api.Models;
using SportCenter.Api.DTOs;
using Microsoft.EntityFrameworkCore;
using Supabase;

namespace SportCenter.Api.Services;

public class EventService
{
    private readonly AppDbContext? _context;
    private readonly Client? _supabase;
    private static readonly List<Event> _testEvents = new();
    private static readonly List<EventSeries> _testSeries = new();
    private static readonly TimeZoneInfo DanishTimeZone = ResolveDanishTimeZone();

    public EventService(AppDbContext? context = null, Client? supabase = null)
    {
        _context = context;
        _supabase = supabase;
    }

    private static TimeZoneInfo ResolveDanishTimeZone()
    {
        var candidateIds = new[] { "Romance Standard Time", "W. Europe Standard Time", "Europe/Copenhagen" };

        foreach (var id in candidateIds)
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(id);
            }
            catch (TimeZoneNotFoundException)
            {
            }
            catch (InvalidTimeZoneException)
            {
            }
        }

        return TimeZoneInfo.Local;
    }

    private static DateTime? NormalizeDateTimeForStorage(DateTime? value)
    {
        if (!value.HasValue)
            return null;

        var normalized = value.Value;

        if (normalized.Kind == DateTimeKind.Utc)
        {
            normalized = TimeZoneInfo.ConvertTimeFromUtc(normalized, DanishTimeZone);
        }
        else if (normalized.Kind == DateTimeKind.Local)
        {
            normalized = TimeZoneInfo.ConvertTime(normalized, DanishTimeZone);
        }

        return DateTime.SpecifyKind(normalized, DateTimeKind.Unspecified);
    }

    private static DateTime? NormalizeDateOnlyForStorage(DateTime? value)
    {
        var normalized = NormalizeDateTimeForStorage(value);
        return normalized?.Date;
    }

    private sealed class ExistingBooking
    {
        public int EventId { get; init; }
        public string EventName { get; init; } = "Ukendt event";
        public int LocationId { get; init; }
        public DateTime Start { get; init; }
        public DateTime End { get; init; }
    }

    private sealed class RequestedBooking
    {
        public int LocationId { get; init; }
        public DateTime Start { get; init; }
        public DateTime End { get; init; }
    }

    private static bool Overlaps(DateTime startA, DateTime endA, DateTime startB, DateTime endB)
        => startA < endB && endA > startB;

    private static List<RequestedBooking> BuildRequestedBookings(CreateEventDto dto)
    {
        var requested = new List<RequestedBooking>();
        if (dto.IsDraft || dto.Locations == null || dto.Locations.Count == 0)
            return requested;

        var validLocations = dto.Locations
            .Where(l => l.LocationId.HasValue && l.StartTime.HasValue && l.EndTime.HasValue)
            .Select(l => new
            {
                LocationId = l.LocationId!.Value,
                Start = l.StartTime!.Value,
                End = l.EndTime!.Value
            })
            .ToList();

        if (!dto.IsRecurring)
        {
            requested.AddRange(validLocations.Select(l => new RequestedBooking
            {
                LocationId = l.LocationId,
                Start = l.Start,
                End = l.End
            }));
            return requested;
        }

        if (string.IsNullOrWhiteSpace(dto.RecurrenceFrequency) || dto.RecurrenceEndDate == null || dto.StartTime == null)
        {
            requested.AddRange(validLocations.Select(l => new RequestedBooking
            {
                LocationId = l.LocationId,
                Start = l.Start,
                End = l.End
            }));
            return requested;
        }

        var frequency = ParseRecurrenceFrequency(dto.RecurrenceFrequency);
        var rule = new RecurrenceRule(frequency, dto.RecurrenceEndDate.Value);
        var baseStart = dto.StartTime.Value;
        var occurrences = rule.GenerateOccurrences(baseStart);

        foreach (var occurrence in occurrences)
        {
            var day = occurrence.Date;
            foreach (var loc in validLocations)
            {
                var occStart = day + loc.Start.TimeOfDay;
                var occEnd = day + loc.End.TimeOfDay;

                if (occStart >= occEnd)
                    continue;

                requested.Add(new RequestedBooking
                {
                    LocationId = loc.LocationId,
                    Start = occStart,
                    End = occEnd
                });
            }
        }

        return requested;
    }

    private static List<ExistingBooking> BuildExistingBookings(IEnumerable<Event> events)
    {
        var bookings = new List<ExistingBooking>();

        foreach (var evt in events)
        {
            var eventName = string.IsNullOrWhiteSpace(evt.Name) ? "Ukendt event" : evt.Name;

            if (evt.EventLocations != null && evt.EventLocations.Count > 0)
            {
                foreach (var loc in evt.EventLocations)
                {
                    if (!loc.LocationId.HasValue || !loc.StartTime.HasValue || !loc.EndTime.HasValue)
                        continue;

                    bookings.Add(new ExistingBooking
                    {
                        EventId = evt.Id,
                        EventName = eventName,
                        LocationId = loc.LocationId.Value,
                        Start = loc.StartTime.Value,
                        End = loc.EndTime.Value
                    });
                }
            }
            else if (evt.LocationId.HasValue && evt.StartTime.HasValue && evt.EndTime.HasValue)
            {
                bookings.Add(new ExistingBooking
                {
                    EventId = evt.Id,
                    EventName = eventName,
                    LocationId = evt.LocationId.Value,
                    Start = evt.StartTime.Value,
                    End = evt.EndTime.Value
                });
            }
        }

        return bookings;
    }

    private async Task ValidateNoLocationConflictsAsync(CreateEventDto dto, int? excludeEventId = null, string? accessToken = null)
    {
        var requestedBookings = BuildRequestedBookings(dto);
        if (requestedBookings.Count == 0)
            return;

        List<Event> existingEvents;

        if (_supabase != null && _context == null)
        {
            existingEvents = await GetAllAsync(accessToken);
        }
        else if (_context == null)
        {
            existingEvents = _testEvents.ToList();
        }
        else
        {
            existingEvents = await _context.Events
                .Include(e => e.EventLocations)
                .Where(e => e.IsCancelled != true)
                .Where(e => e.IsDraft != true)
                .Where(e => !excludeEventId.HasValue || e.Id != excludeEventId.Value)
                .ToListAsync();
        }

        var candidateEvents = existingEvents
            .Where(e => e.IsCancelled != true)
            .Where(e => e.IsDraft != true)
            .Where(e => !excludeEventId.HasValue || e.Id != excludeEventId.Value)
            .ToList();

        var existingBookings = BuildExistingBookings(candidateEvents);

        foreach (var booking in requestedBookings)
        {
            var conflict = existingBookings.FirstOrDefault(existing =>
                existing.LocationId == booking.LocationId &&
                Overlaps(booking.Start, booking.End, existing.Start, existing.End));

            if (conflict != null)
            {
                throw new ArgumentException(
                    $"Lokation {booking.LocationId} er allerede booket {booking.Start:dd-MM-yyyy HH:mm}-{booking.End:HH:mm} (konflikt med \"{conflict.EventName}\").");
            }
        }
    }

    // Supabase client serialization may re-interpret unspecified/local DateTime values.
    // Marking as UTC without changing the clock time prevents a second timezone conversion.
    private static DateTime? PinForSupabase(DateTime? value)
    {
        if (!value.HasValue)
            return null;

        return DateTime.SpecifyKind(value.Value, DateTimeKind.Utc);
    }

    private static CreateEventDto NormalizeForStorage(CreateEventDto dto)
    {
        var normalizedLocations = (dto.Locations ?? new List<LocationBookingDto>())
            .Select(loc => new LocationBookingDto(
                loc.LocationId,
                NormalizeDateTimeForStorage(loc.StartTime),
                NormalizeDateTimeForStorage(loc.EndTime),
                NormalizeDateOnlyForStorage(loc.Date)))
            .ToList();

        return dto with
        {
            StartTime = NormalizeDateTimeForStorage(dto.StartTime),
            EndTime = NormalizeDateTimeForStorage(dto.EndTime),
            Date = NormalizeDateOnlyForStorage(dto.Date),
            RecurrenceEndDate = NormalizeDateTimeForStorage(dto.RecurrenceEndDate),
            Locations = normalizedLocations
        };
    }

    // Validation helper for non-draft events
    private static void ValidateNonDraftLocations(List<LocationBookingDto> locations, bool isDraft)
    {
        if (!isDraft)
        {
            foreach (var loc in locations)
            {
                if (loc.LocationId == null)
                    throw new ArgumentException("Lokation-ID er påkrævet for ikke-kladde events.");

                if (loc.StartTime == null || loc.EndTime == null)
                    throw new ArgumentException($"Lokation {loc.LocationId} skal have både start- og sluttid for ikke-kladde events.");

                if (loc.StartTime >= loc.EndTime)
                    throw new ArgumentException($"Lokation {loc.LocationId} har ugyldige tidsintervaller (Start skal være før Slut).");
            }
        }
        else
        {
            // For drafts tillades lokation uden tider.
            foreach (var loc in locations)
            {
                if (loc.LocationId == null && (loc.StartTime != null || loc.EndTime != null))
                {
                    throw new ArgumentException("Tider kan ikke angives uden LocationId.");
                }

                if ((loc.StartTime == null) != (loc.EndTime == null))
                {
                    throw new ArgumentException("Hvis tid angives på en draft-lokation, skal både StartTime og EndTime være udfyldt.");
                }

                if (loc.StartTime != null && loc.EndTime != null && loc.StartTime >= loc.EndTime)
                {
                    throw new ArgumentException("StartTime skal være før EndTime.");
                }
            }
        }
    }

    private static RecurrenceFrequency ParseRecurrenceFrequency(string value)
    {
        if (!Enum.TryParse<RecurrenceFrequency>(value, true, out var result))
            throw new ArgumentException($"Ugyldig RecurrenceFrequency: {value}");
        return result;
    }

    private static void ValidateRecurrence(CreateEventDto dto)
    {
        if (!dto.IsRecurring) return;

        if (string.IsNullOrWhiteSpace(dto.RecurrenceFrequency))
            throw new ArgumentException("RecurrenceFrequency er påkrævet for gentagende aktiviteter.");

        if (dto.RecurrenceEndDate == null)
            throw new ArgumentException("RecurrenceEndDate er påkrævet for gentagende aktiviteter.");

        if (!Enum.TryParse<RecurrenceFrequency>(dto.RecurrenceFrequency, true, out _))
            throw new ArgumentException("Ugyldig RecurrenceFrequency. Brug DAGLIG, UGENTLIG eller MAANEDLIG.");

        if (dto.StartTime.HasValue && dto.RecurrenceEndDate.Value.Date < dto.StartTime.Value.Date)
            throw new ArgumentException("RecurrenceEndDate skal være samme dato eller efter StartTime.");
    }

    private static void ValidateDraftPublishRequirements(CreateEventDto dto)
    {
        if (dto.StartTime == null || dto.EndTime == null)
            throw new ArgumentException("StartTime og EndTime er påkrævet for at publicere en kladde.");

        if (dto.StartTime >= dto.EndTime)
            throw new ArgumentException("Eventets StartTime skal være før EndTime.");

        foreach (var loc in dto.Locations)
        {
            if (loc.LocationId == null)
                throw new ArgumentException("Alle lokationer skal have LocationId for at publicere en kladde.");

            if (loc.StartTime == null || loc.EndTime == null)
                throw new ArgumentException($"Lokation {loc.LocationId} mangler start/slut-tid og kan ikke publiceres.");

            if (loc.StartTime >= loc.EndTime)
                throw new ArgumentException($"Lokation {loc.LocationId} har ugyldigt tidsinterval (StartTime skal være før EndTime).");
        }
    }

    public async Task<EventResponseDto> CreateAsync(CreateEventDto dto, string? accessToken = null)
    {
        dto = NormalizeForStorage(dto);
        ValidateNonDraftLocations(dto.Locations, dto.IsDraft);
        ValidateRecurrence(dto);
        await ValidateNoLocationConflictsAsync(dto, null, accessToken);

        if (_supabase != null && _context == null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
            }

            var nextEventId = await GetNextSupabaseEventIdAsync();
            var nextEventLocationId = await GetNextSupabaseEventLocationIdAsync();

            if (!dto.IsRecurring)
            {
                var newEvent = new Event(
                    dto.Name,
                    dto.Description,
                    PinForSupabase(dto.StartTime),
                    PinForSupabase(dto.EndTime),
                    dto.Category,
                    dto.TemplateId,
                    null,
                    nextEventId
                )
                {
                    IsDraft = dto.IsDraft,
                    Date = dto.Date ?? dto.StartTime?.Date
                };

                var createdEvent = (await _supabase.From<Event>().Insert(newEvent)).Models.First();

                var createdLocations = new List<LocationBookingDto>();
                foreach (var loc in dto.Locations)
                {
                    var eventLocation = new EventLocation
                    {
                        Id = nextEventLocationId,
                        EventId = createdEvent.Id,
                        LocationId = loc.LocationId,
                        StartTime = PinForSupabase(loc.StartTime),
                        EndTime = PinForSupabase(loc.EndTime),
                        Date = loc.Date ?? dto.Date ?? loc.StartTime?.Date ?? createdEvent.Date
                    };

                    await _supabase.From<EventLocation>().Insert(eventLocation);
                    nextEventLocationId++;
                    createdLocations.Add(new LocationBookingDto(loc.LocationId, loc.StartTime, loc.EndTime, loc.Date ?? dto.Date));
                }

                return new EventResponseDto(
                    createdEvent.Id,
                    createdEvent.Name,
                    createdEvent.Description ?? string.Empty,
                    createdEvent.StartTime,
                    createdEvent.EndTime,
                    createdEvent.Date,
                    createdEvent.Category.ToString(),
                    createdEvent.SeriesId,
                    createdEvent.IsModifiedFromSeries ?? false,
                    createdEvent.IsCancelled ?? false,
                    createdEvent.IsDraft ?? false,
                    createdLocations,
                    createdEvent.TemplateId,
                    createdEvent.AssociationId
                );
            }

            var frequency = ParseRecurrenceFrequency(dto.RecurrenceFrequency);
            var rule = new RecurrenceRule(frequency, dto.RecurrenceEndDate.Value);
            var baseStart = dto.StartTime ?? DateTime.Now;
            var baseEnd = dto.EndTime ?? baseStart.AddHours(1);
            var occurrences = rule.GenerateOccurrences(baseStart);
            var duration = baseEnd - baseStart;

            Event? firstCreatedEvent = null;
            List<LocationBookingDto> firstCreatedLocations = new();

            foreach (var date in occurrences)
            {
                DateTime? eventStart = dto.IsDraft ? null : date;
                DateTime? eventEnd = dto.IsDraft ? null : date.Add(duration);

                var recurringEvent = new Event(
                    dto.Name,
                    dto.Description,
                    PinForSupabase(eventStart),
                    PinForSupabase(eventEnd),
                    dto.Category,
                    dto.TemplateId,
                    null,
                    nextEventId
                )
                {
                    IsDraft = dto.IsDraft,
                    Date = date.Date
                };

                var createdRecurringEvent = (await _supabase.From<Event>().Insert(recurringEvent)).Models.First();
                nextEventId++;

                var currentLocations = new List<LocationBookingDto>();
                foreach (var loc in dto.Locations)
                {
                    DateTime? locStart;
                    DateTime? locEnd;

                    if (dto.IsDraft)
                    {
                        locStart = PinForSupabase(loc.StartTime);
                        locEnd = PinForSupabase(loc.EndTime);
                    }
                    else
                    {
                        var occDate = date.Date;
                        locStart = PinForSupabase(occDate + (loc.StartTime?.TimeOfDay ?? TimeSpan.Zero));
                        locEnd = PinForSupabase(occDate + (loc.EndTime?.TimeOfDay ?? TimeSpan.Zero));
                    }

                    var eventLocation = new EventLocation
                    {
                        Id = nextEventLocationId,
                        EventId = createdRecurringEvent.Id,
                        LocationId = loc.LocationId,
                        StartTime = locStart,
                        EndTime = locEnd,
                        Date = loc.Date ?? date.Date
                    };

                    await _supabase.From<EventLocation>().Insert(eventLocation);
                    nextEventLocationId++;
                    currentLocations.Add(new LocationBookingDto(loc.LocationId, locStart, locEnd, loc.Date ?? date.Date));
                }

                if (firstCreatedEvent == null)
                {
                    firstCreatedEvent = createdRecurringEvent;
                    firstCreatedLocations = currentLocations;
                }
            }

            if (firstCreatedEvent == null)
            {
                throw new InvalidOperationException("Kunne ikke oprette gentagende events.");
            }

            return new EventResponseDto(
                firstCreatedEvent.Id,
                firstCreatedEvent.Name,
                firstCreatedEvent.Description ?? string.Empty,
                firstCreatedEvent.StartTime,
                firstCreatedEvent.EndTime,
                firstCreatedEvent.Date,
                firstCreatedEvent.Category.ToString(),
                firstCreatedEvent.SeriesId,
                firstCreatedEvent.IsModifiedFromSeries ?? false,
                firstCreatedEvent.IsCancelled ?? false,
                firstCreatedEvent.IsDraft ?? false,
                firstCreatedLocations,
                firstCreatedEvent.TemplateId,
                firstCreatedEvent.AssociationId
            );
        }

        if (_context == null)
        {
            var created = await CreateEventAsync(
                dto.Name,
                dto.Description,
                dto.StartTime,
                dto.EndTime,
                dto.Category,
                dto.Locations,
                dto.TemplateId,
                dto.CreatedBy,
                dto.IsRecurring,
                dto.RecurrenceFrequency,
                dto.RecurrenceEndDate,
                dto.IsDraft
            );

            return ToEventResponseDto(created);
        }

        // Enkeltstående Event
        if (!dto.IsRecurring)
        {
            var newEvent = new Event(
                dto.Name,
                dto.Description,
                dto.StartTime,
                dto.EndTime,
                dto.Category,
                dto.TemplateId,
                null,
                0
            )
            {
                IsDraft = dto.IsDraft,
                Date = dto.Date ?? dto.StartTime?.Date
            };

            foreach (var loc in dto.Locations)
            {
                newEvent.EventLocations.Add(new EventLocation
                {
                    LocationId = loc.LocationId ?? 0,
                    StartTime = loc.StartTime,
                    EndTime = loc.EndTime,
                    Date = loc.Date ?? dto.Date ?? loc.StartTime?.Date ?? newEvent.Date
                });
            }

            _context.Events.Add(newEvent);
            await _context.SaveChangesAsync();

            var locationDtos = newEvent.EventLocations
                .Select(el => new LocationBookingDto(el.LocationId, el.StartTime, el.EndTime, el.Date))
                .ToList();

            return new EventResponseDto(
                newEvent.Id,
                newEvent.Name,
                newEvent.Description ?? "",
                newEvent.StartTime,
                newEvent.EndTime,
                newEvent.Date,
                newEvent.Category.ToString(),
                newEvent.SeriesId,
                newEvent.IsModifiedFromSeries ?? false,
                newEvent.IsCancelled ?? false,
                newEvent.IsDraft ?? false,
                locationDtos,
                newEvent.TemplateId,
                newEvent.AssociationId
            );
        }
        else // Gentagende event (Event Series)
        {
            var frequency = ParseRecurrenceFrequency(dto.RecurrenceFrequency);
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
                    dto.IsDraft ? null : date,
                    dto.IsDraft ? null : date.Add(duration),
                    dto.Category,
                    dto.TemplateId,
                    series.Id,
                    0
                )
                {
                    IsDraft = dto.IsDraft,
                    Date = date.Date
                };

                // Tilføj lokationer for hver forekomst, juster datoer til forekomstdato
                foreach (var loc in dto.Locations)
                {
                    if (dto.IsDraft)
                    {
                        // For kladder beholder vi de angivede tidspunkter (som kan være null)
                        eventInstance.EventLocations.Add(new EventLocation
                        {
                            LocationId = loc.LocationId ?? 0,
                            StartTime = loc.StartTime,
                            EndTime = loc.EndTime,
                            Date = loc.Date ?? date.Date
                        });
                    }
                    else
                    {
                        var occDate = date.Date;
                        var locStart = occDate + (loc.StartTime?.TimeOfDay ?? TimeSpan.Zero);
                        var locEnd = occDate + (loc.EndTime?.TimeOfDay ?? TimeSpan.Zero);

                        eventInstance.EventLocations.Add(new EventLocation
                        {
                            LocationId = loc.LocationId ?? 0,
                            StartTime = locStart,
                            EndTime = locEnd,
                            Date = loc.Date ?? occDate
                        });
                    }
                }

                series.Events.Add(eventInstance);
                _context.Events.Add(eventInstance);
            }

            await _context.SaveChangesAsync();

            var firstOccurrence = series.Events.First();
            var locationDtos = firstOccurrence.EventLocations
                .Select(el => new LocationBookingDto(el.LocationId, el.StartTime, el.EndTime, el.Date))
                .ToList();

            return new EventResponseDto(
                firstOccurrence.Id,
                firstOccurrence.Name,
                firstOccurrence.Description ?? "",
                firstOccurrence.StartTime,
                firstOccurrence.EndTime,
                firstOccurrence.Date,
                firstOccurrence.Category.ToString(),
                firstOccurrence.SeriesId,
                firstOccurrence.IsModifiedFromSeries ?? false,
                firstOccurrence.IsCancelled ?? false,
                firstOccurrence.IsDraft ?? false,
                locationDtos,
                firstOccurrence.TemplateId,
                firstOccurrence.AssociationId
            );
        }
    }

    private async Task<int> GetNextSupabaseEventIdAsync()
    {
        var existingEvents = (await _supabase!
            .From<Event>()
            .Select("event_id")
            .Get()).Models;
        return existingEvents.Count == 0 ? 1 : existingEvents.Max(e => e.Id) + 1;
    }

    private async Task<int> GetNextSupabaseEventLocationIdAsync()
    {
        var existingLocations = (await _supabase!
            .From<EventLocation>()
            .Select("eventlocations_id")
            .Get()).Models;
        return existingLocations.Count == 0 ? 1 : existingLocations.Max(l => l.Id) + 1;
    }

    public async Task<List<Event>> GetAllAsync(string? accessToken = null)
    {
        if (_supabase != null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
            }

            var eventsResult = await _supabase.From<Event>().Get();
            var locationsResult = await _supabase.From<Location>().Get();
            var eventLocationsResult = await _supabase.From<EventLocation>().Get();

            var events = eventsResult.Models;
            var locationsById = locationsResult.Models.ToDictionary(l => l.Id, l => l);
            var locationRows = eventLocationsResult.Models;

            foreach (var evt in events)
            {
                var rows = locationRows.Where(el => el.EventId == evt.Id).ToList();

                foreach (var row in rows)
                {
                    if (row.LocationId.HasValue && locationsById.TryGetValue(row.LocationId.Value, out var location))
                    {
                        row.Location = location;
                    }
                }

                evt.EventLocations = rows;
            }

            return events;
        }

        if (_context == null)
        {
            return await Task.FromResult(_testEvents.ToList());
        }

        return await _context.Events
            .Include(e => e.EventLocations)
            .ThenInclude(el => el.Location)
            .ToListAsync();
    }

    public async Task<Event?> GetByIdAsync(int id, string? accessToken = null)
    {
        var allEvents = await GetAllAsync(accessToken);
        return allEvents.FirstOrDefault(e => e.Id == id);
    }

    // Get draft events
    public async Task<List<Event>> GetDraftEventsAsync(string? accessToken = null)
    {
        if (_supabase != null)
        {
            var allEvents = await GetAllAsync(accessToken);
            return allEvents.Where(e => e.IsDraft == true).ToList();
        }

        if (_context == null)
        {
            return await Task.FromResult(_testEvents.Where(e => e.IsDraft == true).ToList());
        }

        return await _context.Events
            .Include(e => e.EventLocations)
            .ThenInclude(el => el.Location)
            .Where(e => e.IsDraft == true)
            .ToListAsync();
    }

    // Quick update draft: fill in missing data and mark as non-draft
    public async Task<EventResponseDto> UpdateAsync(int eventId, CreateEventDto updateDto, string? accessToken = null)
    {
        updateDto = NormalizeForStorage(updateDto);
        ValidateNonDraftLocations(updateDto.Locations, updateDto.IsDraft);
        await ValidateNoLocationConflictsAsync(updateDto, eventId, accessToken);

        if (_supabase != null && _context == null)
        {
            if (!string.IsNullOrEmpty(accessToken))
            {
                await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");
            }

            var existingEventResponse = await _supabase.From<Event>()
                .Where(x => x.Id == eventId)
                .Get();

            var existingEvent = existingEventResponse.Models.FirstOrDefault();
            if (existingEvent == null)
            {
                throw new KeyNotFoundException($"Event with ID {eventId} not found.");
            }

            var isPublishingDraft = existingEvent.IsDraft == true && updateDto.IsDraft == false;
            if (isPublishingDraft)
            {
                ValidateDraftPublishRequirements(updateDto);
            }

            var updateQuery = _supabase.From<Event>()
                .Where(x => x.Id == eventId)
                .Set(x => x.Name, updateDto.Name)
                .Set(x => x.Description, updateDto.Description)
                .Set(x => x.StartTime, PinForSupabase(updateDto.StartTime))
                .Set(x => x.EndTime, PinForSupabase(updateDto.EndTime))
                .Set(x => x.Date, updateDto.Date ?? updateDto.StartTime?.Date)
                .Set(x => x.Category, updateDto.Category)
                .Set(x => x.IsDraft, updateDto.IsDraft)
                .Set(x => x.LocationId, updateDto.Locations.FirstOrDefault()?.LocationId);

            await updateQuery.Update();

            var existingLocationRows = (await _supabase.From<EventLocation>()
                .Where(x => x.EventId == eventId)
                .Get()).Models;

            foreach (var row in existingLocationRows)
            {
                await _supabase.From<EventLocation>()
                    .Where(x => x.Id == row.Id)
                    .Delete();
            }

            var nextEventLocationId = await GetNextSupabaseEventLocationIdAsync();
            var createdLocations = new List<LocationBookingDto>();

            foreach (var loc in updateDto.Locations)
            {
                var eventLocation = new EventLocation
                {
                    Id = nextEventLocationId,
                    EventId = eventId,
                    LocationId = loc.LocationId,
                    StartTime = PinForSupabase(loc.StartTime),
                    EndTime = PinForSupabase(loc.EndTime),
                    Date = loc.Date ?? updateDto.Date ?? loc.StartTime?.Date ?? existingEvent.Date
                };

                await _supabase.From<EventLocation>().Insert(eventLocation);
                nextEventLocationId++;

                createdLocations.Add(new LocationBookingDto(loc.LocationId, loc.StartTime, loc.EndTime, loc.Date ?? updateDto.Date));
            }

            return new EventResponseDto(
                eventId,
                updateDto.Name,
                updateDto.Description ?? string.Empty,
                updateDto.StartTime,
                updateDto.EndTime,
                updateDto.Date ?? updateDto.StartTime?.Date,
                updateDto.Category.ToString(),
                existingEvent.SeriesId,
                existingEvent.IsModifiedFromSeries ?? false,
                existingEvent.IsCancelled ?? false,
                updateDto.IsDraft,
                createdLocations,
                existingEvent.TemplateId,
                existingEvent.AssociationId
            );
        }

        if (_context == null)
        {
            var existingTestEvent = _testEvents.FirstOrDefault(e => e.Id == eventId);
            if (existingTestEvent == null)
            {
                throw new KeyNotFoundException($"Event with ID {eventId} not found.");
            }

            var isPublishingDraft = existingTestEvent.IsDraft == true && updateDto.IsDraft == false;
            if (isPublishingDraft)
            {
                ValidateDraftPublishRequirements(updateDto);
            }

            existingTestEvent.Name = updateDto.Name;
            existingTestEvent.Description = updateDto.Description;
            existingTestEvent.StartTime = updateDto.StartTime;
            existingTestEvent.EndTime = updateDto.EndTime;
            existingTestEvent.Date = updateDto.Date ?? updateDto.StartTime?.Date;
            existingTestEvent.Category = updateDto.Category;
            existingTestEvent.IsDraft = updateDto.IsDraft;
            existingTestEvent.LocationId = updateDto.Locations.FirstOrDefault()?.LocationId;

            existingTestEvent.EventLocations.Clear();
            foreach (var loc in updateDto.Locations)
            {
                existingTestEvent.EventLocations.Add(new EventLocation
                {
                    LocationId = loc.LocationId ?? 0,
                    StartTime = loc.StartTime,
                    EndTime = loc.EndTime,
                    Date = loc.Date ?? updateDto.Date ?? loc.StartTime?.Date ?? existingTestEvent.Date
                });
            }

            return ToEventResponseDto(existingTestEvent);
        }

        var existingEventDb = await _context.Events
            .Include(e => e.EventLocations)
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (existingEventDb == null)
        {
            throw new KeyNotFoundException($"Event with ID {eventId} not found.");
        }

        var isPublishingDraftFromDb = existingEventDb.IsDraft == true && updateDto.IsDraft == false;
        if (isPublishingDraftFromDb)
        {
            ValidateDraftPublishRequirements(updateDto);
        }

        existingEventDb.Name = updateDto.Name;
        existingEventDb.Description = updateDto.Description;
        existingEventDb.StartTime = updateDto.StartTime;
        existingEventDb.EndTime = updateDto.EndTime;
        existingEventDb.Date = updateDto.Date ?? updateDto.StartTime?.Date;
        existingEventDb.Category = updateDto.Category;
        existingEventDb.IsDraft = updateDto.IsDraft;
        existingEventDb.LocationId = updateDto.Locations.FirstOrDefault()?.LocationId;

        _context.EventLocations.RemoveRange(existingEventDb.EventLocations);
        existingEventDb.EventLocations.Clear();

        foreach (var loc in updateDto.Locations)
        {
            existingEventDb.EventLocations.Add(new EventLocation
            {
                LocationId = loc.LocationId ?? 0,
                StartTime = loc.StartTime,
                EndTime = loc.EndTime,
                Date = loc.Date ?? updateDto.Date ?? loc.StartTime?.Date ?? existingEventDb.Date
            });
        }

        await _context.SaveChangesAsync();
        return ToEventResponseDto(existingEventDb);
    }

    public async Task<List<EventResponseDto>> UpdateSeriesAsync(int seriesId, CreateEventDto updateDto, string? accessToken = null)
    {
        updateDto = NormalizeForStorage(updateDto);

        if (_supabase != null && _context == null)
        {
            if (!string.IsNullOrEmpty(accessToken))
                await _supabase.Auth.SetSession(accessToken, "refresh-token-not-needed");

            var seriesEventsResponse = await _supabase.From<Event>()
                .Where(x => x.SeriesId == seriesId)
                .Get();

            var seriesEvents = seriesEventsResponse.Models;
            if (!seriesEvents.Any())
                throw new KeyNotFoundException($"Ingen events fundet i serie med ID {seriesId}.");

            var results = new List<EventResponseDto>();

            foreach (var ev in seriesEvents)
            {
                await _supabase.From<Event>()
                    .Where(x => x.Id == ev.Id)
                    .Set(x => x.Name, updateDto.Name)
                    .Set(x => x.Description, updateDto.Description)
                    .Set(x => x.Category, updateDto.Category)
                    .Set(x => x.IsDraft, updateDto.IsDraft)
                    .Update();

                var existingLocations = (await _supabase.From<EventLocation>()
                    .Where(x => x.EventId == ev.Id)
                    .Get()).Models;

                foreach (var row in existingLocations)
                    await _supabase.From<EventLocation>().Where(x => x.Id == row.Id).Delete();

                var nextId = await GetNextSupabaseEventLocationIdAsync();
                var createdLocations = new List<LocationBookingDto>();

                foreach (var loc in updateDto.Locations)
                {
                    var eventLocation = new EventLocation
                    {
                        Id = nextId,
                        EventId = ev.Id,
                        LocationId = loc.LocationId,
                        StartTime = PinForSupabase(loc.StartTime),
                        EndTime = PinForSupabase(loc.EndTime),
                        Date = loc.Date ?? updateDto.Date ?? loc.StartTime?.Date ?? ev.Date
                    };
                    await _supabase.From<EventLocation>().Insert(eventLocation);
                    nextId++;
                    createdLocations.Add(new LocationBookingDto(loc.LocationId, loc.StartTime, loc.EndTime, loc.Date ?? updateDto.Date));
                }

                results.Add(new EventResponseDto(ev.Id, updateDto.Name, updateDto.Description ?? string.Empty,
                    ev.StartTime, ev.EndTime, ev.Date, updateDto.Category.ToString(),
                    ev.SeriesId, ev.IsModifiedFromSeries ?? false, ev.IsCancelled ?? false,
                    updateDto.IsDraft, createdLocations, ev.TemplateId, ev.AssociationId));
            }

            return results;
        }

        if (_context == null)
        {
            var seriesEvents = _testEvents.Where(e => e.SeriesId == seriesId).ToList();
            if (!seriesEvents.Any())
                throw new KeyNotFoundException($"Ingen events fundet i serie med ID {seriesId}.");

            foreach (var ev in seriesEvents)
            {
                ev.Name = updateDto.Name;
                ev.Description = updateDto.Description;
                ev.Category = updateDto.Category;
                ev.IsDraft = updateDto.IsDraft;
            }

            return seriesEvents.Select(ToEventResponseDto).ToList();
        }

        var dbEvents = await _context.Events
            .Include(e => e.EventLocations)
            .Where(e => e.SeriesId == seriesId)
            .ToListAsync();

        if (!dbEvents.Any())
            throw new KeyNotFoundException($"Ingen events fundet i serie med ID {seriesId}.");

        foreach (var ev in dbEvents)
        {
            ev.Name = updateDto.Name;
            ev.Description = updateDto.Description;
            ev.Category = updateDto.Category;
            ev.IsDraft = updateDto.IsDraft;

            _context.EventLocations.RemoveRange(ev.EventLocations);
            ev.EventLocations.Clear();

            foreach (var loc in updateDto.Locations)
            {
                ev.EventLocations.Add(new EventLocation
                {
                    LocationId = loc.LocationId ?? 0,
                    StartTime = loc.StartTime,
                    EndTime = loc.EndTime,
                    Date = loc.Date ?? updateDto.Date ?? loc.StartTime?.Date ?? ev.Date
                });
            }
        }

        await _context.SaveChangesAsync();
        return dbEvents.Select(ToEventResponseDto).ToList();
    }

    public async Task<EventResponseDto> PublishDraftAsync(int eventId, CreateEventDto updateDto)
    {
        updateDto = NormalizeForStorage(updateDto);
        await ValidateNoLocationConflictsAsync(updateDto, eventId);
        if (_context == null)
        {
            var existingTestEvent = _testEvents.FirstOrDefault(e => e.Id == eventId);

            if (existingTestEvent == null)
                throw new KeyNotFoundException($"Event with ID {eventId} not found.");

            if (existingTestEvent.IsDraft != true)
                throw new InvalidOperationException($"Event {eventId} is not a draft and cannot be published this way.");

            ValidateDraftPublishRequirements(updateDto);

            existingTestEvent.StartTime = updateDto.StartTime;
            existingTestEvent.EndTime = updateDto.EndTime;
            existingTestEvent.Date = updateDto.Date ?? updateDto.StartTime?.Date;
            existingTestEvent.IsDraft = false;

            existingTestEvent.EventLocations.Clear();
            foreach (var loc in updateDto.Locations)
            {
                existingTestEvent.EventLocations.Add(new EventLocation
                {
                    LocationId = loc.LocationId ?? 0,
                    StartTime = loc.StartTime,
                    EndTime = loc.EndTime,
                    Date = loc.Date ?? updateDto.Date ?? loc.StartTime?.Date ?? existingTestEvent.Date
                });
            }

            return ToEventResponseDto(existingTestEvent);
        }

        var existingEvent = await _context.Events
            .Include(e => e.EventLocations)
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (existingEvent == null)
            throw new KeyNotFoundException($"Event with ID {eventId} not found.");

        if (existingEvent.IsDraft != true)
            throw new InvalidOperationException($"Event {eventId} is not a draft and cannot be published this way.");

        // Validate that all required fields are now provided
        ValidateDraftPublishRequirements(updateDto);

        // Update event properties
        existingEvent.StartTime = updateDto.StartTime;
        existingEvent.EndTime = updateDto.EndTime;
        existingEvent.Date = updateDto.Date ?? updateDto.StartTime?.Date;
        existingEvent.IsDraft = false;

        // Clear existing locations and add updated ones
        _context.EventLocations.RemoveRange(existingEvent.EventLocations);
        existingEvent.EventLocations.Clear();

        foreach (var loc in updateDto.Locations)
        {
            existingEvent.EventLocations.Add(new EventLocation
            {
                LocationId = loc.LocationId ?? 0,
                StartTime = loc.StartTime,
                EndTime = loc.EndTime,
                Date = loc.Date ?? updateDto.Date ?? loc.StartTime?.Date ?? existingEvent.Date
            });
        }

        await _context.SaveChangesAsync();

        var locationDtos = existingEvent.EventLocations
            .Select(el => new LocationBookingDto(el.LocationId, el.StartTime, el.EndTime, el.Date))
            .ToList();

        return new EventResponseDto(
            existingEvent.Id,
            existingEvent.Name,
            existingEvent.Description ?? "",
            existingEvent.StartTime,
            existingEvent.EndTime,
            existingEvent.Date,
            existingEvent.Category.ToString(),
            existingEvent.SeriesId,
            existingEvent.IsModifiedFromSeries ?? false,
            existingEvent.IsCancelled ?? false,
            existingEvent.IsDraft ?? false,
            locationDtos,
            existingEvent.TemplateId,
            existingEvent.AssociationId
        );
    }

    private static EventResponseDto ToEventResponseDto(Event source)
    {
        var locationDtos = source.EventLocations
            .Select(el => new LocationBookingDto(el.LocationId, el.StartTime, el.EndTime, el.Date))
            .ToList();

        return new EventResponseDto(
            source.Id,
            source.Name,
            source.Description ?? string.Empty,
            source.StartTime,
            source.EndTime,
            source.Date,
            source.Category.ToString(),
            source.SeriesId,
            source.IsModifiedFromSeries ?? false,
            source.IsCancelled ?? false,
            source.IsDraft ?? false,
            locationDtos,
            source.TemplateId,
            source.AssociationId
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
                    LocationId = loc.LocationId ?? 0,
                    StartTime = loc.StartTime,
                    EndTime = loc.EndTime
                });
            }

            _testEvents.Add(newEvent);
            return await Task.FromResult(newEvent);
        }
        else
        {
            var frequency = ParseRecurrenceFrequency(recurrenceFrequency);
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
                            LocationId = loc.LocationId ?? 0,
                            StartTime = loc.StartTime,
                            EndTime = loc.EndTime
                        });
                    }
                    else
                    {
                        var occDate = date.Date;
                        var locStart = occDate + (loc.StartTime?.TimeOfDay ?? TimeSpan.Zero);
                        var locEnd = occDate + (loc.EndTime?.TimeOfDay ?? TimeSpan.Zero);

                        eventInstance.EventLocations.Add(new EventLocation
                        {
                            LocationId = loc.LocationId ?? 0,
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
