using SportCenter.Api.Models;
namespace SportCenter.Api.DTOs;

public record EventResponseDto(
    int Id, 
    string Name, 
    string Description, 
    DateTime StartTime, 
    DateTime EndTime, 
    string Category,
    int? SeriesId,
    bool IsModifiedFromSeries,
    bool IsCancelled,
    int LocationId,
    int? TemplateId,
    string CreatedBy
);

public record CreateEventDto(
    string Name, 
    string Description, 
    DateTime StartTime, 
    DateTime EndTime, 
    EventCategory Category, 
    int LocationId,
    int? TemplateId,
    string CreatedBy,
    bool IsRecurring,
    string? RecurrenceFrequency,
    DateTime? RecurrenceEndDate
);