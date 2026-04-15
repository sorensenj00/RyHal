using SportCenter.Api.Models;

namespace SportCenter.Api.DTOs;

public record LocationBookingDto(int? LocationId, DateTime? StartTime, DateTime? EndTime);

public record EventResponseDto(
    int Id,
    string Name,
    string Description,
    DateTime? StartTime,
    DateTime? EndTime,
    string Category,
    int? SeriesId,
    bool IsModifiedFromSeries,
    bool IsCancelled,
    bool IsDraft,
    List<LocationBookingDto> Locations,
    int? TemplateId
);

public record CreateEventDto(
    string Name,
    string Description,
    DateTime? StartTime,
    DateTime? EndTime,
    EventCategory Category,
    List<LocationBookingDto> Locations,
    int? TemplateId,
    string CreatedBy,
    bool IsRecurring,
    string? RecurrenceFrequency,
    DateTime? RecurrenceEndDate,
    bool IsDraft = false
);